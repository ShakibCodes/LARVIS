/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require("assert");
const { createConversationContext } = require("../lib/conversation-context");
const { createConversationRouter } = require("../lib/conversation-router");
const { createDecisionLog } = require("../lib/decision-log");
const {
  extractBrowserTaskIntent,
  extractMultipleBrowserTaskIntents,
} = require("../lib/browser-commands");
const { _test, extractWebKnowledgeIntent } = require("../lib/web-knowledge");

function createTestRouter() {
  const opened = [];
  const decisionLog = createDecisionLog();
  const conversationContext = createConversationContext();
  const browserCommands = {
    openBrowserTask: async (intent) => {
      opened.push(intent.site);
      return `Opening ${intent.rule.displayName}`;
    },
    openGenericWebsite: (intent) => {
      opened.push(intent.url);
      return `Opening ${intent.displayName}`;
    },
    openMultipleBrowserTasks: (intents) => {
      for (const intent of intents) {
        opened.push(intent.rule?.key || intent.genericWebsite?.url);
      }
      return "Opening them now.";
    },
  };

  const router = createConversationRouter({
    actionExecutor: {
      executePlannedAction: async () => ({ message: "Executed." }),
    },
    answerBuddyChat: async (intent) => `chat:${intent.message}`,
    answerWebKnowledgeQuestion: async (intent) => `web:${intent.resolvedQuery}`,
    applyCursorColor: (_overlayWindow, intent) => ({ message: `Cursor ${intent.color}`, route: "command" }),
    browserCommands,
    conversationContext,
    decisionLog,
    overlayWindowProvider: () => ({
      webContents: {
        send: () => {},
      },
    }),
    planAction: async () => ({ action: "none" }),
    speakInterim: async () => {},
  });

  return {
    conversationContext,
    decisionLog,
    opened,
    router,
  };
}

async function run() {
  assert.strictEqual(
    extractBrowserTaskIntent('Hey I am on x.com, can you say "hi" to X'),
    null,
    "casual X mention must not open X",
  );
  assert.strictEqual(
    extractBrowserTaskIntent('Hey I am on YouTube and I am live, can you say "hi" to my subscribers'),
    null,
    "casual YouTube live mention must not open YouTube",
  );
  assert.deepStrictEqual(
    extractMultipleBrowserTaskIntents("open youtube, linkedin, github and gmail").map((intent) => intent.rule.key),
    ["youtube", "linkedin", "github", "gmail"],
    "multi-open should extract all requested sites once",
  );

  const chatRouter = createTestRouter();
  const chatResult = await chatRouter.router.resolve('Hey I am on YouTube and I am live, can you say "hi" to my subscribers', {});
  assert.strictEqual(chatResult.route, "chat");
  assert.strictEqual(chatRouter.opened.length, 0);

  const commandRouter = createTestRouter();
  const commandResult = await commandRouter.router.resolve("open gmail and github", {});
  assert.strictEqual(commandResult.route, "command");
  assert.deepStrictEqual(commandRouter.opened, ["gmail", "github"]);

  const webRouter = createTestRouter();
  const webResult = await webRouter.router.resolve("who has the most subscribers on youtube?", {});
  assert.strictEqual(webResult.route, "web");
  assert.match(webResult.message, /^web:/);

  const context = createConversationContext();
  context.remember({
    answer: "MrBeast is generally listed as the biggest YouTube channel by subscribers.",
    type: "web",
    userText: "Who has the most subscribers on YouTube?",
  });
  const resolved = context.resolveFollowUp("Is he a billionaire?");
  assert.strictEqual(resolved.isFollowUp, true);
  assert.match(resolved.query, /MrBeast/);
  assert.ok(extractWebKnowledgeIntent("Is he a billionaire?", resolved), "pronoun follow-up should route to web");

  const articleText = _test.extractReadableText(`
    <html><body><nav>menu</nav><article><h1>Title</h1><p>Reliable article text about MrBeast.</p></article></body></html>
  `);
  assert.strictEqual(articleText, "Title Reliable article text about MrBeast.");
  assert.strictEqual(_test.isLikelyReadableUrl("https://example.com/story"), true);
  assert.strictEqual(_test.isLikelyReadableUrl("https://example.com/file.pdf"), false);

  assert.ok(chatRouter.decisionLog.list().some((entry) => entry.route === "chat"));
  assert.ok(commandRouter.decisionLog.list().some((entry) => entry.route === "command"));
  assert.ok(webRouter.decisionLog.list().some((entry) => entry.route === "web"));
}

run()
  .then(() => {
    console.log("routing smoke tests passed");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
