// This is for browsers that doesn't support 'navigation' API. lookin at you, firefox
// @returns `destroy` function to remove the listeners.
export function monkeyPatchNavigation(
  navigationHandler: () => void,
): () => void {
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    navigationHandler();
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    navigationHandler();
  };

  window.addEventListener("popstate", navigationHandler);

  const destroy = () => {
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
    window.removeEventListener("popstate", navigationHandler);
  };

  return destroy;
}
