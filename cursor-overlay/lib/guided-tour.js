/* eslint-disable @typescript-eslint/no-require-imports */
const { normalizeSoftwareName } = require("./text-utils");

function buildTourTemplates(softwareName) {
  const name = normalizeSoftwareName(softwareName);
  const common = [
    { x: 0.05, y: 0.07, text: "Top-left area: this is usually where app identity, menus, or quick actions live.", click: false },
    { x: 0.5, y: 0.09, text: "Top bar: most software keeps global controls and context up here.", click: false },
    { x: 0.09, y: 0.28, text: "Left side: this zone often contains navigation, tools, or project shortcuts.", click: true },
    { x: 0.52, y: 0.43, text: "Center workspace: this is the main area where your core work happens.", click: false },
    { x: 0.77, y: 0.83, text: "Bottom-right area: this typically shows status, notifications, or utility actions.", click: true },
  ];

  if (name.includes("vscode") || name.includes("vs code") || name.includes("visual studio code")) {
    return [
      { x: 0.02, y: 0.26, text: "Activity Bar: switch between Explorer, Search, Source Control, Run, and Extensions.", click: true },
      { x: 0.15, y: 0.3, text: "Explorer panel: your file tree and folders live here for quick navigation.", click: true },
      { x: 0.5, y: 0.43, text: "Editor area: this is where you open and edit code files.", click: false },
      { x: 0.5, y: 0.08, text: "Tab and title zone: shows open files and editor context.", click: false },
      { x: 0.5, y: 0.95, text: "Status bar: Git branch, errors, formatter, and environment info appear here.", click: true },
    ];
  }

  if (name.includes("chrome") || name.includes("browser") || name.includes("edge") || name.includes("firefox")) {
    return [
      { x: 0.16, y: 0.08, text: "Tab row: open pages are shown here and can be reordered.", click: true },
      { x: 0.47, y: 0.13, text: "Address bar: type URLs, search queries, or browser commands here.", click: true },
      { x: 0.93, y: 0.13, text: "Profile and menu controls are usually grouped on the top-right.", click: true },
      { x: 0.5, y: 0.45, text: "Main content pane: this is the active webpage area.", click: false },
      { x: 0.04, y: 0.13, text: "Back, forward, and refresh controls let you navigate page history.", click: true },
    ];
  }

  return common;
}

function createGuidedTourController({ getOverlayBounds, getOverlayWindow, planVisualElementLocation, planVisualGuidedTour }) {
  async function startSoftwareGuidedTour(softwareName, context) {
    const overlayWindow = getOverlayWindow();
    const overlayBounds = getOverlayBounds();
    if (!overlayWindow || overlayWindow.isDestroyed() || !overlayBounds) {
      return false;
    }

    let normalizedSteps = [];
    try {
      normalizedSteps = await planVisualGuidedTour(softwareName, context);
    } catch {
      normalizedSteps = buildTourTemplates(softwareName);
    }

    const steps = normalizedSteps.map((step) => ({
      x: Math.round(overlayBounds.width * step.x),
      y: Math.round(overlayBounds.height * step.y),
      text: step.text,
      click: Boolean(step.click),
    }));

    overlayWindow.webContents.send("assistant:guided-tour", {
      software: softwareName || "this software",
      steps,
    });

    return true;
  }

  async function startElementLocationTour(elementName, context) {
    const overlayWindow = getOverlayWindow();
    const overlayBounds = getOverlayBounds();
    if (!overlayWindow || overlayWindow.isDestroyed() || !overlayBounds) {
      return false;
    }

    const located = await planVisualElementLocation(elementName, context).catch(() => null);
    const hasValidModelPoint =
      Boolean(located) &&
      Number.isFinite(located.x) &&
      Number.isFinite(located.y) &&
      located.x >= 0 &&
      located.x <= 1 &&
      located.y >= 0 &&
      located.y <= 1;

    if (hasValidModelPoint) {
      overlayWindow.webContents.send("assistant:guided-tour", {
        software: "current window",
        steps: [
          {
            x: Math.round(overlayBounds.width * located.x),
            y: Math.round(overlayBounds.height * located.y),
            text: located.text || `This is the ${elementName}.`,
            click: true,
          },
        ],
      });
      return true;
    }

    const target = normalizeSoftwareName(elementName);
    if (target.includes("run")) {
      overlayWindow.webContents.send("assistant:guided-tour", {
        software: "VS Code",
        steps: [
          {
            x: Math.round(overlayBounds.width * 0.03),
            y: Math.round(overlayBounds.height * 0.46),
            text: "Run and Debug icon in the left Activity Bar.",
            click: true,
          },
        ],
      });
      return true;
    }

    return false;
  }

  return {
    startElementLocationTour,
    startSoftwareGuidedTour,
  };
}

module.exports = {
  createGuidedTourController,
};


// need to remove the pre guided coordinates and implement automated screen visualiser.