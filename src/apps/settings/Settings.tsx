import { useEffect } from "react";
import { TrackedSites } from "./TrackedSites";
import { OverlaySettings } from "./OverlaySettings";
import { OverlayStyles } from "./OverlayStyles";
import { Exceptions } from "./Exceptions";
import { OverlayUI } from "@/core/content/overlay";
import { useStore } from "./state";

export default function Settings() {
  const fetchSettings = useStore((state) => state.fetchSettings);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const updateConfig = useStore((state) => state.updateConfig);
  console.log("loading", loading);

  useEffect(() => {
    const hostname = window.location.hostname;
    const overlay = new OverlayUI(
      document.body,
      hostname,
      // callback functions to keep the state in sync after drag/resize actions
      // took me hours to debug. AAAAAAAAAAA
      (pos) => updateConfig({ positions: { [hostname]: pos } }),
      (size) => updateConfig({ sizes: { [hostname]: size } }),
    );
    window.addEventListener("focus", fetchSettings);
    fetchSettings();

    const handleStateChange = (state: ReturnType<typeof useStore.getState>) => {
      if (!state.overlayConfig) return;
      overlay.create(state.overlayConfig).then(() => {
        overlay.update(state.dummyTime, true, state.overlayConfig!);
      });
    };

    handleStateChange(useStore.getState());
    const unsubscribe = useStore.subscribe(handleStateChange);

    return () => {
      unsubscribe();
      overlay.destroy();
      window.removeEventListener("focus", fetchSettings);
    };
  }, [fetchSettings, updateConfig]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-xl">
        Loading...
      </div>
    );
  }
  if (error) {
    return (
      <div className="items-center justify-center flex min-h-screen text-xl">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="items-center justify-between mb-8 flex ">
        <div>
          <h1 className="text-2xl font-bold">Binge Meter Settings</h1>
        </div>
      </div>

      <div className="space-y-8">
        <TrackedSites />
        <Exceptions />
        <OverlaySettings />
        <OverlayStyles />
      </div>
    </div>
  );
}
