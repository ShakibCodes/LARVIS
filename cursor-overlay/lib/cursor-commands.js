/* eslint-disable @typescript-eslint/no-require-imports */
const { buildReply } = require("./reply-builder");
const { detectResponseLanguage, normalizeTranscript } = require("./text-utils");

const CURSOR_COLORS = [
  { color: "blue", aliases: ["blue", "default"] },
  { color: "green", aliases: ["green"] },
  { color: "yellow", aliases: ["yellow", "gold"] },
  { color: "red", aliases: ["red"] },
];

function extractCursorColorIntent(transcript) {
  const responseLanguage = detectResponseLanguage(transcript);
  const normalized = normalizeTranscript(transcript)
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!/\b(cursor|pointer|arrow)\b/.test(normalized) && !/(कर्सर|کرسر)/.test(normalized)) {
    return null;
  }

  const hasColorIntent =
    /\b(change|make|set|turn|switch|karo|kar do|badlo|badal|change karo)\b/.test(normalized) ||
    /\b(color|colour|theme|rang)\b/.test(normalized) ||
    /(रंग|बदल|بدل|رنگ)/.test(normalized);

  if (!hasColorIntent) {
    return null;
  }

  for (const option of CURSOR_COLORS) {
    if (option.aliases.some((alias) => new RegExp(`\\b${alias}\\b`).test(normalized))) {
      return {
        color: option.color,
        displayName: option.color[0].toUpperCase() + option.color.slice(1),
        responseLanguage,
      };
    }
  }

  return null;
}

function applyCursorColor(overlayWindow, intent) {
  if (!overlayWindow || overlayWindow.isDestroyed() || !intent?.color) {
    return { message: "I can change the cursor color, but the overlay is not ready right now." };
  }

  overlayWindow.webContents.send("cursor:set-color", {
    color: intent.color,
  });

  return {
    message: buildReply("cursorColor", { color: intent.displayName }, intent.responseLanguage || "english"),
  };
}

module.exports = {
  applyCursorColor,
  extractCursorColorIntent,
};
