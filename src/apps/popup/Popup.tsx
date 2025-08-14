import { useEffect } from "react";
import { Button } from "@ui/button";
import { Settings, BarChart3 } from "lucide-react";
import usePopupStore from "./store";
import CurrentSiteTracker from "./CurrentSiteTracker";
import { ClassificationSection } from "./ClassificationSection";
import { openAnalyticsPage, openSettingsPage } from "../lib/browserService";
import { BlockedSection } from "./BlockedSection";
import { GraceSection } from "./GraceSection";
import { TogglesSection } from "./TogglesSection";
import { AIErrorNotification } from "./AIErrorNotification";

export default function Popup() {
  const isCurrentSiteTracked = usePopupStore(
    (state) => state.isCurrentSiteTracked,
  );
  const dailyTime = usePopupStore((state) => state.dailyTime);
  const initialize = usePopupStore((state) => state.initialize);
  const thresholds = usePopupStore((state) => state.thresholds);
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="p-6">
      <div className="space-y-6">
        <AIErrorNotification />

        <div className="text-center">
          <p className="text-xl mb-2">Today's Binge Time</p>
          <p
            className={`text-3xl font-bold ${getTimeColor(dailyTime, thresholds)}`}
          >
            {formatTime(dailyTime)}
          </p>
        </div>

        <TogglesSection />
        <CurrentSiteTracker />

        {isCurrentSiteTracked && (
          <>
            <ClassificationSection />
            <BlockedSection />
            <GraceSection />
          </>
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
    return "text-destructive/80";
  }
  if (thresholds.warn && time >= thresholds.warn) {
    return "text-primary";
  }
  return "text-green-400";
};
