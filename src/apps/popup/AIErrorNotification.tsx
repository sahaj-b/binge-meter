import { useEffect, useState } from "react";
import { X, AlertTriangle, AlertCircle } from "lucide-react";
import { getAIError, clearAIError } from "@/shared/storage";
import type { AIError } from "@/shared/types";
import usePopupStore from "./store";

export function AIErrorNotification() {
  const [error, setError] = useState<AIError | null>(null);
  const aiEnabled = usePopupStore((state) => state.aiEnabled);

  useEffect(() => {
    const checkForErrors = async () => {
      if (aiEnabled) {
        const aiError = await getAIError();
        if (aiError) {
          setError(aiError);
        }
      }
    };

    checkForErrors();
  }, [aiEnabled]);

  const handleDismiss = async () => {
    setError(null);
    await clearAIError();
  };

  if (!aiEnabled || !error) return null;

  const Icon = error.severity === "error" ? AlertCircle : AlertTriangle;
  const bgColor =
    error.severity === "error" ? "bg-destructive/10" : "bg-yellow-500/10";
  const borderColor =
    error.severity === "error"
      ? "border-destructive/20"
      : "border-yellow-500/20";
  const textColor =
    error.severity === "error" ? "text-destructive" : "text-yellow-600";

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-3 mb-4`}>
      <div className="flex items-start space-x-2">
        <Icon size={16} className={`${textColor} mt-0.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${textColor} font-medium`}>
            {error.severity === "error" ? "AI Error" : "AI Warning"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
        <button
          onClick={handleDismiss}
          className={`${textColor} hover:opacity-70 flex-shrink-0`}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
