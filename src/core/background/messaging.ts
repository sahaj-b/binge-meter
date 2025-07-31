import { getStorageData, setStorageData } from "@/shared/storage";
import { sitePatterns } from "@/shared/utils";
import type {
  Message,
  Metadata,
  UserRules,
  UserRulesInput,
} from "@/shared/types";

import { injectContentScript, registerContentScript } from "./scripting";
import { handleBlockingChecks, updateActiveSession } from "./session";
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
  await sendMsgToAllTabs(sitePatterns(site), { type: "DEACTIVATE_OVERLAY" });
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
          `Sent RE-INITIALIZE_OVERLAY to already-injected script in tab ${tab.id}`,
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
  isFullEval = true,
) {
  if (!metadata?.url) return;

  console.log(`Evaluating page for tab ${tabId}`, metadata);
  const classification = await getClassification(metadata, isFullEval);
  console.log(`Page is ${classification}`);

  // --- PRODUCTIVE PATH ---
  if (classification === "productive") {
    await chrome.tabs
      .query({ active: true, currentWindow: true })
      .then(async ([activeTab]) => {
        if (activeTab?.id === tabId) {
          console.log(
            "Productive page is active, ensuring session is stopped.",
          );
          await updateActiveSession(null);
        }
      });
    await chrome.tabs.sendMessage(tabId, { type: "DEACTIVATE_OVERLAY" });
    return;
  }

  // --- DISTRACTING PATH ---

  if (await toBlockUrl(metadata.url)) {
    console.log("BLOCKING TIMEEEEEEEEEEEEee");
    await chrome.tabs.sendMessage(tabId, { type: "BLOCK_OVERLAY" });
    await updateActiveSession(null);
  } else {
    console.log("AINT BLOCKING THIS SHI");
    chrome.tabs
      .query({ active: true, currentWindow: true })
      .then(async ([activeTab]) => {
        if (activeTab?.id === tabId) {
          await chrome.tabs.sendMessage(tabId, { type: "ACTIVATE_OVERLAY" });
          await updateActiveSession(tabId);
        }
      });
  }
}

export async function updateUserRule(
  rule: UserRulesInput,
  deleteDistractingURL = false,
  extraMetadata?: string, // eg: title for yt vid, for auto-improving AI
) {
  const { userRules } = await getStorageData(["userRules"]);
  let changed = false;

  for (const [key, value] of Object.entries(rule)) {
    const singularKey = key as keyof UserRulesInput;
    const pluralKey = (singularKey + "s") as keyof UserRules;

    if (userRules[pluralKey] && Array.isArray(userRules[pluralKey])) {
      // isArray is true for ytChannels and subreddits
      if (value[1] === "productive") {
        if (userRules[pluralKey].includes(value[0]))
          throw new Error(`'${value[0]}' already exists`);

        userRules[pluralKey].push(value[0]);
        changed = true;
      } else {
        const index = userRules[pluralKey].indexOf(value[0]);
        if (index !== -1) {
          userRules[pluralKey].splice(index, 1);
          changed = true;
        }
      }
    } else {
      // url is a special case
      if (value[1] === "productive") {
        userRules.urls[value[0]] = ["productive", extraMetadata];
      } else {
        if (deleteDistractingURL) delete userRules.urls[value[0]];
        else userRules.urls[value[0]] = ["distracting", extraMetadata];
      }
      changed = true;
    }
  }

  if (!changed) throw new Error("No valid rule provided to add");
  await setStorageData({ userRules });
  if (rule.url)
    await sendMsgToAllTabs(rule.url[0], {
      type: "RE-INITIALIZE_OVERLAY",
    }).catch(() => {});
  else
    await sendMsgToTrackedSites({ type: "RE-INITIALIZE_OVERLAY" }).catch(
      () => {},
    );
}

export async function setBlockingExceptions(url: string, unblock: boolean) {
  if (!url) return;
  const { blockingSettings } = await getStorageData(["blockingSettings"]);

  const isCurrentlyBlocked = !blockingSettings.urlExceptions.includes(url);

  if (unblock) {
    if (!isCurrentlyBlocked) throw new Error(`'${url}' is already unblocked`);
    blockingSettings.urlExceptions.push(url);
    await setStorageData({ blockingSettings });

    await sendMsgToAllTabs(url, { type: "UNBLOCK_OVERLAY" });
  } else {
    if (isCurrentlyBlocked) throw new Error(`'${url}' is already blocked`);
    blockingSettings.urlExceptions = blockingSettings.urlExceptions.filter(
      (exception) => exception !== url,
    );
    await setStorageData({ blockingSettings });

    const matchingTabs = await chrome.tabs.query({ url });
    for (const tab of matchingTabs) {
      if (tab.id && tab.url) await handleBlockingChecks(tab.id, tab.url);
    }
  }
}

export async function addGracePeriod(tabId: number | null, durationMs: number) {
  if (durationMs <= 0) {
    console.warn("Invalid grace period duration:", durationMs);
    return;
  }
  const { blockingSettings } = await getStorageData(["blockingSettings"]);
  const newGracePeriod =
    blockingSettings.gracePeriodUntil > Date.now()
      ? blockingSettings.gracePeriodUntil + durationMs
      : Date.now() + durationMs;
  console.log("Current time:", new Date(Date.now()).toLocaleString());
  console.log(
    "New grace period until:",
    new Date(newGracePeriod).toLocaleString(),
  );
  await setStorageData({
    blockingSettings: {
      ...blockingSettings,
      gracePeriodUntil: newGracePeriod,
    },
  });

  if (tabId) {
    chrome.tabs.sendMessage(tabId, {
      type: "UNBLOCK_OVERLAY",
    });
  }
}

export async function clearGracePeriod(url?: string) {
  const { blockingSettings } = await getStorageData(["blockingSettings"]);
  if (blockingSettings.gracePeriodUntil <= Date.now()) {
    console.warn("No active grace period to clear");
    return;
  }
  await setStorageData({
    blockingSettings: {
      ...blockingSettings,
      gracePeriodUntil: 0,
    },
  });

  if (!url) return;
  const matchingTabs = await chrome.tabs.query({ url });
  for (const tab of matchingTabs) {
    if (tab.id && tab.url) await handleBlockingChecks(tab.id, tab.url);
  }
}

export async function toBlockUrl(url: string) {
  const { blockingSettings, dailyTime } = await getStorageData([
    "blockingSettings",
    "dailyTime",
  ]);
  const isException = blockingSettings.urlExceptions.includes(url);
  const isTimeLimitExceeded =
    blockingSettings.gracePeriodUntil > Date.now()
      ? Date.now() >= blockingSettings.gracePeriodUntil
      : blockingSettings.timeLimit > 0 &&
        dailyTime.total >= blockingSettings.timeLimit;
  return blockingSettings.enabled && !isException && isTimeLimitExceeded;
}

export async function sendMsgToAllTabs(url: string | string[], message: any) {
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
