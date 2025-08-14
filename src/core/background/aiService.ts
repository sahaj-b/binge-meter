import { debugLog } from "@/shared/logger";
import { getStorageData, setAIError } from "@/shared/storage";

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
    const errorMessage =
      errorData.error?.message || `HTTP error: ${response.status}`;

    // Store AI error for popup display
    const severity = response.status === 429 ? "warning" : "error";
    let userFriendlyMessage = errorMessage;

    if (response.status === 429) {
      userFriendlyMessage =
        "AI API rate limit exceeded. Please try again later.";
    } else if (response.status === 401 || response.status === 403) {
      userFriendlyMessage = "Invalid API key. Please check your settings.";
    } else if (response.status >= 500) {
      userFriendlyMessage =
        "AI service temporarily unavailable. Please try again.";
    }

    await setAIError(userFriendlyMessage, severity);
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
