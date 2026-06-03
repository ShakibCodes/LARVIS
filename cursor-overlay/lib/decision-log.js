/* eslint-disable @typescript-eslint/no-require-imports */
const { normalizeTranscript } = require("./text-utils");

function createDecisionLog(limit = 80) {
  const entries = [];

  function add(entry) {
    const nextEntry = {
      at: new Date().toISOString(),
      route: String(entry?.route || "unknown"),
      transcript: normalizeTranscript(entry?.transcript || ""),
      detail: entry?.detail || {},
    };

    entries.push(nextEntry);
    while (entries.length > limit) {
      entries.shift();
    }

    return nextEntry;
  }

  function list() {
    return entries.slice().reverse();
  }

  function clear() {
    entries.length = 0;
  }

  return {
    add,
    clear,
    list,
  };
}

module.exports = {
  createDecisionLog,
};
