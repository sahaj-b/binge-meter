import { debugLog } from "@/shared/logger";
import { getStorageData } from "@/shared/storage";

export async function callGeminiAPI(
  prompt: string,
  apiKey: string,
  model?: string,
): Promise<string> {
  model = model ?? (await getStorageData(["aiModel"])).aiModel;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  let requestBody: any = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
  };

  if (model === "gemini-2.5-flash") {
    requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    };
  }

  debugLog("Calling ", model);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok || response.status >= 400) {
    const errorData = await response.json();
    throw new Error(
      errorData.error?.message || `HTTP error: ${response.status}`,
    );
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
