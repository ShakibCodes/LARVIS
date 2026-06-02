function normalizeTranscript(value) {
  return String(value || "").toLowerCase().trim();
}

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

module.exports = {
  escapeRegExp,
  normalizeSoftwareName,
  normalizeTranscript,
};
