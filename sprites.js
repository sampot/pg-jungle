/**
 * Board + animal tokens for 鬥獸棋.
 */

import { COLS, ROWS, LABEL, TERRAIN } from "./game.js";

export const PAD = 16;
export const TOP = 88;

export function cellMetrics(W, H = 640) {
  const maxW = W - PAD * 2;
  const maxH = H - TOP - 100; // leave room for legend
  const cell = Math.min(maxW / COLS, maxH / ROWS);
  const boardW = cell * COLS;
  const boardH = cell * ROWS;
  const ox = (W - boardW) / 2;
  return { boardW, boardH, cell, ox, oy: TOP };
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W
 * @param {number} H
 */
export function drawBackdrop(ctx, W, H) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#14532d");
  g.addColorStop(0.5, "#166534");
  g.addColorStop(1, "#052e16");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "#b45309";
  ctx.lineWidth = 8;
  roundRect(ctx, 8, 8, W - 16, H - 16, 14);
  ctx.stroke();
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 14, 14, W - 28, H - 28, 10);
  ctx.stroke();

  ctx.fillStyle = "#fef3c7";
  ctx.font = "700 18px 'Songti TC', serif";
  ctx.textAlign = "center";
  ctx.fillText("鬥獸棋", W / 2, 44);
  ctx.font = "600 11px system-ui, sans-serif";
  ctx.fillStyle = "rgba(254,243,199,0.7)";
  ctx.fillText("獸穴 · 陷阱 · 河界跳躍", W / 2, 66);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W
 * @param {(import('./game.js').Piece|null)[]} board
 * @param {{r:number,c:number}|null} selected
 * @param {{r:number,c:number}[]} highlights
 */
export function drawBoard(ctx, W, board, selected, highlights) {
  const { cell, ox, oy, boardW, boardH } = cellMetrics(W);

  ctx.fillStyle = "#365314";
  roundRect(ctx, ox - 4, oy - 4, boardW + 8, boardH + 8, 8);
  ctx.fill();

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = ox + c * cell;
      const y = oy + r * cell;
      const ter = TERRAIN[r][c];
      if (ter === "water") {
        const water = ctx.createLinearGradient(x, y, x, y + cell);
        water.addColorStop(0, "#38bdf8");
        water.addColorStop(1, "#0284c7");
        ctx.fillStyle = water;
      } else if (ter === "den") {
        ctx.fillStyle = "#44403c";
      } else if (ter === "trap") {
        ctx.fillStyle = "#a16207";
      } else {
        ctx.fillStyle = (r + c) % 2 === 0 ? "#4d7c0f" : "#3f6212";
      }
      ctx.fillRect(x, y, cell, cell);

      if (ter === "den") {
        ctx.fillStyle = "rgba(251,191,36,0.85)";
        ctx.font = `700 ${Math.floor(cell * 0.28)}px 'Songti TC', serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("穴", x + cell / 2, y + cell / 2);
      } else if (ter === "trap") {
        ctx.strokeStyle = "rgba(254,243,199,0.45)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 6, y + 6, cell - 12, cell - 12);
        ctx.fillStyle = "rgba(254,243,199,0.55)";
        ctx.font = `600 ${Math.floor(cell * 0.22)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("阱", x + cell / 2, y + cell / 2);
      } else if (ter === "water") {
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.beginPath();
        ctx.moveTo(x + 4, y + cell * 0.35);
        ctx.quadraticCurveTo(x + cell / 2, y + cell * 0.2, x + cell - 4, y + cell * 0.35);
        ctx.stroke();
      }
    }
  }

  for (const h of highlights) {
    const x = ox + h.c * cell + cell / 2;
    const y = oy + h.r * cell + cell / 2;
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, y, cell * 0.36, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (selected) {
    const x = ox + selected.c * cell + cell / 2;
    const y = oy + selected.r * cell + cell / 2;
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, cell * 0.4, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r * COLS + c];
      if (!p) continue;
      drawAnimal(
        ctx,
        ox + c * cell + cell / 2,
        oy + r * cell + cell / 2,
        cell * 0.4,
        p,
      );
    }
  }
}

const KIND_COLOR = {
  elephant: "#a8a29e",
  lion: "#f59e0b",
  tiger: "#fb923c",
  leopard: "#fbbf24",
  wolf: "#94a3b8",
  dog: "#d6d3d1",
  cat: "#fcd34d",
  rat: "#e7e5e4",
};

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} rad
 * @param {import('./game.js').Piece} p
 */
export function drawAnimal(ctx, x, y, rad, p) {
  const mine = p.side === "player";
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(x + 1, y + 2, rad * 0.95, rad * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  const base = KIND_COLOR[p.kind];
  const face = ctx.createRadialGradient(x - rad * 0.3, y - rad * 0.3, 2, x, y, rad);
  if (mine) {
    face.addColorStop(0, "#fecaca");
    face.addColorStop(0.5, "#ef4444");
    face.addColorStop(1, "#991b1b");
  } else {
    face.addColorStop(0, "#e5e5e5");
    face.addColorStop(0.5, "#525252");
    face.addColorStop(1, "#171717");
  }
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(x, y, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = mine ? "#fef08a" : "#d4d4d8";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Tiny animal accent disc
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(x, y - rad * 0.15, rad * 0.42, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(x - rad * 0.14, y - rad * 0.2, rad * 0.08, 0, Math.PI * 2);
  ctx.arc(x + rad * 0.14, y - rad * 0.2, rad * 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = mine ? "#fff7ed" : "#fafafa";
  ctx.font = `700 ${Math.floor(rad * 0.85)}px 'Songti TC', serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(LABEL[p.kind], x, y + rad * 0.28);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W
 * @param {number} H
 * @param {import('./game.js').JungleGame} game
 */
export function drawLegend(ctx, W, H, game) {
  const { boardH, oy } = cellMetrics(W);
  const y0 = oy + boardH + 12;
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  roundRect(ctx, 20, y0, W - 40, 72, 10);
  ctx.fill();
  ctx.fillStyle = "#fef3c7";
  ctx.font = "600 12px system-ui, sans-serif";
  ctx.textAlign = "left";
  const turn =
    game.status === "win"
      ? "你贏了"
      : game.status === "lose"
        ? "你輸了"
        : game.turn === "player"
          ? "輪到你"
          : "電腦思考中…";
  ctx.fillText(turn, 36, y0 + 28);
  const pc = game.board.filter((p) => p && p.side === "player").length;
  const ac = game.board.filter((p) => p && p.side === "ai").length;
  ctx.fillText(`剩餘  你 ${pc} · 電腦 ${ac}`, 36, y0 + 52);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
