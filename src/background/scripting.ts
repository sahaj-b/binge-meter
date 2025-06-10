// @ts-ignore
import contentScriptPath from "../content/index?script";
import { getStorageData, setStorageData } from "@/store";

export async function syncRegisteredScriptsForAllowedSites() {
  // sync trackedSites with registered content scripts and permitted origins
  // coz user can break shi

  const { trackedSites } = await getStorageData(["trackedSites"]);

  const currentPermissions = await chrome.permissions.getAll();
  const allowedOrigins = new Set(currentPermissions.origins || []);

  const sitesWithPermissions = trackedSites.filter((site) =>
    allowedOrigins.has(`*://${site}/*`),
  );

  if (sitesWithPermissions.length !== trackedSites.length) {
    await setStorageData({ trackedSites: sitesWithPermissions });
  }

  const registered = await chrome.scripting.getRegisteredContentScripts();
  const registeredIds = registered.map((s) => s.id);

  const scriptsToRegister = sitesWithPermissions.filter(
    (site) => !registeredIds.includes(site),
  );
  await injectContentScriptToAllTabs(scriptsToRegister);
  await registerContentScript(scriptsToRegister);

  const idsToUnregister = registeredIds.filter(
    (site) => !sitesWithPermissions.includes(site),
  );
  if (idsToUnregister.length > 0) {
    await chrome.scripting.unregisterContentScripts({ ids: idsToUnregister });
  }
}

export async function registerContentScript(site: string | string[]) {
  const sites = Array.isArray(site) ? site : [site];
  const scripts = sites.map(
    (s): chrome.scripting.RegisteredContentScript => ({
      id: s,
      matches: [`*://${s}/*`],
      js: [contentScriptPath],
      runAt: "document_end",
      allFrames: false,
    }),
  );
  await chrome.scripting.registerContentScripts(scripts);
  console.log("Registered content scripts for", sites);
}

export async function injectContentScriptToAllTabs(site: string | string[]) {
  const sites = Array.isArray(site) ? site : [site];
  const sitePatterns = sites.flatMap((s) => [`*://${s}/*`]);
  const tabs = await chrome.tabs.query({
    url: sitePatterns,
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
    console.error("Couldn't inject content script:", e);
  }
}

export async function revalidateCacheForAllTabs() {
  const { trackedSites } = await getStorageData(["trackedSites"]);
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

export async function removeSite(site: string) {
  const { trackedSites } = await getStorageData(["trackedSites"]);
  if (!trackedSites || !trackedSites.includes(site)) return;
  await chrome.scripting.unregisterContentScripts({
    ids: [site],
  });
  await setStorageData({
    trackedSites: trackedSites.filter((s) => s !== site),
  });
  const allTabs = await chrome.tabs.query({});
  for (const tab of allTabs) {
    if (!tab.url || !tab.id) continue;
    const hostname = new URL(tab.url).hostname;
    if (hostname == site) {
      console.log(`Sending SLEEP to site ${site} in tab ${tab.id}`);
      await chrome.tabs
        .sendMessage(tab.id, {
          type: "SLEEP",
        })
        .catch((e) => {
          console.error(`Error sending SLEEP to tab ${tab.id}:`, e);
        });
    }
  }
}

export async function checkSitePermission(site: string) {
  const permissionsToRequest = {
    origins: [`*://${site}/*`],
  };
  return chrome.permissions.contains(permissionsToRequest);
}

export async function addSite(site: string) {
  if (!(await checkSitePermission(site))) {
    throw new Error(`Permission not granted for '${site}'`);
  }
  const { trackedSites } = await getStorageData(["trackedSites"]);
  if (!trackedSites) {
    await setStorageData({ trackedSites: [site] });
  } else if (!trackedSites.includes(site)) {
    trackedSites.push(site);
    await setStorageData({ trackedSites });
  }

  await registerContentScript(site);
  const tabs = await chrome.tabs.query({ url: `*://${site}/*` });

  for (const tab of tabs) {
    if (tab.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: "WAKE_UP" });
        console.log(`Sent WAKE_UP to already-injected script in tab ${tab.id}`);
      } catch (e) {
        console.log(`Script not found in tab ${tab.id}, injecting fresh.`);
        await injectContentScript(tab.id);
      }
    }
  }
}

export async function toggleOverlays() {
  const { overlayConfig, dailyTime, activeSession, trackedSites } =
    await getStorageData([
      "dailyTime",
      "overlayConfig",
      "activeSession",
      "trackedSites",
    ]);
  const newConfig = {
    ...overlayConfig,
    isHidden: !overlayConfig.isHidden,
  };
  await setStorageData({ overlayConfig: newConfig });
  // send message to all tabs to toggle overlay visibility
  let liveTime = dailyTime.total;
  if (activeSession) {
    liveTime += Date.now() - activeSession.startTime;
  }
  const allTabs = await chrome.tabs.query({});
  for (const tab of allTabs) {
    if (
      tab.id &&
      trackedSites.some((site: string) => tab.url!.includes(site))
    ) {
      await chrome.tabs
        .sendMessage(tab.id, {
          type: "UPDATE_FRAME",
          time: liveTime,
        })
        .catch((e) => {
          console.error("Error sending UPDATE_FRAME:", e);
        });
      console.log(`Sent UPDATE_FRAME to tab: ${tab.id}`);
    }
  }
}
