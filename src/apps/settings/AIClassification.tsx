import { Label } from "@/apps/components/ui/label";
import { Switch } from "@/apps/components/ui/switch";
import { Input } from "@/apps/components/ui/input";
import { useStore } from "./state";
import { Section } from "./Section";

export function AIClassification() {
  const aiEnabled = useStore((state) => state.aiEnabled);
  const geminiApiKey = useStore((state) => state.geminiApiKey);
  const setAiEnabled = useStore((state) => state.setAiEnabled);
  const setApiKey = useStore((state) => state.setApiKey);

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
        <Label htmlFor="gemini-api-key">Gemini API Key</Label>
        <Input
          className="w-1/2"
          id="gemini-api-key"
          type="password"
          value={geminiApiKey ?? ""}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>
    </Section>
  );
}
