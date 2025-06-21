import type {
  Metadata,
  PageMeta,
  RedditMetadata,
  youtubeMetadata,
} from "@/shared/types";

export function getMetadata(): Metadata {
  const metadata: Metadata = {
    title: document.title,
    url: window.location.href,
    pageMeta: scrapePageMeta(),
  };
  if (
    metadata.url.includes("youtube.com/watch") ||
    metadata.url.includes("youtube.com/@")
  ) {
    metadata.youtube = getYoutubeMetadata(metadata);
  } else if (metadata.url.includes("reddit.com/r/")) {
    metadata.reddit = getRedditMetadata(metadata);
  }
  return metadata;
}

function scrapePageMeta(): PageMeta {
  return {
    description: getContent('meta[name="description"]'),
    ogTitle: getContent('meta[property="og:title"]'),
    ogDescription: getContent('meta[property="og:description"]'),
    ogType: getContent('meta[property="og:type"]'),
    ogSiteName: getContent('meta[property="og:site_name"]'),
    keywords: getContent('meta[name="keywords"]'),
    h1: document.querySelector("h1")?.textContent?.trim() || null,
  };
}

function getYoutubeMetadata(metadata: Metadata): youtubeMetadata {
  const url = new URL(metadata.url);
  const ytMetadata: youtubeMetadata = {
    videoTitle: metadata.title,
    videoId: url.pathname === "/watch" ? url.searchParams.get("v") : null,
  };
  const channelLinkElement = document.querySelector(
    "#channel-name a.yt-simple-endpoint",
  );
  ytMetadata.channelName = channelLinkElement?.textContent?.trim();
  ytMetadata.channelId = channelLinkElement
    ?.getAttribute("href")
    ?.replace("/", "");
  const descriptionElement = document.querySelector(
    "#description-inline-expander #snippet-text",
  );
  ytMetadata.descriptionSnippet = descriptionElement?.textContent?.trim();
  return ytMetadata;
}

function getRedditMetadata(metadata: Metadata): RedditMetadata {
  return {
    subreddit: metadata.url.match(/\/r\/([^/]+)/)?.[1],
    postTitle: metadata.title,
  };
}

function getContent(selector: string, attribute = "content"): string | null {
  const element = document.querySelector<HTMLMetaElement>(selector);
  return element
    ? element.getAttribute(attribute) || element.textContent
    : null;
}
