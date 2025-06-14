import { useState, useEffect } from "react";
import { Button } from "@ui/button";
import { Switch } from "@ui/switch";
import { Label } from "@ui/label";
import { Settings, BarChart3 } from "lucide-react";
import {
  loadStorageData,
  getCurrentTabSite,
  sendToggleMessage,
  openSettingsPage,
  openAnalyticsPage,
} from "../lib/browserService";
import CurrentSiteTracker from "./CurrentSiteTracker";

export default function Popup() {
  const [dailyTime, setDailyTime] = useState(0);
  const [overlayHidden, setOverlayHidden] = useState(false);
  const [currentSite, setCurrentSite] = useState("");
  const [trackedSites, setTrackedSites] = useState<string[]>([]);
  const [thresholds, setThresholds] = useState({ warn: 0, danger: 0 } as {
    warn: number | null;
    danger: number | null;
  });

  useEffect(() => {
    async function initializeData() {
      try {
        const data = await loadStorageData();
        setDailyTime(data.dailyTime);
        setOverlayHidden(data.overlayHidden);
        setThresholds(data.thresholds);
        setTrackedSites(data.trackedSites);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    }

    async function initializeCurrentTab() {
      try {
        const site = await getCurrentTabSite();
        setCurrentSite(site);
      } catch (error) {
        console.error("Failed to get current tab:", error);
      }
    }

    initializeData();
    initializeCurrentTab();
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
  } else if (thresholds.warn && time >= thresholds.warn) {
    return "text-amber-600";
  }
  return "text-green-400";
};
