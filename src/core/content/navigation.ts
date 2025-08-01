// detecting SPA navigation is PAAAAINNNNNN in the ass
// when navigation(client or server side) happens, URL changes instantly, but
// it takes time to load contents, Title change is a good indicator for that (unless its a shitty SPA)
// but it has 2 problems:
//  - if there is already a user rule for the URL, we are delaying for no reason
//  - if title isn't changed, overlay won't re-evaluate
// so we doin dual-phase evaluation:
//  - instantly fire the URL change handler which will evaluate the page only based on URL
//  - after title change OR yt-navigate-finish, or after FALLBACK_DELAY ms, fire the fullMetadataHandler which will normally evaluate the page

import { sendDebugMsg } from "@/shared/logger";

// BRUH monkey-patching history.pushState and replaceState ain't working for SPA nav
// so I be polling url every X ms

let titleObserver: MutationObserver | null = null;
let fallbackTimer: NodeJS.Timeout;
const FALLBACK_DELAY = 4000;
const POLL_INTERVAL = 250;

/** @returns `destroy` function to remove the listeners. */
export function setupNavigation(
  instantUrlHandler: (url: string) => void,
  fullMetadataHandler: () => void,
): () => void {
  // const originalPushState = history.pushState;
  // const originalReplaceState = history.replaceState;
  let previousUrl: string | null = null; // null for initial load
  if (window.location.href.startsWith("https://www.youtube.com")) {
    // coz yt-navigate-finish is fired on initial load
    previousUrl = window.location.href;
  }

  function onTitleChange() {
    clearTimeout(fallbackTimer);
    titleObserver?.disconnect();
    titleObserver = null;
    fullMetadataHandler();
  }

  function startTitleObserver() {
    if (titleObserver) titleObserver.disconnect();
    const titleElement = document.querySelector("title");
    if (!titleElement) return;
    titleObserver = new MutationObserver(onTitleChange);
    titleObserver.observe(titleElement, { childList: true });
  }

  function handleNavigation(observeTitle = true) {
    sendDebugMsg("NAVIGATION DETECTED. previousUrl: " + previousUrl);
    if (previousUrl) {
      setTimeout(() => {
        instantUrlHandler(window.location.href);
      }, 10); // smol delay to ensure the URL is updated in the history state
      clearTimeout(fallbackTimer);
    } else {
      // inital load
      fullMetadataHandler();
    }

    if (!observeTitle) return;

    startTitleObserver();

    fallbackTimer = setTimeout(() => {
      sendDebugMsg("Title did not change. Firing fallback.");
      onTitleChange();
    }, FALLBACK_DELAY);
  }

  // url polling
  const urlPollingInterval = setInterval(() => {
    if (window.location.href !== previousUrl) {
      if (!previousUrl || previousUrl.startsWith("https://www.youtube.com")) {
        // no title observation for initial load and youtube coz we using yt-navigate-finish
        handleNavigation(false);
      } else handleNavigation();
      previousUrl = window.location.href;
    }
  }, POLL_INTERVAL);

  window.addEventListener("yt-navigate-finish", fullMetadataHandler);

  function destroy() {
    window.removeEventListener("yt-navigate-finish", fullMetadataHandler);
    titleObserver?.disconnect();
    clearInterval(urlPollingInterval);
    clearTimeout(fallbackTimer);
  }

  return destroy;
}
