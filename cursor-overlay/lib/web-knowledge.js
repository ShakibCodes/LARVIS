/* eslint-disable @typescript-eslint/no-require-imports */
const { getGroqTextApiKey } = require("./env");
const { GROQ_MODELS } = require("./groq-models");
const { sanitizeAssistantText } = require("./response-sanitizer");
const { detectResponseLanguage, getLanguageInstruction, normalizeTranscript } = require("./text-utils");

const QUESTION_STARTERS = [
  "what",
  "who",
  "when",
  "where",
  "why",
  "how",
  "which",
  "tell me",
  "explain",
  "give me",
  "find out",
  "look up",
  "search about",
  "batao",
  "bataye",
  "kaun",
  "kya",
  "kab",
  "kahan",
  "kyu",
];

const CURRENT_TERMS = [
  "latest",
  "today",
  "current",
  "recent",
  "news",
  "update",
  "updates",
  "now",
  "this week",
  "this month",
];

const MULTILINGUAL_QUESTION_CUES =
  /(कौन|क्या|कब|कहाँ|कहां|क्यों|कैसे|बताओ|بتاؤ|کون|کیا|کب|کہاں|کیوں|کیسے|kaun|kya|kab|kahan|kyu|kaise|batao)/;

const CASUAL_QUESTIONS = [
  /\bhow are you\b/,
  /\bhow r you\b/,
  /\bwhat's up\b/,
  /\bwhats up\b/,
  /\byou there\b/,
  /\bcan you hear me\b/,
  /\bkaise ho\b/,
  /\bkya haal\b/,
  /(कैसे हो|क्या हाल|کیسے ہو|کیا حال)/,
];

const LOCAL_CONVERSATION_CONTEXT = [
  /\b(i am|i'm|im)\b.+\b(on|in|live|streaming|recording)\b/,
  /\b(say|tell|greet|wish|shout out)\b.+\b(to|for)\b/,
  /\b(my|our)\s+(subscribers|chat|audience|viewers|followers|stream)\b/,
  /\b(this|current)\s+(page|site|app|screen|window|tab)\b/,
];
const WEB_CACHE_TTL_MS = 4 * 60 * 1000;
const SOURCE_CACHE_TTL_MS = 12 * 60 * 1000;
const WEB_FETCH_TIMEOUT_MS = 4200;
const SEARCH_RESULT_LIMIT = 8;
const SOURCE_FETCH_LIMIT = 5;
const FINAL_SOURCE_LIMIT = 3;
const MIN_SOURCE_TEXT_LENGTH = 180;
const MAX_SOURCE_CHARS = 3600;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const webAnswerCache = new Map();
const sourceTextCache = new Map();

function extractWebKnowledgeIntent(transcript, context = null) {
  const responseLanguage = detectResponseLanguage(transcript);
  const normalized = normalizeTranscript(transcript)
    .replace(/[^\p{L}\p{M}\p{N}\s?.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return null;
  }

  if (CASUAL_QUESTIONS.some((pattern) => pattern.test(normalized))) {
    return null;
  }

  if (LOCAL_CONVERSATION_CONTEXT.some((pattern) => pattern.test(normalized))) {
    return null;
  }

  if (/\b(open|launch|start|play|change|set|turn|make cursor|go to)\b/.test(normalized)) {
    return null;
  }

  const looksLikeQuestion =
    normalized.endsWith("?") ||
    QUESTION_STARTERS.some((starter) => normalized.startsWith(starter)) ||
    MULTILINGUAL_QUESTION_CUES.test(normalized) ||
    CURRENT_TERMS.some((term) => new RegExp(`\\b${term}\\b`).test(normalized)) ||
    Boolean(context?.isFollowUp);

  if (!looksLikeQuestion) {
    return null;
  }

  return {
    query: normalized.replace(/\?+$/g, "").trim(),
    resolvedQuery: String(context?.query || normalized).replace(/\?+$/g, "").trim(),
    previousTopic: context?.previous?.topic || "",
    responseLanguage,
    needsFreshSources: CURRENT_TERMS.some((term) => new RegExp(`\\b${term}\\b`).test(normalized)),
  };
}

async function answerWebKnowledgeQuestion(intent) {
  const query = buildSearchQuery(intent);
  const cachedAnswer = getCachedWebAnswer(query);
  if (cachedAnswer) {
    return cachedAnswer;
  }

  const searchResults = await searchDuckDuckGo(query);
  const sourceTexts = await collectSourceTexts(searchResults);

  if (sourceTexts.length === 0) {
    return "I tried checking the web, but I could not get reliable source text for that right now.";
  }

  const answer = await summarizeWithGroq(intent.query, sourceTexts, {
    previousTopic: intent.previousTopic,
    responseLanguage: intent.responseLanguage,
    resolvedQuery: intent.resolvedQuery,
  });
  setCachedWebAnswer(query, answer);
  return answer;
}

function getCachedWebAnswer(query) {
  const key = normalizeTranscript(query);
  const cached = webAnswerCache.get(key);
  if (!cached) {
    return "";
  }

  if (Date.now() - cached.savedAt > WEB_CACHE_TTL_MS) {
    webAnswerCache.delete(key);
    return "";
  }

  return cached.answer;
}

function setCachedWebAnswer(query, answer) {
  const key = normalizeTranscript(query);
  if (!key || !answer) {
    return;
  }

  webAnswerCache.set(key, {
    answer,
    savedAt: Date.now(),
  });
}

function buildSearchQuery(intent) {
  const baseQuery = intent?.resolvedQuery || intent?.query || "";
  if (!intent?.needsFreshSources) {
    return baseQuery;
  }

  const today = new Date().toISOString().slice(0, 10);
  return `${baseQuery} ${today}`;
}

async function searchDuckDuckGo(query) {
  const response = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    headers: {
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Web search failed (${response.status}).`);
  }

  const html = await response.text();
  const results = [];
  const resultRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let match = resultRegex.exec(html);

  while (match && results.length < SEARCH_RESULT_LIMIT) {
    const url = normalizeSearchResultUrl(decodeHtml(match[1]));
    const title = decodeHtml(stripHtml(match[2]));
    const snippet = extractResultSnippet(html, match.index);
    if (url && title && !results.some((result) => result.url === url)) {
      results.push({ title, url, snippet });
    }
    match = resultRegex.exec(html);
  }

  return results;
}

function normalizeSearchResultUrl(rawUrl) {
  try {
    const url = new URL(rawUrl, "https://duckduckgo.com");
    const redirected = url.searchParams.get("uddg");
    return redirected || url.href;
  } catch {
    return "";
  }
}

async function collectSourceTexts(searchResults) {
  const readableCandidates = searchResults.filter((result) => isLikelyReadableUrl(result.url)).slice(0, SOURCE_FETCH_LIMIT);
  const settledSources = await Promise.allSettled(
    readableCandidates.map(async (result, index) => {
      const text = await fetchReadableText(result.url).catch(() => "");
      if (!text || text.length < MIN_SOURCE_TEXT_LENGTH) {
        return null;
      }

      return {
        title: result.title,
        url: result.url,
        snippet: result.snippet || "",
        score: scoreSource(result, text, index),
        text: text.slice(0, MAX_SOURCE_CHARS),
      };
    }),
  );

  const fetchedSources = settledSources
    .filter((result) => result.status === "fulfilled" && result.value)
    .map((result) => result.value)
    .sort((left, right) => right.score - left.score)
    .slice(0, FINAL_SOURCE_LIMIT);

  if (fetchedSources.length >= 2) {
    return fetchedSources;
  }

  const snippetSources = searchResults
    .filter((result) => result.snippet && result.snippet.length >= 80)
    .filter((result) => !fetchedSources.some((source) => source.url === result.url))
    .slice(0, FINAL_SOURCE_LIMIT - fetchedSources.length)
    .map((result) => ({
      title: result.title,
      url: result.url,
      snippet: result.snippet,
      score: 0.25,
      text: result.snippet,
    }));

  return [...fetchedSources, ...snippetSources].slice(0, FINAL_SOURCE_LIMIT);
}

async function fetchReadableText(url) {
  const cached = getCachedSourceText(url);
  if (cached) {
    return cached;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEB_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,text/plain;q=0.9,*/*;q=0.6",
      },
    });

    if (!response.ok) {
      return "";
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return "";
    }

    const raw = await response.text();
    const readableText = extractReadableText(raw);
    setCachedSourceText(url, readableText);
    return readableText;
  } finally {
    clearTimeout(timeout);
  }
}

async function summarizeWithGroq(question, sourceTexts, context = {}) {
  const apiKey = getGroqTextApiKey();
  if (!apiKey) {
    throw new Error("Missing GROQ_AI_API_FOR_TEXT in .env.local or environment.");
  }

  const sourceBlock = sourceTexts
    .map(
      (source, index) =>
        `Source ${index + 1}: ${source.title}\nURL: ${source.url}\nSnippet: ${source.snippet || "none"}\nText: ${source.text}`,
    )
    .join("\n\n");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODELS.webKnowledge,
      temperature: 0.12,
      messages: [
        {
          role: "system",
          content:
            `Answer like a concise, natural voice assistant. ${getLanguageInstruction(context.responseLanguage || "english")} Use only the provided web sources. Prefer fresh, specific facts. If sources are weak, partial, or disagree, say that briefly. Keep it under 90 words. Do not mention URLs. If the user asks a follow-up with pronouns, resolve them using the provided conversation context.`,
        },
        {
          role: "user",
          content: `Question: ${question}\nResolved question/search context: ${context.resolvedQuery || question}\nPrevious topic: ${context.previousTopic || "none"}\n\nWeb sources:\n${sourceBlock}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq web answer failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  const answer = sanitizeAssistantText(data.choices?.[0]?.message?.content);
  return answer || "I checked the web, but I could not form a reliable answer from the sources.";
}

function stripHtml(html) {
  return decodeHtml(
    String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function extractReadableText(rawHtml) {
  const html = String(rawHtml || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ");
  const focusedHtml = extractFirstTagContent(html, "article") || extractFirstTagContent(html, "main") || html;
  return stripHtml(focusedHtml)
    .replace(/\b(cookie|privacy policy|subscribe|sign in|log in)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFirstTagContent(html, tagName) {
  const match = String(html || "").match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match?.[1] || "";
}

function extractResultSnippet(html, startIndex) {
  const resultChunk = String(html || "").slice(startIndex, startIndex + 3500);
  const snippetMatch =
    resultChunk.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i) ||
    resultChunk.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/div>/i);
  return snippetMatch ? decodeHtml(stripHtml(snippetMatch[1])).replace(/\s+/g, " ").trim() : "";
}

function isLikelyReadableUrl(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "");
    const pathname = parsed.pathname.toLowerCase();
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }
    if (/\.(pdf|jpg|jpeg|png|gif|webp|svg|mp4|mp3|zip|rar|7z|exe|dmg)$/i.test(pathname)) {
      return false;
    }
    if (/(accounts|login|signin|auth|checkout)\./i.test(hostname) || /\/(login|signin|account|checkout)\b/i.test(pathname)) {
      return false;
    }
    if (/^(x\.com|twitter\.com|facebook\.com|instagram\.com|tiktok\.com|pinterest\.com)$/.test(hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function scoreSource(result, text, index) {
  let score = Math.max(0, 1 - index * 0.12);
  const url = String(result?.url || "");
  const title = String(result?.title || "");
  const content = String(text || "");
  if (/\b(wikipedia|reuters|apnews|bbc|theverge|techcrunch|official|gov|edu)\b/i.test(url)) {
    score += 0.18;
  }
  if (title.length > 8) {
    score += 0.05;
  }
  if (content.length > 1400) {
    score += 0.12;
  }
  if (/\b(updated|published|reported|according to|announced)\b/i.test(content)) {
    score += 0.1;
  }
  return score;
}

function getCachedSourceText(url) {
  const cached = sourceTextCache.get(url);
  if (!cached) {
    return "";
  }

  if (Date.now() - cached.savedAt > SOURCE_CACHE_TTL_MS) {
    sourceTextCache.delete(url);
    return "";
  }

  return cached.text;
}

function setCachedSourceText(url, text) {
  if (!url || !text) {
    return;
  }

  sourceTextCache.set(url, {
    savedAt: Date.now(),
    text,
  });
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

module.exports = {
  _test: {
    collectSourceTexts,
    extractReadableText,
    extractResultSnippet,
    isLikelyReadableUrl,
    normalizeSearchResultUrl,
  },
  answerWebKnowledgeQuestion,
  extractWebKnowledgeIntent,
};
