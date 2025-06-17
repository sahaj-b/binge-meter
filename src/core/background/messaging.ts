import { getStorageData, setStorageData } from "@/shared/store";
import { sitePatterns } from "@/shared/utils";
import type { Message, Metadata, ProductiveRulesInput } from "@/shared/types";

import { injectContentScript, registerContentScript } from "./scripting";
import { updateActiveSession } from "./session";
import { isDistracting } from "./classification";

export async function checkSitePermission(site: string) {
  const permissionsToRequest = {
    origins: sitePatterns(site),
  };
  return chrome.permissions.contains(permissionsToRequest);
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

export async function revalidateCacheForTab(tabId: number) {
  console.log("Sending REVALIDATE_CACHE to", tabId);
  await chrome.tabs.sendMessage(tabId, {
    type: "REVALIDATE_CACHE",
  });
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
  await sendMsgToTrackedSites({ type: "DEACTIVATE_OVERLAY" }, trackedSites);
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
  const tabs = await chrome.tabs.query({ url: sitePatterns(site) });

  for (const tab of tabs) {
    if (tab.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: "ACTIVATE_OVERLAY" });
        console.log(
          `Sent ACTIVATE_OVERLAY to already-injected script in tab ${tab.id}`,
        );
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

  let liveTime = dailyTime.total;
  if (activeSession) {
    liveTime += Date.now() - activeSession.startTime;
  }
  await sendMsgToTrackedSites(
    { type: "UPDATE_FRAME", time: liveTime },
    trackedSites,
  );
}

export async function markDistracting(url: string) {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (activeTab.url?.includes(url)) updateActiveSession(null);

  await sendMsgToAllTabs(url, { type: "DEACTIVATE_OVERLAY" });

  const { productiveRules } = await getStorageData(["productiveRules"]);
  await setStorageData({
    productiveRules: {
      ...productiveRules,
      urls: productiveRules.urls.filter((u) => u !== url),
    },
  });
}

export async function markProductive(url: string) {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (activeTab.id && activeTab.url?.includes(url))
    updateActiveSession(activeTab.id);

  await sendMsgToAllTabs(url, { type: "ACTIVATE_OVERLAY" });

  const { productiveRules } = await getStorageData(["productiveRules"]);
  await setStorageData({
    productiveRules: {
      ...productiveRules,
      urls: [...productiveRules.urls, url],
    },
  });
}

export async function handleEvaluatePage(
  tabId: number,
  metadata: Metadata | null,
) {
  console.log(`Evaluating page for tab ${tabId}`, metadata);
  const distracting = metadata ? await isDistracting(metadata) : false;
  console.log(`Page is ${distracting ? "distracting" : "PRODUCTIVE"}`);
  if (distracting) {
    await chrome.tabs
      .query({ active: true, currentWindow: true })
      .then(([activeTab]) => {
        if (activeTab?.id === tabId) {
          updateActiveSession(tabId);
        }
      });
  } else {
    await chrome.tabs.sendMessage(tabId, { type: "DEACTIVATE_OVERLAY" });
  }
}

export async function addProductiveRule(rule: ProductiveRulesInput) {
  const { productiveRules } = await getStorageData(["productiveRules"]);

  for (const [key, value] of Object.entries(rule)) {
    const k = key as keyof ProductiveRulesInput;
    if (productiveRules[k] !== undefined && Array.isArray(productiveRules[k])) {
      productiveRules[k].push(value);
    }
  }

  await setStorageData({ productiveRules });

  const ruleKeys = Object.keys(rule);

  if (ruleKeys.length === 1 && ruleKeys[0] === "urls") {
    for (const url of rule.urls!) {
      await sendMsgToAllTabs(url, { type: "ACTIVATE_OVERLAY" });
    }
  } else {
    await sendMsgToTrackedSites({ type: "RE-INITIALIZE_OVERLAY" });
  }
}

export async function removeProductiveRule(rule: ProductiveRulesInput) {
  const { productiveRules } = await getStorageData(["productiveRules"]);

  for (const [key, value] of Object.entries(rule)) {
    const k = key as keyof ProductiveRulesInput;
    if (productiveRules[k] !== undefined && Array.isArray(productiveRules[k])) {
      productiveRules[k] = productiveRules[k].filter((item) => item !== value);
    }
  }

  await setStorageData({ productiveRules });

  const ruleKeys = Object.keys(rule);

  if (ruleKeys.length === 1 && ruleKeys[0] === "urls") {
    for (const url of rule.urls!) {
      await sendMsgToAllTabs(url, { type: "DEACTIVATE_OVERLAY" });
    }
  } else {
    await sendMsgToTrackedSites({ type: "RE-INITIALIZE_OVERLAY" });
  }
}

export async function sendMsgToAllTabs(url: string, message: any) {
  const tabs = await chrome.tabs.query({ url });
  for (const tab of tabs) {
    if (tab.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, message);
      } catch (e) {
        console.error(`Error sending ${message.type} to tab ${tab.id}:`, e);
      }
    }
  }
}

export async function sendMsgToTrackedSites(
  message: Message,
  trackedSites?: string[],
) {
  trackedSites =
    trackedSites || (await getStorageData(["trackedSites"])).trackedSites;
  const urlPatterns = trackedSites.flatMap((site) => sitePatterns(site));
  const tabs = await chrome.tabs.query({
    url: urlPatterns,
  });
  for (const tab of tabs) {
    if (tab.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, message);
      } catch (e) {
        console.error(`Error sending ${message.type} to tab ${tab.id}:`, e);
      }
    }
  }
}
