import { getStorageData } from "@/shared/storage";

export async function callGeminiAPI(
  prompt: string,
  apiKey: string,
  model?: string,
): Promise<string> {
  model = model ?? (await getStorageData(["aiModel"])).aiModel;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const requestBody = {
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

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error?.message || `HTTP error: ${response.status}`,
    );
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
