export type AIModel = {
  name: string;
  displayName: string;
  role: string;
  speed: string;
  dailyLimit: string;
  quality: string;
};

export const aiModels: AIModel[] = [
  {
    name: "gemini-3.1-flash-lite",
    displayName: "Gemini 3.1 Flash Lite",
    role: "Recommended",
    speed: "Fast",
    dailyLimit: "500 Requests",
    quality: "High",
  },
  {
    name: "gemma-4-31b-it",
    displayName: "Gemma 4 31B",
    role: "High Volume",
    speed: "Fast",
    dailyLimit: "1,500 Requests",
    quality: "Mid",
  },
  {
    name: "gemma-4-26b-a4b-it",
    displayName: "Gemma 4 26B",
    role: "Max Volume",
    speed: "Fast",
    dailyLimit: "1,500 Requests",
    quality: "Low",
  },
];
