import { Label } from "@/apps/components/ui/label";
import { Switch } from "@/apps/components/ui/switch";
import { Input } from "@/apps/components/ui/input";
import { Textarea } from "@/apps/components/ui/textarea";
import { useStore } from "./state";
import { Section } from "./Section";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { HelpCircle } from "lucide-react";

export function AIClassification() {
  const aiEnabled = useStore((state) => state.aiEnabled);
  const geminiApiKey = useStore((state) => state.geminiApiKey);
  const customPrompt = useStore((state) => state.customPrompt);
  const setAiEnabled = useStore((state) => state.setAiEnabled);
  const setApiKey = useStore((state) => state.setApiKey);
  const setCustomPrompt = useStore((state) => state.setCustomPrompt);

  return (
    <Section title="AI Classification">
      <div className="flex items-center justify-between">
        <Label htmlFor="ai-enabled">Enable AI Classification</Label>
        <Switch
          id="ai-enabled"
          checked={aiEnabled ?? false}
          onCheckedChange={(checked) => setAiEnabled(checked)}
        />
      </div>
      <div className="flex justify-between text-nowrap">
        <div>
          <Label htmlFor="gemini-api-key">Gemini API Key</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Don't have one? get from{" "}
            <a
              target="_blank"
              rel="noreferrer"
              href="https://aistudio.google.com/u/0/apikey"
              className="underline"
            >
              AI Studio
            </a>
          </p>
        </div>
        <Input
          className="w-1/3"
          id="gemini-api-key"
          type="password"
          value={geminiApiKey ?? ""}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>
      <div className="flex flex-col justify-between gap-y-3 text-nowrap">
        <Label htmlFor="custom-prompt">
          Custom Instructions for AI
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="size-3" />
            </TooltipTrigger>
            <TooltipContent>
              Your personal rules defining what's productive and what's not.
              (Optional)
            </TooltipContent>
          </Tooltip>
        </Label>
        <Textarea
          id="custom-prompt"
          placeholder="Example: 'All vlogs are productive, except for the ones from youtube channel XYZ'"
          value={customPrompt ?? ""}
          onChange={(e) => setCustomPrompt(e.target.value)}
        />
      </div>
    </Section>
  );
}
