import { getStorageData, setStorageData } from "@/shared/store";
import type { Metadata } from "@/shared/types";
import { isDistracting } from "@/shared/utils";
import { callGeminiAPI } from "./aiService";

export async function getClassification(
  metadata: Metadata,
  ai = true,
): Promise<"productive" | "distracting"> {
  const distracting = await isDistracting(metadata);
  console.log("Distracting:", distracting);
  if (!distracting || !ai) {
    return distracting ? "distracting" : "productive";
  }
  const { aiEnabled } = await getStorageData(["aiEnabled"]);
  if (aiEnabled) return await classifyByAI(metadata);
  return distracting ? "distracting" : "productive";
}

async function classifyByAI(
  metadata: Metadata,
): Promise<"distracting" | "productive"> {
  const MAX_CACHE_SIZE = 500;
  console.log("Classifying by AI");
  const { aiCache, geminiApiKey } = await getStorageData([
    "aiCache",
    "geminiApiKey",
  ]);
  const aiCacheEntry = aiCache.find(([url]) => url === metadata.url);
  if (aiCacheEntry) {
    console.log("AI cache hit");
    return aiCacheEntry[1];
  }

  const aiResponse = await callGeminiAPI(
    getPrompt(metadata),
    geminiApiKey,
  ).catch(() => "");
  console.log("AI response:", aiResponse);

  const classification = aiResponse.toLowerCase().includes("productive")
    ? "productive"
    : "distracting";

  console.log("Updating AI cache");
  aiCache.push([metadata.url, classification]);
  if (aiCache.length > MAX_CACHE_SIZE) aiCache.shift();

  setStorageData({ aiCache });
  return classification;
}

function getPrompt(metadata: Metadata): string {
  let ytPrompt: string | null = null;
  let redditPrompt: string | null = null;
  if (metadata.youtube?.videoId) {
    ytPrompt = `
      YOUTUBE:
      - video id: ${metadata.youtube.videoId}
      - video title: ${metadata.youtube.videoTitle}
      - channel id: ${metadata.youtube.channelId}
      - channel name: ${metadata.youtube.channelName}
      `;
  }
  if (metadata.reddit?.subreddit) {
    redditPrompt = `
      REDDIT:
      - subreddit: ${metadata.reddit.subreddit}
      - post title: ${metadata.reddit.postTitle}
      `;
  }
  const metadataPrompt = `
    CORE:
    - title: ${metadata.title}
    - url: ${metadata.url}
    - description: ${metadata.pageMeta?.description}
    - h1: ${metadata.pageMeta?.h1}
    - keywords: ${metadata.pageMeta?.keywords}

    Open Graph:
    - title ${metadata.pageMeta?.ogTitle}
    - description ${metadata.pageMeta?.ogDescription}
    - type ${metadata.pageMeta?.ogType}
    - site name ${metadata.pageMeta?.ogSiteName}

    ${ytPrompt}
    ${redditPrompt}
    `;
  console.log("Metadata prompt:", metadataPrompt);
  return `
    You are a classification engine for a productivity application called BingeMeter. Your sole purpose is to analyze webpage metadata and determine if the content is "PRODUCTIVE" or "DISTRACTING" for a user trying to focus on work or learning.

    DEFINITIONS:
    - PRODUCTIVE: Content that is educational(in any field), instructional, work-related, technical tutorial, documentary, or a tool for creation. Examples: programming tutorials, software documentation, university lectures, articles on professional skills.
    - DISTRACTING: Content that is primarily for entertainment/dopamine, mindless scrolling, social media, celebrity gossip, gaming, or general time-wasting. Examples: memes, reaction videos, vlogs, most social media feeds, "Top 10" listicles, gaming streams, etc.

    MANDATORY RULES:
    -  Your response MUST be a single word: "PRODUCTIVE" or "DISTRACTING".
    -  DO NOT use punctuation.
    -  Analyze ALL provided metadata to make your decision.
    -  If you are unsure, respond with "DISTRACTING".
    -  Sometimes, the metadata will be mismatched (i.e, 2 different websites metadata can be mixed, because of incostistent navigation)
    -  If some metadata is missmatching(eg, title and url is different than description/tags/OG metadata), always give priority to YOUTUBE/REDDIT section, then Core TITLE and URL, and forget the rest

    Analyze the following webpage metadata:
    ${metadataPrompt}
    `;
}
