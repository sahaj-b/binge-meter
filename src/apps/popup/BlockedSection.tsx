import { Button } from "@ui/button";
import usePopupStore from "./store";
import { updateBlockingException } from "@lib/browserService";

export function BlockedSection() {
  const isBlocked = usePopupStore((state) => state.isBlocked);
  const updateIsBlocked = usePopupStore((state) => state.updateIsBlocked);
  console.log("BlockedSection isBlocked", isBlocked);
  if (!isBlocked) return null;
  return (
    <Button
      variant="secondary"
      className="w-full text-primary border"
      onClick={async () => {
        await updateBlockingException(
          usePopupStore.getState().activeURL?.href ?? "",
          false,
        );
        updateIsBlocked();
      }}
    >
      Don't Block This Page
    </Button>
  );
}
