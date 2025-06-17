import type { Metadata, RedditMetadata, youtubeMetadata } from "@/shared/types";

export function getMetadata(): Metadata {
  const metadata: Metadata = {
    title: document.title,
    url: window.location.href,
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
