import { setupListeners } from "./listeners";
import { setupLifecycleEvents } from "./lifecycle";

console.log("Background script starting...");
setupLifecycleEvents();
setupListeners();
