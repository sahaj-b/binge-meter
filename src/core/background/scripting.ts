// @ts-ignore
import contentScriptPath from "../content/index?script";
import { debugLog } from "@/shared/logger";
import { getStorageData, setStorageData } from "@/shared/storage";
import { sitePatterns } from "@/shared/utils";

export async function syncRegisteredScriptsForAllowedSites() {
  // sync trackedSites with registered content scripts and permitted origins
  // coz user can break shi

  const { trackedSites } = await getStorageData(["trackedSites"]);

  const currentPermissions = await chrome.permissions.getAll();
  const allowedOrigins = new Set(currentPermissions.origins || []);

  const sitesWithPermissions = trackedSites.filter((site) =>
    // allowedOrigins.has(`*://${site}/*`),
    sitePatterns(site).some((pattern) => allowedOrigins.has(pattern)),
  );

  if (sitesWithPermissions.length < trackedSites.length) {
    await setStorageData({ trackedSites: sitesWithPermissions });
  }
  debugLog("sitesWithPermissions", sitesWithPermissions);
  debugLog("trackedSites", trackedSites);

  const registered = await chrome.scripting.getRegisteredContentScripts();
  debugLog("registered", registered);
  const registeredIds = registered.map((s) => s.id);
  debugLog("registeredIds", registeredIds);

  const scriptsToRegister = sitesWithPermissions.filter(
    (site) => !registeredIds.includes(site),
  );
  debugLog("scriptsToRegister", scriptsToRegister);
  await injectContentScriptToAllTabs(scriptsToRegister);
  await registerContentScript(scriptsToRegister);

  const idsToUnregister = registeredIds.filter(
    (site) => !sitesWithPermissions.includes(site),
  );
  debugLog("idsToUnregister", idsToUnregister);
  if (idsToUnregister.length > 0) {
    await chrome.scripting.unregisterContentScripts({ ids: idsToUnregister });
  }
}

export async function registerContentScript(site: string | string[]) {
  const sites = Array.isArray(site) ? site : [site];
  const scripts = sites.map(
    (s): chrome.scripting.RegisteredContentScript => ({
      id: s,
      matches: sitePatterns(s),
      js: [contentScriptPath],
      runAt: "document_end",
      allFrames: false,
    }),
  );
  await chrome.scripting.registerContentScripts(scripts);
  debugLog("Registered content scripts for", sites);
}

export async function injectContentScriptToAllTabs(site: string | string[]) {
  if (!site.length) return;
  const sites = Array.isArray(site) ? site : [site];
  const allSitePatterns = sites.flatMap((s) => sitePatterns(s));
  const tabs = await chrome.tabs.query({
    url: allSitePatterns,
  });
  for (const tab of tabs) injectContentScript(tab.id);
}

export async function injectContentScript(tabId?: number) {
  if (!tabId) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [contentScriptPath],
    });
    debugLog("injected content script in", tabId);
  } catch (e) {
    console.error("Couldn't inject content script:", e);
  }
}
