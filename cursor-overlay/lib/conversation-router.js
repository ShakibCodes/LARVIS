/* eslint-disable @typescript-eslint/no-require-imports */
const { extractBuddyChatIntent } = require("./buddy-chat");
const {
  extractBrowserTaskIntent,
  extractGenericOpenWebsiteIntent,
  extractMultipleBrowserTaskIntents,
} = require("./browser-commands");
const { extractCursorColorIntent } = require("./cursor-commands");
const { buildReply } = require("./reply-builder");
const { detectResponseLanguage } = require("./text-utils");
const { extractWebKnowledgeIntent } = require("./web-knowledge");

function createConversationRouter({
  actionExecutor,
  answerBuddyChat,
  answerWebKnowledgeQuestion,
  applyCursorColor,
  browserCommands,
  conversationContext,
  decisionLog = null,
  overlayWindowProvider,
  planAction,
  speakInterim,
}) {
  function logDecision(transcript, route, detail = {}) {
    decisionLog?.add({
      detail,
      route,
      transcript,
    });
  }

  async function resolve(transcript, payload) {
    const overlayWindow = overlayWindowProvider();
    const responseLanguage = detectResponseLanguage(transcript);

    const cursorColorIntent = extractCursorColorIntent(transcript);
    if (cursorColorIntent) {
      logDecision(transcript, "command", { kind: "cursor-color", color: cursorColorIntent.color });
      return applyCursorColor(overlayWindow, cursorColorIntent);
    }

    const multipleBrowserTasks = extractMultipleBrowserTaskIntents(transcript);
    if (multipleBrowserTasks.length > 0) {
      logDecision(transcript, "command", {
        count: multipleBrowserTasks.length,
        kind: "multi-browser-open",
        sites: multipleBrowserTasks.map((task) => task.rule?.key || task.genericWebsite?.url).filter(Boolean),
      });
      return {
        message: browserCommands.openMultipleBrowserTasks(multipleBrowserTasks),
        route: "command",
      };
    }

    const directBrowserTask = extractBrowserTaskIntent(transcript);
    if (directBrowserTask) {
      logDecision(transcript, "command", { kind: "browser-task", site: directBrowserTask.site });
      return {
        message: await browserCommands.openBrowserTask(directBrowserTask),
        route: "command",
      };
    }

    const directGenericWebsite = extractGenericOpenWebsiteIntent(transcript);
    if (directGenericWebsite) {
      logDecision(transcript, "command", { kind: "generic-website", url: directGenericWebsite.url });
      return {
        message: browserCommands.openGenericWebsite(directGenericWebsite),
        route: "command",
      };
    }

    const buddyChatIntent = extractBuddyChatIntent(transcript);
    if (buddyChatIntent) {
      logDecision(transcript, "chat", { kind: "buddy-chat" });
      return {
        message: await answerBuddyChat(buddyChatIntent),
        memoryType: "chat",
        route: "chat",
      };
    }

    const resolvedContext = conversationContext.resolveFollowUp(transcript);
    const webKnowledgeIntent = extractWebKnowledgeIntent(transcript, resolvedContext);
    if (webKnowledgeIntent) {
      logDecision(transcript, "web", {
        isFollowUp: Boolean(resolvedContext?.isFollowUp),
        kind: "web-knowledge",
        language: webKnowledgeIntent.responseLanguage,
        query: webKnowledgeIntent.resolvedQuery,
      });
      await speakInterim(buildReply("webSearchStart", {}, responseLanguage));
      overlayWindow?.webContents.send("assistant:status", {
        text: "Checking the web...",
      });
      const message = await answerWebKnowledgeQuestion(webKnowledgeIntent).catch(() => {
        return "I tried checking the web, but I could not get reliable results right now.";
      });
      return {
        message,
        memoryType: "web",
        resolvedContext,
        route: "web",
      };
    }

    const plan = await planAction(transcript, payload);
    if (String(plan?.action || "none") === "none") {
      logDecision(transcript, "chat", { kind: "planner-none-fallback" });
      return {
        message: await answerBuddyChat({ message: transcript }),
        memoryType: "chat",
        route: "chat",
      };
    }

    logDecision(transcript, "command", { action: plan.action, kind: "planner-action" });
    return {
      ...(await actionExecutor.executePlannedAction({
        ...plan,
        responseLanguage,
      })),
      route: "command",
    };
  }

  return {
    resolve,
  };
}

module.exports = {
  createConversationRouter,
};
