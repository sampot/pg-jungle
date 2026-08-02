import { JungleAudio } from "./audio.js";
import { JungleGame, W, H, COLS, ROWS } from "./game.js";
import { cellMetrics, drawBackdrop, drawBoard, drawLegend } from "./sprites.js";

const audio = new JungleAudio();
const game = new JungleGame();
globalThis.__jungle = game;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const remainEl = document.getElementById("remain");
const btnMute = document.getElementById("btn-mute");
const btnReset = document.getElementById("btn-reset");

canvas.width = W;
canvas.height = H;

/** @type {ReturnType<typeof setTimeout> | null} */
let aiTimer = null;
let running = true;

function setStatus(msg, tone = "") {
  statusEl.textContent = msg;
  statusEl.dataset.tone = tone;
}

function syncHud() {
  const pc = game.board.filter((p) => p && p.side === "player").length;
  const ac = game.board.filter((p) => p && p.side === "ai").length;
  remainEl.textContent = `${pc}/${ac}`;
  setStatus(
    game.message,
    game.status === "win" ? "win" : game.status === "lose" ? "lose" : "",
  );
}

function draw() {
  drawBackdrop(ctx, W, H);
  drawBoard(ctx, W, game.board, game.selected, game.highlights());
  drawLegend(ctx, W, H, game);
}

function handleEvents(events) {
  for (const e of events) {
    if (e === "select") audio.select();
    else if (e === "move") audio.move();
    else if (e === "capture") audio.capture();
    else if (e === "deny") audio.deny();
    else if (e === "win") audio.win();
    else if (e === "lose") audio.lose();
  }
}

function scheduleAi() {
  if (aiTimer) clearTimeout(aiTimer);
  if (game.status !== "playing" || game.turn !== "ai") return;
  game.aiThinking = true;
  syncHud();
  draw();
  aiTimer = setTimeout(() => {
    const { events } = game.aiMove();
    game.aiThinking = false;
    handleEvents(events);
    syncHud();
    draw();
  }, 380 + Math.random() * 260);
}

function pointerToCell(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * W;
  const y = ((clientY - rect.top) / rect.height) * H;
  const { cell, ox, oy, boardW, boardH } = cellMetrics(W);
  if (x < ox || y < oy || x >= ox + boardW || y >= oy + boardH) return null;
  const c = Math.floor((x - ox) / cell);
  const r = Math.floor((y - oy) / cell);
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
  return { r, c };
}

canvas.addEventListener("pointerdown", async (e) => {
  await audio.unlock();
  if (!game.isPlayerTurn()) return;
  const cell = pointerToCell(e.clientX, e.clientY);
  if (!cell) return;
  const { events, ok } = game.click(cell.r, cell.c);
  handleEvents(events);
  syncHud();
  draw();
  if (ok && game.turn === "ai" && game.status === "playing") scheduleAi();
});

btnReset.addEventListener("click", async () => {
  await audio.unlock();
  if (aiTimer) clearTimeout(aiTimer);
  game.aiThinking = false;
  game.resetAll();
  syncHud();
  draw();
});

btnMute.addEventListener("click", async () => {
  await audio.unlock();
  audio.setEnabled(!audio.enabled);
  btnMute.textContent = audio.enabled ? "音效開" : "音效關";
  btnMute.setAttribute("aria-pressed", audio.enabled ? "true" : "false");
});

document.body.addEventListener(
  "pointerdown",
  () => {
    void audio.unlock();
  },
  { once: true },
);

function frame() {
  if (!running) return;
  draw();
  requestAnimationFrame(frame);
}

syncHud();
requestAnimationFrame(frame);
