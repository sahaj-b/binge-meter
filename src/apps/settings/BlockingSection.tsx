import { Button } from "@ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from "@ui/dialog";
import { DurationPicker } from "@ui/duration-picker";
import { Input } from "@ui/input";
import { Label } from "@ui/label";
import { Switch } from "@ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui/tooltip";
import { HelpCircle, LockKeyholeOpen, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { DynamicList } from "./DynamicList";
import { Section } from "./Section";
import { useStore } from "./store";

export function BlockingSection() {
  const blockingSettings = useStore((state) => state.blockingSettings);
  const updateBlockingSettings = useStore(
    (state) => state.updateBlockingSettings,
  );
  const addBlockingException = useStore((state) => state.addBlockingException);
  const removeBlockingException = useStore(
    (state) => state.removeBlockingException,
  );

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(!blockingSettings?.hashedPassword);

  if (!blockingSettings) return null;
  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    const MIN_PASSWORD_LENGTH = 5;
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const password = (formData.get("password") as string)?.trim();
    try {
      if (password && password.length >= MIN_PASSWORD_LENGTH) {
        const buf = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(password),
        );
        const hashedPassword = Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        await updateBlockingSettings({ hashedPassword });
        form.reset();
        setDialogOpen(false);
      } else {
        setPasswordError(
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
        );
      }
    } catch (error) {
      setPasswordError((error as Error).message);
    }
  }
  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const password = (formData.get("password") as string)?.trim();
    try {
      if (password) {
        const buf = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(password),
        );
        const hashedPassword = Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        if (hashedPassword === blockingSettings?.hashedPassword) {
          setUnlocked(true);
          form.reset();
          setDialogOpen(false);
        } else {
          setPasswordError("Incorrect password");
        }
      } else {
        setPasswordError("Please enter your password");
      }
    } catch (error) {
      setPasswordError((error as Error).message);
    }
  }

  const { enabled, timeLimit, urlExceptions } = blockingSettings;
  const setPassworedDialog = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {blockingSettings.hashedPassword ? "Change Password" : "Set Password"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-medium">Set Blocking Password</h3>
          <p className="text-sm text-muted-foreground -mt-2 mb-2">
            Will prevent you from changing blocking settings without entering
            it.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
            <TriangleAlert className="size-4 text-amber-500 opacity-70" /> If
            you forget it, you'll need to re-install the extension to reset it.
          </p>
          <form onSubmit={handleSetPassword} className="flex flex-col gap-2">
            <Input
              type="password"
              placeholder="Enter password"
              name="password"
            />
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            <div className="flex gap-2">
              <DialogFooter>
                <Button type="submit" className="mt-2">
                  Set Password
                </Button>
                <Button
                  variant="outline"
                  className="mt-2 ml-2"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
  const unlockDialog = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <LockKeyholeOpen /> Unlock
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-medium">Unlock Blocking Settings</h3>
          <form onSubmit={handleUnlock} className="flex flex-col gap-2">
            <Input
              type="password"
              placeholder="Enter password"
              name="password"
            />
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            <div className="flex gap-2">
              <DialogFooter>
                <Button type="submit" className="mt-2">
                  Unlock
                </Button>
                <Button
                  variant="outline"
                  className="mt-2 ml-2"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <Section
      title="Blocking"
      description="Block distracting sites after a certain time limit"
      rightElement={unlocked ? setPassworedDialog : unlockDialog}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Enable Blocking</Label>
          <Switch
            disabled={!unlocked}
            checked={enabled}
            onCheckedChange={(checked) =>
              updateBlockingSettings({ enabled: checked })
            }
          />
        </div>

        <div className="flex justify-between">
          <div>
            <Label className="text-sm font-medium">Time Limit</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Block sites after this much time has been spent
            </p>
          </div>
          <DurationPicker
            disabled={!unlocked}
            totalMilliseconds={timeLimit}
            setTotalMilliseconds={(value) =>
              updateBlockingSettings({ timeLimit: value })
            }
          />
        </div>

        <div>
          <Label className="text-sm font-medium flex items-center gap-1">
            URL Exceptions
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="size-3 relative top-[0.5px]" />
              </TooltipTrigger>
              <TooltipContent>
                Use '<span className="text-primary">*</span>' as a wildcard to
                match anything
              </TooltipContent>
            </Tooltip>
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            These urls will not be blocked
          </p>
          <DynamicList
            disabled={!unlocked}
            items={urlExceptions}
            onAddItem={addBlockingException}
            onRemoveItem={removeBlockingException}
            placeholder="https://google.com"
          />
        </div>
      </div>
    </Section>
  );
}
