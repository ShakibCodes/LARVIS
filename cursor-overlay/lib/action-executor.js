/* eslint-disable @typescript-eslint/no-require-imports */
const { detectResponseLanguage, normalizeTranscript } = require("./text-utils");
const { buildReply } = require("./reply-builder");

function createActionExecutor({ browserCommands, extractBrowserTaskIntent, extractGenericOpenWebsiteIntent, runCommand, shell }) {
  const { openBrowserTask, openGenericWebsite } = browserCommands;

  async function executePlannedAction(plan) {
    const action = (plan?.action || "none").toString();
    const argument = (plan?.argument || "").toString().trim();
    const responseLanguage = plan?.responseLanguage || detectResponseLanguage(argument);

    const plannedBrowserTask = extractBrowserTaskIntent(argument) || extractBrowserTaskIntent(`${action} ${argument}`);
    if (plannedBrowserTask) {
      return { message: await openBrowserTask(plannedBrowserTask) };
    }

    const plannedGenericWebsite = extractGenericOpenWebsiteIntent(`${action.replace("_", " ")} ${argument}`);
    if (plannedGenericWebsite) {
      return { message: openGenericWebsite(plannedGenericWebsite) };
    }

    if (action === "open_notepad") {
      runCommand("start notepad");
      return { message: buildReply("open", { target: "Notepad" }, responseLanguage) };
    }

    if (action === "open_calculator") {
      runCommand("start calc");
      return { message: buildReply("open", { target: "Calculator" }, responseLanguage) };
    }

    if (action === "open_vscode") {
      runCommand("start code");
      return { message: buildReply("open", { target: "VS Code" }, responseLanguage) };
    }

    if (action === "search_web" && argument) {
      const browserTask = extractBrowserTaskIntent(argument);
      if (browserTask) {
        return { message: await openBrowserTask(browserTask) };
      }
      shell.openExternal(`https://www.google.com/search?q=${encodeURIComponent(argument)}`);
      return { message: buildReply("search", { site: "Google", query: argument }, responseLanguage) };
    }

    if (action === "open_website" && argument) {
      const browserTask = extractBrowserTaskIntent(argument);
      if (browserTask) {
        return { message: await openBrowserTask(browserTask) };
      }
      const genericWebsite = extractGenericOpenWebsiteIntent(`open ${argument}`);
      if (genericWebsite) {
        return { message: openGenericWebsite(genericWebsite) };
      }
      const fullUrl = argument.startsWith("http") ? argument : `https://${argument}`;
      shell.openExternal(fullUrl);
      const spokenSite = fullUrl
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0]
        .split(".")
        .slice(0, 2)
        .join(" ");
      return { message: buildReply("open", { target: spokenSite }, responseLanguage) };
    }

    if (action === "explain_software") {
      return {
        message: buildReply("guide", { target: argument || "this software" }, responseLanguage),
        suppressFinalTts: true,
        shouldStartGuidedTour: true,
        softwareName: argument || "this software",
      };
    }

    if (action === "locate_ui_element") {
      return {
        message: buildReply("locate", { target: argument || "that control" }, responseLanguage),
        suppressFinalTts: true,
        shouldLocateElement: true,
        elementName: argument || "requested control",
      };
    }

    return { message: plan?.reply || buildReply("unsupported", {}, responseLanguage) };
  }

  async function executeVoiceCommandFallback(transcript) {
    const normalized = normalizeTranscript(transcript);
    const responseLanguage = detectResponseLanguage(transcript);

    const browserTask = extractBrowserTaskIntent(normalized);
    if (browserTask) {
      return openBrowserTask(browserTask);
    }

    const genericWebsite = extractGenericOpenWebsiteIntent(normalized);
    if (genericWebsite) {
      return openGenericWebsite(genericWebsite);
    }

    if (normalized.includes("open notepad")) {
      runCommand("start notepad");
      return buildReply("open", { target: "Notepad" }, responseLanguage);
    }

    if (normalized.includes("open calculator")) {
      runCommand("start calc");
      return buildReply("open", { target: "Calculator" }, responseLanguage);
    }

    if (normalized.includes("open vscode") || normalized.includes("open vs code")) {
      runCommand("start code");
      return buildReply("open", { target: "VS Code" }, responseLanguage);
    }

    if (normalized.startsWith("search for ")) {
      const query = normalized.replace("search for ", "").trim();
      const nestedBrowserTask = extractBrowserTaskIntent(query);
      if (nestedBrowserTask) {
        return openBrowserTask(nestedBrowserTask);
      }
      shell.openExternal(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
      return buildReply("search", { site: "Google", query }, responseLanguage);
    }

    if (normalized.startsWith("open website ")) {
      const url = normalized.replace("open website ", "").trim();
      const websiteIntent = extractGenericOpenWebsiteIntent(`open ${url}`);
      if (websiteIntent) {
        return openGenericWebsite(websiteIntent);
      }
      const fullUrl = url.startsWith("http") ? url : `https://${url}`;
      shell.openExternal(fullUrl);
      const spokenSite = fullUrl
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0]
        .split(".")[0]
        .replace(/[-_]+/g, " ");
      return buildReply("open", { target: spokenSite }, responseLanguage);
    }

    if (normalized.startsWith("explain ")) {
      const softwareName = normalized.replace("explain ", "").replace("software", "").trim();
      return buildReply("guide", { target: softwareName || "this app" }, responseLanguage);
    }

    return buildReply("unsupported", {}, responseLanguage);
  }

  return {
    executePlannedAction,
    executeVoiceCommandFallback,
  };
}

module.exports = {
  createActionExecutor,
};
