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
    name: "gemini-2.5-flash-lite",
    displayName: "Gemini 2.5 Flash-Lite",
    role: "Recommended",
    speed: "Fast",
    dailyLimit: "1,000 Requests",
    quality: "Very Good",
  },
  {
    name: "gemma-3-12b-it",
    displayName: "Gemma 3 12B",
    role: "High Volume",
    speed: "Fast",
    dailyLimit: "14,400+ Requests",
    quality: "Mid",
  },
  {
    name: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash",
    role: "Highest Quality",
    speed: "Slower",
    dailyLimit: "250 Requests",
    quality: "Best",
  },
  {
    name: "gemma-3-27b-it",
    displayName: "Gemma 3 27B",
    role: "Quality & Volume",
    speed: "Slower",
    dailyLimit: "14,400+ Requests",
    quality: "Good",
  },
];
