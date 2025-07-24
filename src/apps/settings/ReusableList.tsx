import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@ui/button";
import { Input } from "@ui/input";
import { Trash2, Plus, Loader2 } from "lucide-react";

interface ReusableListProps {
  items: string[];
  onAddItem: (item: string) => Promise<void>;
  onRemoveItem: (item: string) => Promise<void>;
  placeholder: string;
  error?: string | null;
  actions?: (item: string) => ReactNode;
}

export function ReusableList({
  items,
  onAddItem,
  onRemoveItem,
  placeholder,
  actions,
}: ReusableListProps) {
  const [newItem, setNewItem] = useState("");
  const [isAddingLoading, setIsAddingLoading] = useState(false);
  const [error, setError] = useState("");
  const [removingLoadingSet, setRemovingLoadingSet] = useState<Set<string>>(
    new Set(),
  );

  async function handleAddItem() {
    setIsAddingLoading(true);
    await onAddItem(newItem).catch((e) => {
      setError(e.message);
    });
    setNewItem("");
    setIsAddingLoading(false);
  }

  async function handleRemoveItem(item: string) {
    setRemovingLoadingSet((prev) => new Set(prev).add(item));
    await onRemoveItem(item);
    setRemovingLoadingSet((prev) => {
      const newSet = new Set(prev);
      newSet.delete(item);
      return newSet;
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          className="text-sm"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
          disabled={isAddingLoading}
        />
        <Button onClick={handleAddItem} size="icon" disabled={isAddingLoading}>
          {isAddingLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus />
          )}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {items?.map((item) => (
          <div
            key={item}
            className="flex items-center justify-between py-2 px-3 bg-muted/60 rounded-md"
          >
            <span className="text-sm break-all">{item}</span>
            <div className="flex items-center gap-2">
              {actions?.(item)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveItem(item)}
                className="hover:bg-destructive/10 hover:text-destructive"
                disabled={removingLoadingSet.has(item)}
              >
                {removingLoadingSet.has(item) ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
