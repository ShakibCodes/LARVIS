/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const { app, BrowserWindow, globalShortcut, screen } = require("electron");

let overlayWindow = null;
let tickInterval = null;

function getVirtualBounds() {
  const displays = screen.getAllDisplays();

  const left = Math.min(...displays.map((display) => display.bounds.x));
  const top = Math.min(...displays.map((display) => display.bounds.y));
  const right = Math.max(...displays.map((display) => display.bounds.x + display.bounds.width));
  const bottom = Math.max(...displays.map((display) => display.bounds.y + display.bounds.height));

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

function createOverlay() {
  const bounds = getVirtualBounds();

  overlayWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.setAlwaysOnTop(true, "screen-saver");
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });

  overlayWindow.loadFile(path.join(__dirname, "overlay.html"));

  tickInterval = setInterval(() => {
    if (!overlayWindow || overlayWindow.isDestroyed()) {
      return;
    }

    const point = screen.getCursorScreenPoint();
    overlayWindow.webContents.send("cursor:position", {
      x: point.x - bounds.x,
      y: point.y - bounds.y,
    });
  }, 8);
}

app.whenReady().then(() => {
  createOverlay();

  // Quick escape hatch for closing the overlay.
  globalShortcut.register("CommandOrControl+Shift+X", () => {
    app.quit();
  });
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();

  if (tickInterval) {
    clearInterval(tickInterval);
  }
});
