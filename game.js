/**
 * Jungle animal chess (鬥獸棋). Classic rules, original UI — not a commercial clone.
 */

export const COLS = 7;
export const ROWS = 9;
export const W = 480;
export const H = 640;

/** 8 strongest … 1 weakest */
export const RANK = {
  elephant: 8,
  lion: 7,
  tiger: 6,
  leopard: 5,
  wolf: 4,
  dog: 3,
  cat: 2,
  rat: 1,
};

export const LABEL = {
  elephant: "象",
  lion: "獅",
  tiger: "虎",
  leopard: "豹",
  wolf: "狼",
  dog: "狗",
  cat: "貓",
  rat: "鼠",
};

/**
 * @typedef {'player'|'ai'} Side
 * @typedef {keyof typeof RANK} Kind
 * @typedef {{ side: Side, kind: Kind }} Piece
 * @typedef {'land'|'water'|'trap'|'den'} Terrain
 */

/** @type {Terrain[][]} row-major from top (AI side) to bottom (player) */
export const TERRAIN = (() => {
  /** @type {Terrain[][]} */
  const t = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => /** @type {Terrain} */ ("land")),
  );
  // Dens
  t[0][3] = "den"; // AI den
  t[8][3] = "den"; // player den
  // Traps
  for (const [r, c] of [
    [0, 2],
    [0, 4],
    [1, 3],
    [8, 2],
    [8, 4],
    [7, 3],
  ]) {
    t[r][c] = "trap";
  }
  // Water (two lakes)
  for (const r of [3, 4, 5]) {
    for (const c of [1, 2]) t[r][c] = "water";
    for (const c of [4, 5]) t[r][c] = "water";
  }
  return t;
})();

function initialBoard() {
  /** @type {(Piece|null)[]} */
  const b = Array(ROWS * COLS).fill(null);
  /** @param {number} r @param {number} c @param {Side} side @param {Kind} kind */
  const put = (r, c, side, kind) => {
    b[r * COLS + c] = { side, kind };
  };
  // AI (top)
  put(0, 0, "ai", "lion");
  put(0, 6, "ai", "tiger");
  put(1, 1, "ai", "dog");
  put(1, 5, "ai", "cat");
  put(2, 0, "ai", "rat");
  put(2, 2, "ai", "leopard");
  put(2, 4, "ai", "wolf");
  put(2, 6, "ai", "elephant");
  // Player (bottom)
  put(8, 6, "player", "lion");
  put(8, 0, "player", "tiger");
  put(7, 5, "player", "dog");
  put(7, 1, "player", "cat");
  put(6, 6, "player", "rat");
  put(6, 4, "player", "leopard");
  put(6, 2, "player", "wolf");
  put(6, 0, "player", "elephant");
  return b;
}

/**
 * @param {Kind} a
 * @param {Kind} b
 * @param {boolean} defenderInTrap
 */
export function canCapture(a, b, defenderInTrap) {
  if (defenderInTrap) return true;
  if (a === "rat" && b === "elephant") return true;
  if (a === "elephant" && b === "rat") return false;
  return RANK[a] >= RANK[b];
}

export class JungleGame {
  constructor() {
    this.resetAll();
  }

  resetAll() {
    this.board = initialBoard();
    this.turn = /** @type {Side} */ ("player");
    this.status = "playing"; // playing | win | lose
    /** @type {{r:number,c:number}|null} */
    this.selected = null;
    this.message = "點己方獸棋，再點目標格";
    this.aiThinking = false;
  }

  idx(r, c) {
    return r * COLS + c;
  }

  at(r, c) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return null;
    return this.board[this.idx(r, c)];
  }

  setAt(r, c, p) {
    this.board[this.idx(r, c)] = p;
  }

  terrain(r, c) {
    return TERRAIN[r][c];
  }

  isPlayerTurn() {
    return this.status === "playing" && this.turn === "player" && !this.aiThinking;
  }

  /**
   * @param {number} r
   * @param {number} c
   * @returns {{ events: string[], ok: boolean }}
   */
  click(r, c) {
    /** @type {string[]} */
    const events = [];
    if (!this.isPlayerTurn()) return { events, ok: false };
    const piece = this.at(r, c);

    if (piece && piece.side === "player") {
      if (this.selected && this.selected.r === r && this.selected.c === c) {
        this.selected = null;
        return { events, ok: true };
      }
      this.selected = { r, c };
      events.push("select");
      return { events, ok: true };
    }

    if (this.selected) {
      const from = this.selected;
      if (this.tryMove(from.r, from.c, r, c, "player", events)) {
        this.selected = null;
        this.turn = "ai";
        this.checkEnd(events);
        return { events, ok: true };
      }
      this.selected = null;
      events.push("deny");
      return { events, ok: false };
    }
    return { events, ok: false };
  }

  /**
   * @param {number} r0
   * @param {number} c0
   * @param {number} r1
   * @param {number} c1
   * @param {Side} side
   * @param {string[]} events
   */
  tryMove(r0, c0, r1, c1, side, events) {
    const mover = this.at(r0, c0);
    if (!mover || mover.side !== side) return false;
    if (!this.isLegalMove(r0, c0, r1, c1, side)) return false;

    const target = this.at(r1, c1);
    this.setAt(r1, c1, mover);
    this.setAt(r0, c0, null);

    if (target) {
      this.message = `${LABEL[mover.kind]} 吃 ${LABEL[target.kind]}`;
      events.push("capture");
    } else {
      this.message = `${LABEL[mover.kind]} 移動`;
      events.push("move");
    }

    // Enter opponent den
    const den = this.terrain(r1, c1);
    if (den === "den") {
      const enemyDen = side === "player" ? r1 === 0 : r1 === 8;
      if (enemyDen && c1 === 3) {
        this.status = side === "player" ? "win" : "lose";
        this.message =
          side === "player" ? "攻入獸穴，你贏了！" : "對方攻入獸穴";
        events.push(side === "player" ? "win" : "lose");
      }
    }
    return true;
  }

  /**
   * @param {number} r0
   * @param {number} c0
   * @param {number} r1
   * @param {number} c1
   * @param {Side} side
   */
  isLegalMove(r0, c0, r1, c1, side) {
    const mover = this.at(r0, c0);
    if (!mover) return false;
    // Cannot enter own den
    if (this.terrain(r1, c1) === "den") {
      const ownDen = side === "player" ? r1 === 8 : r1 === 0;
      if (ownDen && c1 === 3) return false;
    }

    const dr = Math.abs(r1 - r0);
    const dc = Math.abs(c1 - c0);
    const target = this.at(r1, c1);
    if (target && target.side === side) return false;

    // Lion/Tiger jump over water
    if (
      (mover.kind === "lion" || mover.kind === "tiger") &&
      this.isRiverJump(r0, c0, r1, c1, mover.kind)
    ) {
      if (target) {
        const trap = this.terrain(r1, c1) === "trap" && this.trapOwner(r1, c1) !== target.side;
        // trap owned by side means enemy is weakened when on our trap
        const defenderInTrap =
          this.terrain(r1, c1) === "trap" && this.trapOwner(r1, c1) === side;
        return canCapture(mover.kind, target.kind, defenderInTrap);
      }
      return true;
    }

    if (dr + dc !== 1) return false;

    const destTerrain = this.terrain(r1, c1);
    if (destTerrain === "water" && mover.kind !== "rat") return false;
    // Rat leaving/entering water: elephant cannot be captured from water? 
    // Standard: rat in water cannot capture elephant on land and vice versa
    if (target) {
      const fromWater = this.terrain(r0, c0) === "water";
      const toWater = destTerrain === "water";
      if (mover.kind === "rat" && target.kind === "elephant" && (fromWater || toWater)) {
        return false;
      }
      if (mover.kind === "elephant" && target.kind === "rat" && (fromWater || toWater)) {
        return false;
      }
      const defenderInTrap =
        destTerrain === "trap" && this.trapOwner(r1, c1) === side;
      return canCapture(mover.kind, target.kind, defenderInTrap);
    }
    return true;
  }

  /** Trap cells belong to the nearby den owner */
  trapOwner(r, c) {
    if (r <= 1) return /** @type {Side} */ ("ai");
    if (r >= 7) return /** @type {Side} */ ("player");
    return /** @type {Side} */ ("player");
  }

  /**
   * @param {number} r0
   * @param {number} c0
   * @param {number} r1
   * @param {number} c1
   * @param {Kind} kind
   */
  isRiverJump(r0, c0, r1, c1, kind) {
    if (kind !== "lion" && kind !== "tiger") return false;
    // Vertical jump across water
    if (c0 === c1 && c0 !== 3) {
      const minR = Math.min(r0, r1);
      const maxR = Math.max(r0, r1);
      if (maxR - minR !== 4) return false; // land-water-water-water-land
      // Check water cells clear of rat
      for (let r = minR + 1; r < maxR; r++) {
        if (this.terrain(r, c0) !== "water") return false;
        const p = this.at(r, c0);
        if (p && p.kind === "rat") return false;
      }
      return this.terrain(r0, c0) !== "water" && this.terrain(r1, c1) !== "water";
    }
    // Horizontal jump
    if (r0 === r1 && (r0 === 3 || r0 === 4 || r0 === 5)) {
      const minC = Math.min(c0, c1);
      const maxC = Math.max(c0, c1);
      if (maxC - minC !== 3) return false; // e.g. 0->3 or 3->6 spanning lake
      for (let c = minC + 1; c < maxC; c++) {
        if (this.terrain(r0, c) !== "water") return false;
        const p = this.at(r0, c);
        if (p && p.kind === "rat") return false;
      }
      return this.terrain(r0, c0) !== "water" && this.terrain(r1, c1) !== "water";
    }
    return false;
  }

  /** @param {Side} side */
  listMoves(side) {
    /** @type {{r:number,c:number,r2:number,c2:number,score:number}[]} */
    const moves = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const p = this.at(r, c);
        if (!p || p.side !== side) continue;
        for (let r2 = 0; r2 < ROWS; r2++) {
          for (let c2 = 0; c2 < COLS; c2++) {
            if (!this.isLegalMove(r, c, r2, c2, side)) continue;
            const t = this.at(r2, c2);
            let score = 1;
            if (t) score = 20 + RANK[t.kind];
            if (this.terrain(r2, c2) === "den") score = 1000;
            // Approach enemy den
            if (side === "ai" && r2 > r) score += 0.5;
            if (side === "player" && r2 < r) score += 0.5;
            moves.push({ r, c, r2, c2, score });
          }
        }
      }
    }
    return moves;
  }

  aiMove() {
    /** @type {string[]} */
    const events = [];
    if (this.status !== "playing" || this.turn !== "ai") return { events };
    const moves = this.listMoves("ai").sort((a, b) => b.score - a.score);
    if (!moves.length) {
      this.status = "win";
      this.message = "對方無棋可走，你贏了";
      events.push("win");
      return { events };
    }
    // Pick among top few
    const top = moves.filter((m) => m.score >= moves[0].score - 2);
    const m = top[Math.floor(Math.random() * Math.min(3, top.length))];
    this.tryMove(m.r, m.c, m.r2, m.c2, "ai", events);
    if (this.status === "playing") {
      this.turn = "player";
      if (!events.includes("capture")) this.message = "輪到你了";
      else this.message = `電腦 ${this.message}`;
    }
    this.checkEnd(events);
    return { events };
  }

  /** @param {string[]} events */
  checkEnd(events) {
    if (this.status !== "playing") return;
    const count = (side) =>
      this.board.filter((p) => p && p.side === side).length;
    if (count("ai") === 0) {
      this.status = "win";
      this.message = "消滅對方，你贏了！";
      events.push("win");
    } else if (count("player") === 0) {
      this.status = "lose";
      this.message = "獸棋被吃光了";
      events.push("lose");
    }
  }

  highlights() {
    /** @type {{r:number,c:number}[]} */
    const out = [];
    if (!this.selected) return out;
    const { r, c } = this.selected;
    for (const m of this.listMoves("player")) {
      if (m.r === r && m.c === c) out.push({ r: m.r2, c: m.c2 });
    }
    return out;
  }
}
