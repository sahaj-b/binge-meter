// handling SPAs navigation is pain in the ass
// when navigation(client or server side) happens, URL changes instantly, but
// it takes time to load contents, Title change is a good indicator for that (unless its a shitty SPA)
// but it has 2 problems:
//  - if there is already a user rule for the URL, it will delay for no reason
//  - if title isn't changed, overlay won't re-evaluate
// so we doin dual-phase evaluation:
//  - instantly fire the URL change handler which will evaluate the page only based on URL
//  - after title change, or after FALLBACK_DELAY ms, fire the fullMetadataHandler which will normally evaluate the page

let titleObserver: MutationObserver | null = null;
let fallbackTimer: NodeJS.Timeout;
const FALLBACK_DELAY = 4000;

/** @returns `destroy` function to remove the listeners. */
export function setupNavigation(
  instantUrlHandler: (url: string) => void,
  fullMetadataHandler: () => void,
): () => void {
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

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

  function handleStateChange() {
    chrome.runtime.sendMessage({
      type: "DEBUG",
      message:
        "NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION NAVIGATION",
    });
    setTimeout(() => {
      instantUrlHandler(window.location.href);
    }, 10); // smol delay to ensure the URL is updated in the history state

    clearTimeout(fallbackTimer);

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

  history.pushState = function (...args) {
    console.log("PUSHING STATE");
    handleStateChange();
    originalPushState.apply(this, args);
  };

  history.replaceState = function (...args) {
    console.log("REPLACING STATE");
    handleStateChange();
    originalReplaceState.apply(this, args);
  };

  window.addEventListener("popstate", handleStateChange);

  function destroy() {
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    window.removeEventListener("popstate", handleStateChange);
    titleObserver?.disconnect();
    clearTimeout(fallbackTimer);
  }

  return destroy;
}
