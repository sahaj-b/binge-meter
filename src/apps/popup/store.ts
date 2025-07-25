import { create } from "zustand";
import type { Metadata } from "@/shared/types";
import {
  loadStorageData,
  sendToggleMessage,
  getCurrentTab,
  sendAddSiteMessage,
  checkSitePermission,
  sendRemoveSiteMessage,
  requestSitePermission,
  markURLAs,
  markSubredditAs,
  markChannelAs,
  markURLAsDistracting,
} from "../lib/browserService";
import { getStorageData } from "@/shared/store";
import {
  isChannelDistracting,
  isDistracting,
  isSubredditDistracting,
} from "@/shared/utils";

interface PopupState {
  dailyTime: number;
  overlayHidden: boolean;
  activeURL: URL | null;
  trackedSites: string[];
  thresholds: {
    warn: number | null;
    danger: number | null;
  };
  metadata: Metadata | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  isCurrentSiteTracked: boolean;
  isCurrentlyDistracting: boolean | null;
  isChannelOrSubredditDistracting: boolean | null;
  currentSite: string;
  aiEnabled: boolean;

  initialize: () => Promise<void>;
  updateDistractingStatuses: (metadata: Metadata) => Promise<void>;
  toggleOverlay: () => void;
  toggleAI: () => void;
  addSite: () => void;
  removeSite: () => void;
  requestPermission: () => void;
  markAs: (
    markDistracting: boolean,
    markChannelOrSubreddit?: boolean,
  ) => Promise<void>;
}

const usePopupStore = create<PopupState>((set, get) => ({
  dailyTime: 0,
  overlayHidden: false,
  activeURL: null,
  trackedSites: [],
  thresholds: { warn: 0, danger: 0 },
  metadata: null,
  isLoading: false,
  error: null,
  hasPermission: false,
  isCurrentSiteTracked: false,
  isCurrentlyDistracting: null,
  currentSite: "",
  isChannelOrSubredditDistracting: true,
  aiEnabled: false,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const data = await loadStorageData();
      const { aiEnabled } = await getStorageData(["aiEnabled"]);
      set({
        dailyTime: data.dailyTime,
        overlayHidden: data.overlayHidden,
        thresholds: data.thresholds,
        trackedSites: data.trackedSites,
        aiEnabled: aiEnabled,
      });

      const tab = await getCurrentTab();
      if (tab.url) {
        const url = new URL(tab.url);
        const site = getSiteFromURL(url);
        const isTracked = data.trackedSites.includes(site);
        const permission = await checkSitePermission(site);

        set({
          activeURL: url,
          currentSite: site,
          isCurrentSiteTracked: isTracked,
          hasPermission: permission,
        });

        if (isTracked) {
          if (
            (site.endsWith("youtube.com") &&
              (url.pathname.startsWith("/watch") ||
                url.pathname.startsWith("/@"))) ||
            (site.endsWith("reddit.com") && url.pathname.startsWith("/r/"))
          ) {
            if (tab.id) {
              const response = await chrome.tabs.sendMessage(tab.id, {
                type: "SEND_METADATA",
              });
              console.log("Metadata response:", response);
              if (response?.metadata) {
                console.log("Metadata received:", response.metadata);
                set({ metadata: response.metadata });
                get().updateDistractingStatuses(response.metadata);
              }
            }
          } else {
            const distracting = await isDistracting({ url: url.href });
            set({ isCurrentlyDistracting: distracting });
          }
        }
      }
    } catch (error) {
      console.error("Failed to initialize popup:", error);
      set({ error: "Failed to initialize" });
    } finally {
      set({ isLoading: false });
      setTimeout(async () => {
        const { dailyTime } = await getStorageData(["dailyTime"]);
        set({ dailyTime: dailyTime.total });
      }, 500);
    }
  },

  updateDistractingStatuses: async (metadata: Metadata) => {
    const distracting = await isDistracting(metadata);
    set({ isCurrentlyDistracting: distracting });

    const isYoutube = metadata.youtube?.channelId;
    const isReddit = metadata.reddit?.subreddit;
    if (!(isYoutube || isReddit))
      set({ isChannelOrSubredditDistracting: null });
    else {
      const isChannelOrSubredditDistracting = isYoutube
        ? (await isChannelDistracting(metadata.youtube?.channelId!)) && // not || coz: if channelId is P(false), thats final. if its D(true), then check channelName
          (await isChannelDistracting(metadata.youtube?.channelName || ""))
        : isReddit
          ? await isSubredditDistracting(metadata.reddit?.subreddit!)
          : true;
      set({ isChannelOrSubredditDistracting });
    }
  },

  toggleOverlay: () => {
    sendToggleMessage();
    set((state) => ({ overlayHidden: !state.overlayHidden }));
  },

  toggleAI: () => {
    const { aiEnabled } = get();
    chrome.storage.local.set({ aiEnabled: !aiEnabled });
    set({ aiEnabled: !aiEnabled });
  },

  addSite: () => {
    const { currentSite, trackedSites } = get();
    if (currentSite) {
      sendAddSiteMessage(currentSite);
      set({
        trackedSites: [...trackedSites, currentSite],
        isCurrentSiteTracked: true,
      });
    }
  },

  removeSite: () => {
    const { currentSite, trackedSites } = get();
    if (currentSite) {
      sendRemoveSiteMessage(currentSite);
      set({
        trackedSites: trackedSites.filter((site) => site !== currentSite),
        isCurrentSiteTracked: false,
      });
    }
  },

  requestPermission: async () => {
    const { currentSite } = get();
    if (currentSite) {
      try {
        await requestSitePermission(currentSite);
        set({ hasPermission: true });
      } catch (err) {
        console.error("Failed to request permission:", err);
        set({ error: "Failed to get permission" });
      }
    }
  },

  markAs: async (markDistracting: boolean, markChannelOrSubreddit = false) => {
    const { metadata, activeURL } = get();
    if (!metadata && !activeURL) return;

    set({ isLoading: true });
    try {
      const url = metadata?.url ?? activeURL?.href;
      if (url) {
        if (markChannelOrSubreddit) {
          if (metadata?.youtube?.channelId) {
            await markChannelAs(metadata.youtube.channelId, markDistracting);
          } else if (metadata?.reddit?.subreddit) {
            await markSubredditAs(metadata.reddit.subreddit, markDistracting);
          } else {
            set({ error: "Failed to mark content" });
            return;
          }
        } else {
          if (markDistracting) await markURLAsDistracting(url);
          else await markURLAs(url, markDistracting);
        }
        get().updateDistractingStatuses(metadata || { url });
      }
    } catch (error) {
      console.error("Failed to mark content:", error);
      set({ error: "Failed to mark content" });
    } finally {
      set({ isLoading: false });
    }
  },
}));

function getSiteFromURL(url: URL | null) {
  const site = url?.hostname || "";
  return site.startsWith("www.") ? site.slice(4) : site;
}

export default usePopupStore;
