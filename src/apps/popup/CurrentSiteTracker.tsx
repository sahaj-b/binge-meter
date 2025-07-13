import { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ui/tooltip";
import {
  Plus,
  Minus,
  Loader2,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  sendAddSiteMessage,
  checkSitePermission,
  sendRemoveSiteMessage,
  requestSitePermission,
} from "../lib/browserService";

interface CurrentSiteTrackerProps {
  currentSite: string;
  isCurrentSiteTracked: boolean;
  setTrackedSites: Dispatch<SetStateAction<string[]>>;
}

export default function CurrentSiteTracker({
  currentSite,
  isCurrentSiteTracked,
  setTrackedSites,
}: CurrentSiteTrackerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => {
    if (currentSite) {
      setIsLoading(true);
      checkSitePermission(currentSite)
        .then((permissionStatus) => {
          setHasPermission(permissionStatus);
        })
        .catch((err) => {
          console.error("Failed to check site permission:", err);
          setHasPermission(false);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setHasPermission(false);
    }
  }, [currentSite]);

  const handleClick = async () => {
    setError(null);

    if (!hasPermission) {
      await requestSitePermission(currentSite).catch((err) => {
        console.error("Failed to request permission:", err);
      });
    } else {
      setIsLoading(true);
      try {
        if (isCurrentSiteTracked) {
          sendRemoveSiteMessage(currentSite);
        } else {
          sendAddSiteMessage(currentSite);
        }
        setTrackedSites((prevTrackedSites: string[]) =>
          isCurrentSiteTracked
            ? prevTrackedSites.filter((site: string) => site !== currentSite)
            : [...prevTrackedSites, currentSite],
        );
      } catch (err) {
        console.error("Failed to toggle site tracking:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to update tracking status",
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!currentSite) {
    return null;
  }

  return (
    <div className="p-3 bg-card/30 border rounded-lg">
      <div className="flex space-x-5 items-center justify-between">
        <div className="max-w-44 w-full overflow-hidden">
          <p className="text-sm font-medium">{formatSite(currentSite)}</p>
          <div className="flex items-center gap-1">
            <p
              className={`text-xs text-nowrap ${
                isCurrentSiteTracked ? "text-green-400" : "text-primary"
              }`}
            >
              {isCurrentSiteTracked ? "Tracked" : "Not tracked"}
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle
                    size={12}
                    className="text-muted-foreground hover:text-foreground cursor-help"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isCurrentSiteTracked
                      ? "Extension is active on this site"
                      : "Extension is inactive on this site"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {error && (
            <div className="flex items-start mt-1 text-xs text-destructive leading-tight">
              <AlertCircle size={12} className="mr-1 shrink-0 mt-0.5" />
              <p className="break-words">{error}</p>
            </div>
          )}
        </div>
        {(() => {
          const buttonContent = (
            <>
              {isLoading ? (
                <Loader2 size={14} className="mr-1 animate-spin" />
              ) : !hasPermission ? (
                <ShieldAlert size={14} className="mr-1" />
              ) : isCurrentSiteTracked ? (
                <Minus size={14} className="mr-1" />
              ) : (
                <Plus size={14} className="mr-1" />
              )}
              {isLoading
                ? "..."
                : !hasPermission
                  ? "Grant Permission"
                  : isCurrentSiteTracked
                    ? "Remove"
                    : "Track"}
            </>
          );

          const buttonElement = (
            <Button
              variant={
                hasPermission
                  ? isCurrentSiteTracked
                    ? "destructive"
                    : "default"
                  : "secondary"
              }
              onClick={handleClick}
              disabled={isLoading}
              className="min-w-26"
            >
              {buttonContent}
            </Button>
          );

          if (!isLoading && !hasPermission) {
            return (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
                  <TooltipContent>
                    <p>Permission needed to track this site.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }
          return buttonElement;
        })()}
      </div>
    </div>
  );
}

function formatSite(site: string) {
  const maxLength = 20;
  site = site.startsWith("www.") ? site.slice(4) : site;
  return site.length > maxLength ? site.slice(0, maxLength) + "…" : site;
}
