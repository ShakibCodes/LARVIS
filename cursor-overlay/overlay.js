/* eslint-disable @typescript-eslint/no-require-imports */
const { ipcRenderer } = require("electron");

const cursor = document.getElementById("secondary-cursor");

let targetX = window.innerWidth / 2;
let targetY = window.innerHeight / 2;
let currentX = targetX;
let currentY = targetY;

const sideOffsetX = 42;
const sideOffsetY = 28;

ipcRenderer.on("cursor:position", (_event, payload) => {
  targetX = payload.x;
  targetY = payload.y;
});

function animate() {
  currentX += (targetX - currentX) * 0.13;
  currentY += (targetY - currentY) * 0.13;

  cursor.style.transform = `translate3d(${currentX + sideOffsetX}px, ${currentY + sideOffsetY}px, 0)`;
  window.requestAnimationFrame(animate);
}

window.requestAnimationFrame(animate);
