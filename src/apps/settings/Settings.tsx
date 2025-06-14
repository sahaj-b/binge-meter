import { useEffect, useState } from "react";
import {
  getStorageData,
  setStorageData,
  type OverlayConfig,
} from "@core/store";
import { TrackedSites } from "./TrackedSites";
import { OverlaySettings } from "./OverlaySettings";
import { OverlayStyles } from "./OverlayStyles";
import {
  sendRemoveSiteMessage,
  sendAddSiteMessage,
  requestSitePermission,
} from "@lib/browserService";
import { OverlayUI } from "@/core/content/overlay";

export default function Settings() {
  const [config, setConfig] = useState<OverlayConfig | null>(null);
  const [trackedSites, setTrackedSites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dummyTime, setDummyTime] = useState(369000);

  const [overlay, setOverlay] = useState<OverlayUI | null>(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    const overlay = new OverlayUI(
      document.body,
      hostname,
      // callback functions to keep the state in sync after drag/resize actions
      // took me hours to figure out the solution. AAAAAAAAAA
      (pos) =>
        setConfig((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            positions: { ...prev.positions, [hostname]: pos },
          };
        }),
      (size) =>
        setConfig((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            sizes: { ...prev.sizes, [hostname]: size },
          };
        }),
    );
    overlay.create().then(() => {
      overlay.update(dummyTime);
    });
    setOverlay(overlay);
    loadSettings();
    window.addEventListener("focus", loadSettings);

    return () => {
      overlay.destroy();
      window.removeEventListener("focus", loadSettings);
    };
  }, []);

  useEffect(() => {
    // create() functoin auto revalidates the config cache
    console.log("YOHOOOOOOOo");
    overlay?.create().then(() => {
      overlay.update(dummyTime);
    });
  }, [config, dummyTime]);

  async function loadSettings() {
    try {
      const data = await getStorageData(["overlayConfig", "trackedSites"]);
      setConfig(data.overlayConfig);
      setTrackedSites(data.trackedSites);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  }

  function updateConfig(updates: Partial<OverlayConfig>) {
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  }

  async function handleAddSite(site: string) {
    if (!trackedSites.includes(site)) {
      site = site.replace(/^(https?:\/\/)?(www\.)?/, "");
      await requestSitePermission(site);
      await sendAddSiteMessage(site);
      trackedSites.push(site);
    }
  }

  async function handleRemoveSite(site: string) {
    await sendRemoveSiteMessage(site);
    setTrackedSites((prev) => prev.filter((s) => s !== site));
  }

  async function handleStyleChange(updates: Partial<OverlayConfig>) {
    // if cfg ain't loded yet, don't do anything
    if (!config) return;

    const newCfg = { ...config, ...updates };
    setConfig(newCfg);
    await setStorageData({ overlayConfig: newCfg });

    // if user messes with warn/danger colors, update with those thresholds
    if (updates.warnColors) setDummyTime(newCfg.thresholdWarn);
    else if (updates.dangerColors) setDummyTime(newCfg.thresholdDanger);
    else if (updates.colors) setDummyTime(369000);
  }

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Binge Meter Settings</h1>
        </div>
      </div>

      <div className="space-y-8">
        <TrackedSites
          trackedSites={trackedSites}
          onAddSite={handleAddSite}
          onRemoveSite={handleRemoveSite}
        />

        <OverlaySettings config={config} onConfigUpdate={updateConfig} />
        <OverlayStyles config={config} onStyleChange={handleStyleChange} />
      </div>
    </div>
  );
}
