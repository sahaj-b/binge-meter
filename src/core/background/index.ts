import { debugLog } from "@/shared/logger";
import { getStorageData } from "@/shared/storage";
import { setupLifecycleEvents } from "./lifecycle";
import { setupListeners } from "./listeners";
import {
  registerGlobalContentScript,
  syncRegisteredScriptsForAllowedSites,
} from "./scripting";

debugLog("Background script starting...");
setupLifecycleEvents();
setupListeners();

(async () => {
  const { trackAllSites } = await getStorageData(["trackAllSites"]);
  if (trackAllSites) {
    await registerGlobalContentScript();
  } else {
    await syncRegisteredScriptsForAllowedSites();
  }
})();
