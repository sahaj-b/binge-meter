import { Button } from "@ui/button";
import usePopupStore from "./store";

export function BlockedSection() {
  const isBlocked = usePopupStore((state) => state.isBlocked);
  const addBlockingException = usePopupStore(
    (state) => state.addBlockingException,
  );
  if (!isBlocked) return null;
  return (
    <Button
      variant="secondary"
      className="w-full text-primary border"
      onClick={addBlockingException}
    >
      Don't Block This Page
    </Button>
  );
}
