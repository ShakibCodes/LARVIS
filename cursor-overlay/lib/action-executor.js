/* eslint-disable @typescript-eslint/no-require-imports */
const { normalizeTranscript } = require("./text-utils");

function createActionExecutor({ browserCommands, extractBrowserTaskIntent, extractGenericOpenWebsiteIntent, runCommand, shell }) {
  const { openBrowserTask, openGenericWebsite } = browserCommands;

  async function executePlannedAction(plan) {
    const action = (plan?.action || "none").toString();
    const argument = (plan?.argument || "").toString().trim();

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
      return { message: "Opening Notepad." };
    }

    if (action === "open_calculator") {
      runCommand("start calc");
      return { message: "Opening Calculator." };
    }

    if (action === "open_vscode") {
      runCommand("start code");
      return { message: "Opening VS Code." };
    }

    if (action === "search_web" && argument) {
      const browserTask = extractBrowserTaskIntent(argument);
      if (browserTask) {
        return { message: await openBrowserTask(browserTask) };
      }
      shell.openExternal(`https://www.google.com/search?q=${encodeURIComponent(argument)}`);
      return { message: `Searching for ${argument}.` };
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
      return { message: `Opening ${spokenSite}.` };
    }

    if (action === "explain_software") {
      return {
        message: `Starting a guided walkthrough of ${argument || "this software"}. Watch the secondary cursor as it points through the interface.`,
        suppressFinalTts: true,
        shouldStartGuidedTour: true,
        softwareName: argument || "this software",
      };
    }

    if (action === "locate_ui_element") {
      return {
        message: `Sure, I will point out ${argument || "that control"} in your current window.`,
        suppressFinalTts: true,
        shouldLocateElement: true,
        elementName: argument || "requested control",
      };
    }

    return { message: plan?.reply || "I understood you, but no safe action was executed." };
  }

  async function executeVoiceCommandFallback(transcript) {
    const normalized = normalizeTranscript(transcript);

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
      return "Opening Notepad.";
    }

    if (normalized.includes("open calculator")) {
      runCommand("start calc");
      return "Opening Calculator.";
    }

    if (normalized.includes("open vscode") || normalized.includes("open vs code")) {
      runCommand("start code");
      return "Opening VS Code.";
    }

    if (normalized.startsWith("search for ")) {
      const query = normalized.replace("search for ", "").trim();
      const nestedBrowserTask = extractBrowserTaskIntent(query);
      if (nestedBrowserTask) {
        return openBrowserTask(nestedBrowserTask);
      }
      shell.openExternal(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
      return `Searching for ${query}.`;
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
      return `Opening ${spokenSite}.`;
    }

    if (normalized.startsWith("explain ")) {
      const softwareName = normalized.replace("explain ", "").replace("software", "").trim();
      return `Starting a guided walkthrough of ${softwareName || "this app"}.`;
    }

    return "I heard you, but that command is not in the current safe command set yet.";
  }

  return {
    executePlannedAction,
    executeVoiceCommandFallback,
  };
}

module.exports = {
  createActionExecutor,
};
