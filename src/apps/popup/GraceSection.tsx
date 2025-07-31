import usePopupStore from "./store";
import { sendClearGraceMessage } from "@lib/browserService";
import { Button } from "../components/ui/button";

export function GraceSection() {
  const isCurrentlyDistracting = usePopupStore(
    (state) => state.isCurrentlyDistracting,
  );
  const gracePeriod = usePopupStore((state) => state.gracePeriod);
  const isBlocked = usePopupStore((state) => state.isBlocked);
  if (isBlocked || !isCurrentlyDistracting || gracePeriod < Date.now())
    return null;

  const formatedGracePeriod = new Date(gracePeriod).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return (
    <div className="p-3 bg-card/60 border rounded-lg">
      <div className="text-center">
        <p className="text-base mb-2">
          Freedom Ends at{" "}
          <span className="text-primary">{formatedGracePeriod}</span>
        </p>
        <Button
          onClick={async () => {
            await sendClearGraceMessage(
              usePopupStore.getState().activeURL?.href,
            );
            setTimeout(() => {
              usePopupStore.getState().updateGracePeriod();
              usePopupStore.getState().updateIsBlocked();
            }, 300);
          }}
          className="mt-2 w-full bg-primary/80"
        >
          End Break Now
        </Button>
      </div>
    </div>
  );
}
