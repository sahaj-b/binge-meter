// @ts-ignore
import contentScriptPath from "./content?script";

export async function syncRegisteredScripts() {
  const { trackedSites } = await chrome.storage.local.get("trackedSites");
  const registered = await chrome.scripting.getRegisteredContentScripts();
  const registeredIds = registered.map((s) => s.id);
  for (const site of trackedSites) {
    if (!registeredIds.includes(site)) {
      await registerContentScript(site);
      await injectContentScriptToAllTabs(site);
    }
  }
  for (const id of registeredIds) {
    if (!trackedSites.includes(id)) {
      await chrome.scripting.unregisterContentScripts({ ids: [id] });
    }
  }
}

export async function registerContentScript(site: string) {
  await chrome.scripting.registerContentScripts([
    {
      id: site,
      matches: [`*://*.${site}/*`, `*://${site}/*`],
      js: [contentScriptPath],
      runAt: "document_end",
      allFrames: false,
    },
  ]);
  console.log("Registered content script for", site);
}

export async function injectContentScriptToAllTabs(site: string) {
  const tabs = await chrome.tabs.query({
    url: [`*://*.${site}/*`, `*://${site}/*`],
  });
  tabs.forEach((tab) => {
    injectContentScript(tab.id);
  });
}

export async function injectContentScript(tabId?: number) {
  if (!tabId) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [contentScriptPath],
    });
    console.log("injected content script in", tabId);
  } catch (e) {
    console.log("Couldn't inject content script:", e);
  }
}

export async function revalidateCacheForAllTabs() {
  const { trackedSites } = await chrome.storage.local.get("trackedSites");
  if (!trackedSites || trackedSites.length === 0) return;
  const allTabs = await chrome.tabs.query({});
  for (const tab of allTabs) {
    if (
      tab.url &&
      tab.id &&
      trackedSites.some((site: string) => tab.url!.includes(site))
    ) {
      console.log("Sending REVALIDATE_CACHE to", tab.id);
      await chrome.tabs.sendMessage(tab.id, {
        type: "REVALIDATE_CACHE",
      });
    }
  }
}
