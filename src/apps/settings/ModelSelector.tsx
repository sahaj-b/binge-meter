import { Label } from "@ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@ui/tooltip";
import { aiModels } from "./aiModels";
import { useStore } from "./store";
import { Calendar, Star, Zap } from "lucide-react";

export function ModelSelector() {
  const aiModel = useStore((state) => state.aiModel);
  const setAiModel = useStore((state) => state.setAiModel);

  const selectedModel =
    aiModels.find((model) => model.name === aiModel) || aiModels[0];

  function getModelItemDisplay(model: (typeof aiModels)[0]) {
    return (
      <>
        {model.displayName}
        <span className="text-muted-foreground">{"(" + model.role + ")"}</span>
      </>
    );
  }

  return (
    <div className="flex justify-between text-nowrap">
      <div>
        <Label htmlFor="ai-model">AI Model</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Choose the model for site classification
        </p>
      </div>
      <Select value={aiModel ?? aiModels[0].name} onValueChange={setAiModel}>
        <SelectTrigger className="w-1/3" id="ai-model">
          <SelectValue>{getModelItemDisplay(selectedModel)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {aiModels.map((model) => (
            <TooltipProvider key={model.name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SelectItem value={model.name} className="cursor-pointer">
                    {getModelItemDisplay(model)}
                  </SelectItem>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[280px]">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="text-primary size-3" />
                      <span className="text-sm">
                        <b>Speed:</b> {model.speed}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="text-primary size-3" />
                      <span className="text-sm">
                        <b>Daily Cap:</b> {model.dailyLimit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="text-primary size-3" />
                      <span className="text-sm">
                        <b>Quality:</b> {model.quality}
                      </span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
