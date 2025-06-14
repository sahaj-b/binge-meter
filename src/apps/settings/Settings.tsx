import { useEffect, useState } from "react";
import { getStorageData, type OverlayConfig } from "@core/store";
import { TrackedSites } from "./TrackedSites";
import { OverlaySettings } from "./OverlaySettings";
import { OverlayStyles } from "./OverlayStyles";
import {
  sendRemoveSiteMessage,
  sendAddSiteMessage,
  requestSitePermission,
} from "@lib/browserService";

export default function Settings() {
  const [config, setConfig] = useState<OverlayConfig | null>(null);
  const [trackedSites, setTrackedSites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

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
    if (!config) return;
    setConfig({ ...config, ...updates });
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
        <OverlayStyles config={config} onConfigUpdate={updateConfig} />
      </div>
    </div>
  );
}
