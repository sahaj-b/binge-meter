export type StorageData = {
  dailyTime: dailyTime;
  overlayConfig: OverlayConfig;
  trackedSites: string[];
  productiveRules: ProductiveRules;
  activeSession: activeSession;
};

export type ProductiveRules = {
  urls: string[];
  ytChannels: string[];
  subreddits: string[];
};

export type ProductiveRulesInput = Partial<{
  [K in keyof ProductiveRules]: ProductiveRules[K] extends (infer U)[]
    ? U
    : ProductiveRules[K];
}>;
// {urls: string, ytChannels: string, subreddits: string}

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
};

export type youtubeMetadata = {
  videoId?: string | null;
  videoTitle?: string | null;
  channelId?: string | null;
  channelName?: string | null;
  descriptionSnippet?: string | null;
};

export type RedditMetadata = {
  subreddit?: string | null;
  postTitle?: string | null;
};

export type Metadata = {
  title: string;
  url: string;
  youtube?: youtubeMetadata | null;
  reddit?: RedditMetadata | null;
};
