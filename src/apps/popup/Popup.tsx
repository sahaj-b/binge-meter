import { useState, useEffect } from "react";
import { Button } from "@ui/button";
import { Switch } from "@ui/switch";
import { Label } from "@ui/label";
import { Settings, BarChart3 } from "lucide-react";
import type { Metadata, ProductiveRules } from "@/shared/types";
import {
  loadStorageData,
  sendToggleMessage,
  openSettingsPage,
  openAnalyticsPage,
  getCurrentTab,
} from "../lib/browserService";
import CurrentSiteTracker from "./CurrentSiteTracker";
import { ClassificationSection } from "./ClassificationSection";

export default function Popup() {
  const [dailyTime, setDailyTime] = useState(0);
  const [overlayHidden, setOverlayHidden] = useState(false);
  const [currentSite, setCurrentSite] = useState("");
  const [trackedSites, setTrackedSites] = useState<string[]>([]);
  const [thresholds, setThresholds] = useState({ warn: 0, danger: 0 } as {
    warn: number | null;
    danger: number | null;
  });
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  useState<ProductiveRules | null>(null);

  useEffect(() => {
    let trackedSites: string[] = [];
    async function initializeData() {
      try {
        const data = await loadStorageData();
        setDailyTime(data.dailyTime);
        setOverlayHidden(data.overlayHidden);
        setThresholds(data.thresholds);
        setTrackedSites(data.trackedSites);
        trackedSites = data.trackedSites || [];
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    }

    async function initializeCurrentTab() {
      console.log("Initializing current tab...");
      try {
        const tab = await getCurrentTab();
        if (!tab.url) {
          console.warn("No active tab found or tab URL is empty.");
          return;
        }
        const url = new URL(tab.url || "");
        const site = url.hostname;
        setCurrentSite(site);

        if (site && trackedSites.includes(site)) {
          const path = url.pathname;
          console.log("Tracked site found:", site + path);
          if (
            (site.endsWith("youtube.com") &&
              (path.startsWith("/watch") || path.startsWith("/@"))) ||
            (site.endsWith("reddit.com") && path.startsWith("/r/"))
          ) {
            console.log("Sending message to content script for metadata");
            if (tab.id) {
              const response = await chrome.tabs.sendMessage(tab.id, {
                type: "SEND_METADATA",
              });
              console.log("RESPONSE", response);
              if (response?.metadata) {
                setMetadata(response.metadata);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to get current tab:", error);
      }
    }

    initializeData().then(() => {
      initializeCurrentTab();
    });
  }, []);

  function handleToggleOverlay() {
    sendToggleMessage();
    setOverlayHidden(!overlayHidden);
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-sm mb-2">Today's Binge Time</p>
          <p
            className={`text-3xl font-bold ${getTimeColor(dailyTime, thresholds)}`}
          >
            {formatTime(dailyTime)}
          </p>
        </div>

        <div className="flex items-center justify-between p-3 bg-card/30 border rounded-lg">
          <div className="flex items-center space-x-2">
            <Label htmlFor="overlay-toggle">Show Overlay</Label>
          </div>
          <Switch
            id="overlay-toggle"
            checked={!overlayHidden}
            onCheckedChange={handleToggleOverlay}
          />
        </div>

        <CurrentSiteTracker
          currentSite={currentSite}
          trackedSites={trackedSites}
          setTrackedSites={setTrackedSites}
        />

        {trackedSites.includes(currentSite) && (
          <ClassificationSection metadata={metadata} currentSite={currentSite} />
        )}

        <div className="flex space-x-4 items-center justify-center">
          <Button
            className="grow"
            onClick={openSettingsPage}
            variant="secondary"
          >
            <Settings size={16} className="mr-2" />
            Settings
          </Button>
          <Button
            className="grow"
            onClick={openAnalyticsPage}
            variant="secondary"
          >
            <BarChart3 size={16} className="mr-2" />
            Analytics
          </Button>
        </div>
      </div>
    </div>
  );
}

function formatTime(milliseconds: number) {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

const getTimeColor = (
  time: number,
  thresholds: { warn: number | null; danger: number | null },
) => {
  if (thresholds.danger && time >= thresholds.danger) {
    return "text-destructive";
  }
  if (thresholds.warn && time >= thresholds.warn) {
    return "text-amber-600";
  }
  return "text-green-400";
};
