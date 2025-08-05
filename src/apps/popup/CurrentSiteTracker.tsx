import {
  Plus,
  Minus,
  Loader2,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ui/tooltip";
import usePopupStore from "./store";

export default function CurrentSiteTracker() {
  const currentSite = usePopupStore((state) => state.currentSite);
  const isCurrentSiteTracked = usePopupStore(
    (state) => state.isCurrentSiteTracked,
  );
  const isLoading = usePopupStore((state) => state.isLoading);
  const error = usePopupStore((state) => state.error);
  const hasPermission = usePopupStore((state) => state.hasPermission);
  const addSite = usePopupStore((state) => state.addSite);
  const removeSite = usePopupStore((state) => state.removeSite);
  const requestPermission = usePopupStore((state) => state.requestPermission);

  if (!currentSite) {
    return null;
  }

  const handleClick = () => {
    if (!hasPermission) {
      requestPermission();
    } else {
      isCurrentSiteTracked ? removeSite() : addSite();
    }
  };

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
        ? ""
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

  return (
    <div className="p-3 bg-card/60 border rounded-lg">
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
                    className="text-muted-foreground hover:text-foreground"
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
        {!isLoading && !hasPermission ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
              <TooltipContent>
                <p>Permission needed to track this site.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          buttonElement
        )}
      </div>
    </div>
  );
}

function formatSite(site: string) {
  const maxLength = 20;
  site = site.startsWith("www.") ? site.slice(4) : site;
  return site.length > maxLength ? site.slice(0, maxLength) + "…" : site;
}
