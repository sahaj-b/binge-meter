import {
  defaultOverlayConfig,
  getStorageData,
  setStorageData,
} from "@/shared/storage";
import type {
  BlockingSettings,
  OverlayConfig,
  UserRules,
} from "@/shared/types";
import { create } from "zustand";
import {
  requestSitePermission,
  sendAddSiteMessage,
  sendRemoveSiteMessage,
  markURLAs,
  markChannelAs,
  markSubredditAs,
  sendResetTimeMessage,
  sendUpdateBlockingSettingsMsg,
} from "@lib/browserService";
import { matchUrl } from "@/shared/utils";

type StoreData = {
  loading: boolean;
  error: string | null;
  inputError: string | null;
  trackedSites: string[] | null;
  overlayConfig: OverlayConfig | null;
  userRules: UserRules | null;
  aiEnabled: boolean | null;
  aiDisabledSites: string[] | null;
  geminiApiKey: string | null;
  customPrompt: string | null;
  dummyTime: number;
  resetTime: { hours: number; minutes: number } | null;
  blockingSettings: BlockingSettings | null;
  miscError: string | null;
};
type StoreActions = {
  fetchSettings: () => Promise<void>;
  getDefaultDummyTime: () => number;
  resetStylesToDefault: () => Promise<void>;
  updateConfig: (
    updates: Partial<OverlayConfig>,
    save?: boolean,
  ) => Promise<void>;
  saveConfig: () => Promise<void>;
  updateStyles: (updates: Partial<OverlayConfig>) => Promise<void>;
  onColorChange: (
    type: "normal" | "warning" | "danger",
    colorKey: "fg" | "bg" | "borderColor",
    value: string,
  ) => Promise<void>;
  addSite: (site: string) => Promise<void>;
  removeSite: (site: string) => Promise<void>;
  updateUserRule: (
    ruleType: keyof UserRules,
    value: string,
    markDistracting: boolean,
  ) => Promise<void>;
  setAiEnabled: (enabled: boolean) => Promise<void>;
  toggleAiDisabledSite: (site: string) => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  setCustomPrompt: (prompt: string) => Promise<void>;
  setResetTime: (time: { hours: number; minutes: number }) => Promise<void>;
  updateBlockingSettings: (updates: Partial<BlockingSettings>) => Promise<void>;
  addBlockingException: (url: string) => Promise<void>;
  removeBlockingException: (url: string) => Promise<void>;
};

type StoreType = StoreData & StoreActions;

const initialData: StoreData = {
  loading: true,
  error: null,
  inputError: null,
  trackedSites: null,
  overlayConfig: null,
  userRules: null,
  aiEnabled: null,
  aiDisabledSites: null,
  geminiApiKey: null,
  customPrompt: null,
  dummyTime: 369000,
  resetTime: null,
  blockingSettings: null,
  miscError: null,
};

export const useStore = create<StoreType>()((set, get) => ({
  ...initialData,
  fetchSettings: async () => {
    try {
      const data = await getStorageData([
        "overlayConfig",
        "trackedSites",
        "userRules",
        "aiEnabled",
        "aiDisabledSites",
        "geminiApiKey",
        "customPrompt",
        "resetTime",
        "blockingSettings",
      ]);
      if (!data.overlayConfig) throw new Error("Overlay config not found");
      set({
        overlayConfig: data.overlayConfig,
        trackedSites: data.trackedSites,
        userRules: data.userRules,
        aiEnabled: data.aiEnabled,
        aiDisabledSites: data.aiDisabledSites,
        geminiApiKey: data.geminiApiKey,
        customPrompt: data.customPrompt,
        resetTime: data.resetTime,
        blockingSettings: data.blockingSettings,
        error: null,
      });
      set((state) => ({
        dummyTime: state.getDefaultDummyTime(),
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    } finally {
      set({ loading: false });
    }
  },

  getDefaultDummyTime: () => {
    // dont display 69 if it wont show the default colors :(
    const { thresholdWarn, thresholdDanger } =
      get().overlayConfig || defaultOverlayConfig;
    return thresholdWarn <= initialData.dummyTime ||
      thresholdDanger <= initialData.dummyTime
      ? 0
      : initialData.dummyTime;
  },

  resetStylesToDefault: async () => {
    await get().updateStyles({
      blur: defaultOverlayConfig.blur,
      borderRadius: defaultOverlayConfig.borderRadius,
      colors: defaultOverlayConfig.colors,
      warnColors: defaultOverlayConfig.warnColors,
      dangerColors: defaultOverlayConfig.dangerColors,
    });
    set((state) => ({
      dummyTime: state.getDefaultDummyTime(),
    }));
  },
  updateConfig: async (updates: Partial<OverlayConfig>, save = false) => {
    set((state) => {
      if (!state.overlayConfig) return state;
      return {
        overlayConfig: { ...state.overlayConfig, ...updates },
      };
    });
    save && (await get().saveConfig());
    if (updates.thresholdWarn || updates.thresholdDanger) {
      set((state) => ({
        dummyTime: state.getDefaultDummyTime(),
      }));
    }
  },

  saveConfig: async () => {
    const { overlayConfig, aiEnabled, geminiApiKey } = get();
    await setStorageData({
      overlayConfig: overlayConfig ?? undefined,
      aiEnabled: aiEnabled ?? undefined,
      geminiApiKey: geminiApiKey ?? undefined,
    });
  },

  updateStyles: async (updates: Partial<OverlayConfig>) => {
    const { overlayConfig } = get();
    if (!overlayConfig) return;
    await get().updateConfig(updates, true);
    if (updates.warnColors) set({ dummyTime: overlayConfig.thresholdWarn });
    else if (updates.dangerColors)
      set({ dummyTime: overlayConfig.thresholdDanger });
    else if (updates.colors)
      set((state) => ({ dummyTime: state.getDefaultDummyTime() }));
  },

  onColorChange: async (type, colorKey, value) => {
    const { overlayConfig } = get();
    if (!overlayConfig) return;

    const colorMap = {
      normal: "colors",
      warning: "warnColors",
      danger: "dangerColors",
    } as const;

    const colorProperty = colorMap[type];

    await get().updateStyles({
      [colorProperty]: { ...overlayConfig[colorProperty], [colorKey]: value },
    });
  },

  addSite: async (site: string) => {
    const cleanSite = site.trim().replace(/^(https?:\/\/)?(www\.)?/, "");
    set({ inputError: null });
    if (!cleanSite) {
      set({ inputError: "Site cannot be empty" });
      return;
    }

    if (get().trackedSites?.includes(cleanSite)) {
      set({ inputError: `${cleanSite} is already tracked` });
      return;
    }

    await requestSitePermission(cleanSite);
    await sendAddSiteMessage(cleanSite);
    set((state) => ({
      trackedSites: [...(state.trackedSites || []), cleanSite],
    }));
  },

  removeSite: async (site: string) => {
    await sendRemoveSiteMessage(site);
    set((state) => ({
      trackedSites: state.trackedSites?.filter((s) => s !== site) || [],
    }));
  },

  updateUserRule: async (ruleType, value, markDistracting) => {
    if (ruleType === "urls") {
      await markURLAs(value, markDistracting);
    } else if (ruleType === "productiveYtChannels") {
      await markChannelAs(value, markDistracting);
    } else if (ruleType === "productiveSubreddits") {
      await markSubredditAs(value, markDistracting);
    }
    get().fetchSettings();
  },

  setAiEnabled: async (enabled) => {
    set({ aiEnabled: enabled });
    await setStorageData({ aiEnabled: enabled });
  },

  toggleAiDisabledSite: async (site: string) => {
    const { aiDisabledSites } = get();
    if (!aiDisabledSites) return;
    const newSites = aiDisabledSites.includes(site)
      ? aiDisabledSites.filter((s) => s !== site)
      : [...aiDisabledSites, site];
    set({ aiDisabledSites: newSites });
    await setStorageData({ aiDisabledSites: newSites });
  },

  setApiKey: async (key) => {
    set({ geminiApiKey: key });
    await setStorageData({ geminiApiKey: key });
  },

  setCustomPrompt: async (prompt) => {
    set({ customPrompt: prompt });
    await setStorageData({ customPrompt: prompt });
  },

  setResetTime: async (time) => {
    set({ resetTime: time, miscError: null });
    await sendResetTimeMessage(time).catch((error) => {
      set({ miscError: "Failed to set time: " + error.message });
    });
  },

  updateBlockingSettings: async (updates: Partial<BlockingSettings>) => {
    await sendUpdateBlockingSettingsMsg(updates);
    set((state) => {
      if (!state.blockingSettings) return state;
      return { blockingSettings: { ...state.blockingSettings, ...updates } };
    });
  },

  addBlockingException: async (url: string) => {
    const { blockingSettings } = await getStorageData(["blockingSettings"]);
    if (!blockingSettings || !url) return;
    let matchedPattern = "";
    const alradyExists = blockingSettings.urlExceptions.some((pattern) => {
      if (matchUrl(url, pattern)) {
        matchedPattern = pattern;
        return true;
      }
    });

    if (alradyExists)
      throw new Error(`'${url}' already matches '${matchedPattern}'`);

    const updates: Partial<BlockingSettings> = {
      urlExceptions: [...blockingSettings.urlExceptions, url],
    };
    await sendUpdateBlockingSettingsMsg(updates);
    get().fetchSettings();
  },

  removeBlockingException: async (url: string) => {
    const urlExceptions = get().blockingSettings?.urlExceptions ?? [];
    const updates: Partial<BlockingSettings> = {
      urlExceptions: urlExceptions.filter((exception) => exception !== url),
    };
    await sendUpdateBlockingSettingsMsg(updates).catch((error) => {
      throw new Error(`Failed to remove ${url}` + error.message);
    });
    await get().fetchSettings();
  },
}));
