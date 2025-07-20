// detecting SPA navigation is PAAAAINNNNNN in the ass
// when navigation(client or server side) happens, URL changes instantly, but
// it takes time to load contents, Title change is a good indicator for that (unless its a shitty SPA)
// but it has 2 problems:
//  - if there is already a user rule for the URL, we are delaying for no reason
//  - if title isn't changed, overlay won't re-evaluate
// so we doin dual-phase evaluation:
//  - instantly fire the URL change handler which will evaluate the page only based on URL
//  - after title change(or yt-navigate-finish event), or after FALLBACK_DELAY ms, fire the fullMetadataHandler which will normally evaluate the page

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
  let previousUrl = window.location.href;

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
    chrome.runtime.sendMessage({
      type: "DEBUG",
      message: "NAVIGATION DETECTED",
    });
    setTimeout(() => {
      instantUrlHandler(window.location.href);
    }, 10); // smol delay to ensure the URL is updated in the history state
    clearTimeout(fallbackTimer);

    if (!observeTitle) return;

    startTitleObserver();

    fallbackTimer = setTimeout(() => {
      chrome.runtime.sendMessage({
        type: "DEBUG",
        message: "Title did not change. Firing fallback.",
      });
      onTitleChange();
    }, FALLBACK_DELAY);
  }

  // monkey patching
  // history.pushState = function (...args) {
  //   originalPushState.apply(this, args);
  //   console.log("PUSHING STATE");
  //   handleStateChange();
  // };
  // history.replaceState = function (...args) {
  //   originalReplaceState.apply(this, args);
  //   console.log("REPLACING STATE");
  //   handleStateChange();
  // };

  // url polling
  const urlPollingInterval = setInterval(() => {
    if (window.location.href !== previousUrl) {
      previousUrl = window.location.href;
      if (previousUrl.startsWith("https://www.youtube.com")) {
        chrome.runtime.sendMessage({
          type: "DEBUG",
          message: "YOUTUBE NAV DETECTED, SENDING URL_ONLY_EVALUATE",
        });
        handleNavigation(false); // dont observe title change for youtube coz we using yt-navigate-finish
      } else handleNavigation();
    }
  }, POLL_INTERVAL);

  window.addEventListener("yt-page-data-fetched", fullMetadataHandler);
  // window.addEventListener("popstate", handleNavigation); // manual back/forward

  function destroy() {
    // history.pushState = originalPushState;
    // history.replaceState = originalReplaceState;
    // window.removeEventListener("popstate", handleNavigation);
    window.removeEventListener("yt-navigate-finish", fullMetadataHandler);
    titleObserver?.disconnect();
    clearInterval(urlPollingInterval);
    clearTimeout(fallbackTimer);
  }

  return destroy;
}
