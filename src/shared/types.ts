export type StorageData = {
  dailyTime: dailyTime;
  overlayConfig: OverlayConfig;
  trackedSites: string[];
  productiveRules: ProductiveRules;
  activeSession: activeSession;
  aiCache: Record<string, "productive" | "distracting">;
  aiEnabled: boolean;
  geminiApiKey: string;
};

export type ProductiveRules = {
  urls: string[];
  ytChannels: string[];
  subreddits: string[];
};

type SingularizeKey<T extends string> = T extends `${infer U}s` ? U : T;

export type ProductiveRulesInput = Partial<{
  [K in keyof ProductiveRules as SingularizeKey<K>]: ProductiveRules[K][number];
}>; // {url?: string, ytChannel?: string, subreddit?: string, etc..}

export type dailyTime = {
  total: number; //ms
  date: string;
};

export type activeSession = {
  tabId: number;
  startTime: number;
} | null;

export type OverlayConfig = {
  thresholdWarn: number;
  thresholdDanger: number;
  // fg, bg, border
  colors: { fg: string; bg: string; borderColor: string };
  warnColors: { fg: string; bg: string; borderColor: string };
  dangerColors: { fg: string; bg: string; borderColor: string };
  defaultSize: { width: number; height: number };
  positions: Record<string, { left: string; top: string }>;
  sizes: Record<string, { width: number; height: number }>;
  isHidden: boolean;
  blur: number;
  borderRadius: number;
};

export type Message = {
  type: string;
  site?: string;
  metadata?: any;
  time?: number;
  rule?: ProductiveRulesInput;
};
export type PageMeta = {
  description?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogType?: string | null;
  ogSiteName?: string | null;
  keywords?: string | null;
  h1?: string | null;
};

export type YoutubeMetadata = {
  videoId?: string | null;
  videoTitle?: string | null;
  channelId?: string | null;
  channelName?: string | null;
};

export type RedditMetadata = {
  subreddit?: string | null;
  postTitle?: string | null;
};

export type Metadata = {
  url: string;
  title?: string;
  pageMeta?: PageMeta | null;
  youtube?: YoutubeMetadata | null;
  reddit?: RedditMetadata | null;
};
