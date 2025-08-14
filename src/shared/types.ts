export type StorageData = {
  dailyTime: DailyTime;
  overlayConfig: OverlayConfig;
  trackedSites: string[];
  userRules: UserRules;
  activeSession: activeSession;
  aiCache: [string, "productive" | "distracting"][];
  aiEnabled: boolean;
  aiDisabledSites: string[];
  aiModel: string;
  geminiApiKey: string;
  customPrompt: string;
  analyticsData: AnalyticsData;
  resetTime: { hours: number; minutes: number };
  blockingSettings: BlockingSettings;
  aiError: AIError | null;
};

export type BlockingSettings = {
  enabled: boolean;
  timeLimit: number;
  urlExceptions: string[];
  gracePeriodUntil: number;
};

export type AnalyticsData = {
  [date: string]: {
    [site: string]: number; // time spent in ms
    total: number;
  };
};

// why not just string[] for URLRules?
// coz if user marks URL as distracting, it should not trigger AI classification
// so marking distracting is explicit
type URLRules = Record<string, ["productive" | "distracting", string?]>; // optional string as metadata for AI

export type UserRules = {
  urls: URLRules;
  productiveYtChannels: string[];
  productiveSubreddits: string[];
};

export type UserRulesInput = {
  url?: [string, "productive" | "distracting", string?];
  productiveYtChannel?: [string, "productive" | "distracting"];
  productiveSubreddit?: [string, "productive" | "distracting"];
};

export type DailyTime = {
  total: number; //ms
  date: string;
};

export type activeSession = {
  tabId: number;
  startTime: number;
  hostname: string;
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
  url?: string;
  metadata?: any;
  time?: number;
  resetTime?: { hours: number; minutes: number };
  rule?: UserRulesInput;
  blockingUpdates?: Partial<BlockingSettings>;
  extraMetadata?: string;
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

export type AIError = {
  message: string;
  timestamp: number;
  shown: boolean;
  severity: "warning" | "error";
};
