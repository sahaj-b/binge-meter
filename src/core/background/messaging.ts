import { getStorageData, setStorageData } from "@/shared/store";
import { sitePatterns } from "@/shared/utils";
import type {
  Message,
  Metadata,
  ProductiveRules,
  ProductiveRulesInput,
} from "@/shared/types";

import { injectContentScript, registerContentScript } from "./scripting";
import { updateActiveSession } from "./session";
import { getClassification } from "./classification";

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
        await chrome.tabs.sendMessage(tab.id, {
          type: "RE-INITIALIZE_OVERLAY",
        });
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

export async function handleEvaluatePage(
  tabId: number,
  metadata: Metadata | null,
) {
  console.log(`Evaluating page for tab ${tabId}`, metadata);
  const classification =
    (metadata && (await getClassification(metadata))) || "distracting";
  console.log(`Page is ${classification}`);
  if (classification === "distracting") {
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
  let changed = false;

  for (const [key, value] of Object.entries(rule)) {
    const singularKey = key as keyof ProductiveRulesInput;
    const pluralKey = (singularKey + "s") as keyof ProductiveRules;

    if (
      productiveRules[pluralKey] &&
      Array.isArray(productiveRules[pluralKey])
    ) {
      productiveRules[pluralKey].push(value);
      changed = true;
    }
  }

  if (!changed) throw new Error("No valid rule provided to add");
  console.log("SETTING", productiveRules);
  await setStorageData({ productiveRules });

  if (rule.url)
    await sendMsgToAllTabs(rule.url, { type: "RE-INITIALIZE_OVERLAY" });
  else await sendMsgToTrackedSites({ type: "RE-INITIALIZE_OVERLAY" });
}

export async function removeProductiveRule(rule: ProductiveRulesInput) {
  const { productiveRules } = await getStorageData(["productiveRules"]);
  let changed = false;

  for (const [key, value] of Object.entries(rule)) {
    const singularKey = key as keyof ProductiveRulesInput;
    const pluralKey = (singularKey + "s") as keyof ProductiveRules;
    if (
      productiveRules[pluralKey] &&
      Array.isArray(productiveRules[pluralKey])
    ) {
      const index = productiveRules[pluralKey].indexOf(value);
      if (index !== -1) {
        productiveRules[pluralKey].splice(index, 1);
        changed = true;
      }
    }
  }
  if (!changed) throw new Error("No matching rule found to remove");

  console.log("SETTING", productiveRules);
  await setStorageData({ productiveRules });

  if (rule.url)
    await sendMsgToAllTabs(rule.url, { type: "RE-INITIALIZE_OVERLAY" });
  else await sendMsgToTrackedSites({ type: "RE-INITIALIZE_OVERLAY" });
}

export async function sendMsgToAllTabs(url: string, message: any) {
  const tabs = await chrome.tabs.query({ url });
  for (const tab of tabs) {
    if (tab.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, message);
        console.log(`Sent ${message.type} to tab ${tab.id}`);
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
