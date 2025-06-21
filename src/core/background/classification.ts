import type { Metadata } from "@/shared/types";
import { isDistracting } from "@/shared/utils";

export async function getClassification(
  metadata: Metadata,
): Promise<"productive" | "distracting"> {
  return (await isDistracting(metadata)) ? "distracting" : "productive";
}
