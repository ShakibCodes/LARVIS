function normalizeTranscript(value) {
  return String(value || "").toLowerCase().trim();
}

const HINGLISH_MARKERS = [
  "acha",
  "accha",
  "abhi",
  "bata",
  "batao",
  "bhai",
  "bol",
  "chahiye",
  "chalao",
  "dekho",
  "hai",
  "hain",
  "haan",
  "ka",
  "karo",
  "khol",
  "kholo",
  "krdo",
  "kya",
  "kyu",
  "matlab",
  "mera",
  "mere",
  "mujhe",
  "nahi",
  "nhi",
  "open kar",
  "search karo",
  "theek",
  "yaar",
];

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSoftwareName(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[^\w\s.+-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectResponseLanguage(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "english";
  }

  const devanagariCount = countMatches(text, /[\u0900-\u097F]/g);
  const arabicScriptCount = countMatches(text, /[\u0600-\u06FF]/g);

  if (arabicScriptCount > 0 && arabicScriptCount >= devanagariCount) {
    return "urdu";
  }

  if (devanagariCount > 0) {
    return "hindi";
  }

  const normalized = normalizeTranscript(text).replace(/[^a-z0-9\s]/g, " ");
  const markerCount = HINGLISH_MARKERS.filter((marker) => new RegExp(`\\b${escapeRegExp(marker)}\\b`).test(normalized)).length;
  if (markerCount >= 1) {
    return "hinglish";
  }

  return "english";
}

function getLanguageInstruction(language) {
  if (language === "hindi") {
    return "Reply in natural Hindi. Keep it short, casual, and voice-friendly.";
  }
  if (language === "urdu") {
    return "Reply in natural Urdu. Keep it short, casual, and voice-friendly.";
  }
  if (language === "hinglish") {
    return "Reply in casual Hinglish using simple Roman Hindi/Urdu mixed with English. Keep it short and modern.";
  }

  return "Reply in natural English. Keep it short, casual, and voice-friendly.";
}

function countMatches(text, pattern) {
  return (String(text || "").match(pattern) || []).length;
}

module.exports = {
  detectResponseLanguage,
  escapeRegExp,
  getLanguageInstruction,
  normalizeSoftwareName,
  normalizeTranscript,
};
