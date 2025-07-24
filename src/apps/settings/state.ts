import {
  defaultOverlayConfig,
  getStorageData,
  setStorageData,
} from "@/shared/store";
import type { OverlayConfig, ProductiveRules } from "@/shared/types";
import { create } from "zustand";
import {
  requestSitePermission,
  sendAddSiteMessage,
  sendRemoveSiteMessage,
  markURLAs,
  markChannelAs,
  markSubredditAs,
} from "@lib/browserService";

type StoreData = {
  loading: boolean;
  error: string | null;
  inputError: string | null;
  trackedSites: string[] | null;
  overlayConfig: OverlayConfig | null;
  productiveRules: ProductiveRules | null;
  aiEnabled: boolean | null;
  aiDisabledSites: string[] | null;
  geminiApiKey: string | null;
  customPrompt: string | null;
  dummyTime: number;
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
  addProductiveRule: (
    ruleType: keyof ProductiveRules,
    value: string,
  ) => Promise<void>;
  removeProductiveRule: (
    ruleType: keyof ProductiveRules,
    value: string,
  ) => Promise<void>;
  setAiEnabled: (enabled: boolean) => Promise<void>;
  toggleAiDisabledSite: (site: string) => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  setCustomPrompt: (prompt: string) => Promise<void>;
};

type StoreType = StoreData & StoreActions;

const initialData: StoreData = {
  loading: true,
  error: null,
  inputError: null,
  trackedSites: null,
  overlayConfig: null,
  productiveRules: null,
  aiEnabled: null,
  aiDisabledSites: null,
  geminiApiKey: null,
  customPrompt: null,
  dummyTime: 369000,
};

export const useStore = create<StoreType>()((set, get) => ({
  ...initialData,
  fetchSettings: async () => {
    try {
      const data = await getStorageData([
        "overlayConfig",
        "trackedSites",
        "productiveRules",
        "aiEnabled",
        "aiDisabledSites",
        "geminiApiKey",
        "customPrompt",
      ]);
      if (!data.overlayConfig) throw new Error("Overlay config not found");
      set({
        overlayConfig: data.overlayConfig,
        trackedSites: data.trackedSites,
        productiveRules: data.productiveRules,
        aiEnabled: data.aiEnabled,
        aiDisabledSites: data.aiDisabledSites,
        geminiApiKey: data.geminiApiKey,
        customPrompt: data.customPrompt,
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
  removeProductiveRule: async (ruleType, value) => {
    const { productiveRules } = get();
    if (!productiveRules) return;
    if (ruleType === "urls") {
      await markURLAs(value, true);
    } else if (ruleType === "ytChannels") {
      await markChannelAs(value, true);
    } else if (ruleType === "subreddits") {
      await markSubredditAs(value, true);
    }
    get().fetchSettings();
  },
  addProductiveRule: async (ruleType, value) => {
    const { productiveRules } = get();
    if (!productiveRules) return;
    const newRules = {
      ...productiveRules,
      [ruleType]: [...productiveRules[ruleType], value],
    };
    if (ruleType === "urls") {
      await markURLAs(value, false);
    } else if (ruleType === "ytChannels") {
      await markChannelAs(value, false);
    } else if (ruleType === "subreddits") {
      await markSubredditAs(value, false);
    }
    set({ productiveRules: newRules });
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
}));
