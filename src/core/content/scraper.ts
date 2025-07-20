import { getStorageData } from "@/shared/store";
import type {
  Metadata,
  PageMeta,
  RedditMetadata,
  YoutubeMetadata,
} from "@/shared/types";

export async function getMetadata(): Promise<Metadata> {
  const aiEnabled = (await getStorageData(["aiEnabled"])).aiEnabled;
  const metadata: Metadata = {
    title: document.title,
    url: window.location.href,
    pageMeta: aiEnabled ? scrapePageMeta() : null,
  };
  if (
    metadata.url.includes("youtube.com/watch") ||
    metadata.url.includes("youtube.com/@")
  ) {
    chrome.runtime.sendMessage({
      type: "DEBUG",
      message: "waiting for youtube metadata",
    });
    metadata.youtube = await getYoutubeMetadata(metadata);
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

async function getYoutubeMetadata(
  metadata: Metadata,
): Promise<YoutubeMetadata | null> {
  const url = new URL(metadata.url);
  if (url.pathname.startsWith("/watch")) return scrapeWatchPage(metadata);
  if (url.pathname.startsWith("/@")) return scrapeChannelPage(metadata);
  return null;
}

async function scrapeWatchPage(metadata: Metadata): Promise<YoutubeMetadata> {
  const url = new URL(metadata.url);
  const ytMetadata: YoutubeMetadata = {
    videoId: url.searchParams.get("v"),
  };

  await Promise.all([
    waitForElement(
      "#above-the-fold #channel-name a.yt-simple-endpoint",
      // OR "#owner #channel-name a.yt-simple-endpoint",
    )
      .then((channelLinkElement) => {
        ytMetadata.channelName =
          channelLinkElement?.textContent?.trim() || null;
        ytMetadata.channelId =
          channelLinkElement?.getAttribute("href")?.replace("/", "") || null;
      })
      .catch(() => {
        ytMetadata.channelName = null;
        ytMetadata.channelId = null;
      }),

    waitForElement("h1.title.style-scope.ytd-video-primary-info-renderer", true)
      .then((h1Element) => {
        console.log("h1Element", h1Element.textContent);
        ytMetadata.videoTitle = h1Element.textContent?.trim() || null;
      })
      .catch(() => {
        ytMetadata.videoTitle = metadata.title;
      }),
  ]);

  return ytMetadata;
}

async function scrapeChannelPage(metadata: Metadata): Promise<YoutubeMetadata> {
  const url = new URL(metadata.url);
  const ytMetadata: YoutubeMetadata = {
    videoTitle: null,
    videoId: null,
    channelId: url.pathname.replace("/", ""),
  };

  try {
    const headerElement = await waitForElement(
      ".page-header-view-model-wiz__page-header-headline-info",
    );

    const h1 = headerElement.querySelector("h1[aria-label]");
    ytMetadata.channelName = h1
      ? h1.getAttribute("aria-label")?.split(",")[0].trim()
      : null;
  } catch (error) {
    console.log(error as Error);
    chrome.runtime.sendMessage({
      type: "DEBUG",
      message: (error as Error).message,
    });
    ytMetadata.channelName = null;
    ytMetadata.channelId = null;
  }
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

function waitForElement(
  selector: string,
  waitForText = false,
  timeout = 10 * 1000,
): Promise<Element> {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      console.log("ELEMENT already there", selector);
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof Element && node.matches(selector)) {
            observer.disconnect();
            timeoutId && clearTimeout(timeoutId);
            resolve(node);
            return;
          }
          const descendant = (node as Element).querySelector?.(selector);
          console.log("MUTATION, textContent: ", descendant?.textContent);
          if (waitForText && descendant?.textContent) {
            console.log(
              "DISCONNECTING, text content: ",
              descendant.textContent,
            );
            observer.disconnect();
            timeoutId && clearTimeout(timeoutId);
            resolve(descendant);
            return;
          }
          if (!waitForText && descendant) {
            console.log("DISCONNECTING, element:", descendant);
            observer.disconnect();
            timeoutId && clearTimeout(timeoutId);
            resolve(descendant);
            return;
          }
        }
      }
    });

    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element "${selector}" not found within ${timeout}ms.`));
    }, timeout);

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}
