import { setupListeners } from "./listeners";
import { setupLifecycleEvents } from "./lifecycle";
import { debugLog } from "@/shared/logger";
import { getStorageData } from "@/shared/storage";
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
