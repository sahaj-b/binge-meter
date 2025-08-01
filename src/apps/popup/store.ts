import { create } from "zustand";
import type { BlockingSettings, Metadata } from "@/shared/types";
import {
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
  sendUpdateBlockingSettingsMsg,
} from "@lib/browserService";
import { getStorageData } from "@/shared/storage";
import {
  isChannelDistracting,
  classifyByUserRules,
  isSubredditDistracting,
  isUrlBlocked,
  matchUrl,
} from "@/shared/utils";
import { debugLog } from "@/shared/logger";

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
  isBlocked: boolean;
  gracePeriod: number;
  hasAPIKey?: boolean;

  initialize: () => Promise<void>;
  updateDistractingStatuses: (metadata: Metadata) => Promise<void>;
  toggleOverlay: () => void;
  toggleAI: () => void;
  addSite: () => void;
  removeSite: () => void;
  requestPermission: () => void;
  updateIsBlocked: () => Promise<void>;
  updateGracePeriod: () => Promise<void>;
  addBlockingException: () => Promise<void>;
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
  isBlocked: false,
  gracePeriod: 0,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const data = await getStorageData([
        "dailyTime",
        "overlayConfig",
        "trackedSites",
        "userRules",
        "aiEnabled",
        "blockingSettings",
        "geminiApiKey",
      ]);
      set({
        dailyTime: data.dailyTime.total,
        overlayHidden: data.overlayConfig.isHidden,
        thresholds: {
          warn: data.overlayConfig?.thresholdWarn ?? null,
          danger: data.overlayConfig?.thresholdDanger ?? null,
        },
        trackedSites: data.trackedSites,
        aiEnabled: data.aiEnabled,
        gracePeriod: data.blockingSettings?.gracePeriodUntil,
        hasAPIKey: !!data.geminiApiKey,
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
              debugLog("Metadata response:", response);
              if (response?.metadata) {
                debugLog("Metadata received:", response.metadata);
                set({ metadata: response.metadata });
                get().updateDistractingStatuses(response.metadata);
              }
            }
          } else {
            const distracting =
              (await classifyByUserRules({ url: url.href })) !== "productive";
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
        const blocked = await isUrlBlocked(get().activeURL?.href ?? "");
        set({ dailyTime: dailyTime.total, isBlocked: blocked });
      }, 500);
    }
  },

  updateDistractingStatuses: async (metadata: Metadata) => {
    const distracting = (await classifyByUserRules(metadata)) !== "productive";
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

  updateIsBlocked: async () => {
    const { activeURL } = get();
    if (activeURL) {
      const blocked = await isUrlBlocked(activeURL.href);
      set({ isBlocked: blocked });
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

  updateGracePeriod: async () => {
    const { blockingSettings } = await getStorageData(["blockingSettings"]);
    set({
      gracePeriod: blockingSettings.gracePeriodUntil,
    });
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
          let extraMetadata: string | undefined = undefined;
          if (metadata?.youtube?.videoTitle || metadata?.youtube?.channelName)
            extraMetadata = `Video Title: ${metadata?.youtube?.videoTitle}, Channel: ${metadata?.youtube?.channelName}`;
          if (markDistracting) await markURLAsDistracting(url, extraMetadata);
          else await markURLAs(url, markDistracting, extraMetadata);
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
  addBlockingException: async () => {
    const { blockingSettings } = await getStorageData(["blockingSettings"]);
    const url = get().activeURL?.href;
    if (!blockingSettings || !url) return;
    const alradyExists = blockingSettings.urlExceptions.some((pattern) =>
      matchUrl(url, pattern),
    );

    if (alradyExists) return;

    const updates: Partial<BlockingSettings> = {
      urlExceptions: [...blockingSettings.urlExceptions, url],
    };
    await sendUpdateBlockingSettingsMsg(updates);
    get().updateIsBlocked();
  },
}));

function getSiteFromURL(url: URL | null) {
  const site = url?.hostname || "";
  return site.startsWith("www.") ? site.slice(4) : site;
}

export default usePopupStore;
