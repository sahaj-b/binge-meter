import { getStorageData, setStorageData } from "@/shared/storage";
import type { Metadata } from "@/shared/types";
import { classifyByUserRules } from "@/shared/utils";
import { callGeminiAPI } from "./aiService";

export async function getClassification(
  metadata: Metadata,
  ai = true,
): Promise<"productive" | "distracting"> {
  const distracting = await classifyByUserRules(metadata);
  if (distracting !== null || !ai)
    return distracting !== "productive" ? "distracting" : "productive";

  const { aiEnabled, aiDisabledSites } = await getStorageData([
    "aiEnabled",
    "aiDisabledSites",
  ]);
  if (aiEnabled && !aiDisabledSites.some((site) => metadata.url.includes(site)))
    return await classifyByAI(metadata);
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
    await getPrompt(metadata),
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

async function getPrompt(metadata: Metadata) {
  let ytPrompt = "";
  let redditPrompt = "";
  let customPromptSection = "";
  let userRulesSection = "";
  const { customPrompt, userRules } = await getStorageData([
    "customPrompt",
    "userRules",
  ]);
  if (customPrompt) {
    customPromptSection = `
      The following is user's personal rules. GIVE THIS HIGHEST PRIORITY WHILE CLASSIFYING
      ---- CUSTOM INSTRUCTIONS START ----
      ${customPrompt}
      ---- CUSTOM INSTRUCTIONS END ----
      `;
  }
  const userRuleEntries = Object.entries(userRules.urls);
  if (userRuleEntries.length > 0)
    userRulesSection = `
      The following are URLs which are manually classified by User. Consider these too while classifying
      ---- URL USER RULES START ----
      ${userRuleEntries
        .map(
          ([url, [classification, metadata]]) =>
            `${url} IS ${classification}; ${
              metadata ? `Metadata: ${metadata}` : ""
            }`,
        )
        .join("\n")}
      ---- URL USER RULES END ----
      `;

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
  // console.log("Metadata prompt:", metadataPrompt);
  // console.log(userRulesSection);
  return `
    You are a classification engine for a productivity application called BingeMeter. Your sole purpose is to analyze webpage metadata and determine if the content is "PRODUCTIVE" or "DISTRACTING" for a user trying to focus on work or learning.

    DEFINITIONS:
    - PRODUCTIVE: Content that is educational(in any field), instructional, work-related, technical tutorial, etc. Examples: programming tutorials, software documentation, university lectures, articles on professional skills, software design documentary
    - DISTRACTING: Content that is primarily for entertainment/dopamine, mindless scrolling, social media, celebrity gossip, gaming, or general time-wasting. It could look like its educational like "Worlds Most Expensive AI vs Blender", but its distracting because it doesn't really teach anything. Examples: memes, reaction videos, vlogs, most social media feeds, "Top 10" listicles, gaming streams, etc.
    Distracting Youtube Title examples: "Biggest lie about programmers", "This website made people do disgusting acts", "The Linux community is cooked", "Top 10 skills I learned this year"
    Productive Youtube Title examples: "Binary Search Trees tutorial", "Tariffs Explained with Bananas"

    ${customPromptSection}

    ${userRulesSection}

    MANDATORY RULES:
    -  Your response MUST be a single word: "PRODUCTIVE" or "DISTRACTING".
    -  DO NOT use punctuation.
    -  Analyze ALL provided metadata to make your decision.
    -  If you are unsure, respond with "DISTRACTING".
    -  Sometimes, the metadata will be mismatched (i.e, 2 different websites metadata can be mixed, because of incostistent navigation)
    -  If some metadata is missmatching(eg, title and url is different than description/tags/OG metadata), always give priority to YOUTUBE/REDDIT section first, then Core TITLE and URL, and forget the rest

    Analyze the following webpage metadata:
    ${metadataPrompt}
    `;
}
