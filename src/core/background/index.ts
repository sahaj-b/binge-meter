import { setupListeners } from "./listeners";
import { setupLifecycleEvents } from "./lifecycle";
import { debugLog } from "@/shared/logger";

debugLog("Background script starting...");
setupLifecycleEvents();
setupListeners();
