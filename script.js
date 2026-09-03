(function () {
  "use strict";

  // ---------- Config ----------
  const COLORS = ["green", "blue", "orange", "purple"];
  const FLIP_MAP = { green: "purple", purple: "green", orange: "blue", blue: "orange" };
  const SIDE_LABEL = { top: "Top", bottom: "Bottom", left: "Left", right: "Right" };

  // Which sides get a seated player, in turn order, for a given player count.
  const SIDES_BY_COUNT = {
    1: ["bottom"],
    2: ["bottom", "top"],
    3: ["bottom", "right", "top"],
    4: ["bottom", "right", "top", "left"],
  };

  // top/bottom docks act on columns; left/right docks act on rows.
  const DOCK_ORIENTATION = { top: "col", bottom: "col", left: "row", right: "row" };

  // Direction (+1 / -1) a line shifts for a given side + action.
  // +1 means index increases (down for rows-as-columns / right for columns-as-rows... see shiftLine).
  const DIRECTION = {
    top: { push: 1, pull: -1 },
    bottom: { push: -1, pull: 1 },
    left: { push: 1, pull: -1 },
    right: { push: -1, pull: 1 },
  };

  const ARROW = {
    top: { push: "↓", pull: "↑" },
    bottom: { push: "↑", pull: "↓" },
    left: { push: "→", pull: "←" },
    right: { push: "←", pull: "→" },
  };

  let tileIdCounter = 0;
  function newTile(color) {
    tileIdCounter += 1;
    return { id: tileIdCounter, color };
  }

  // ---------- State ----------
  let state = null;
  let history = [];

  function freshState(playerCount) {
    const sides = SIDES_BY_COUNT[playerCount];
    return {
      playerCount,
      sides,
      grid: makeShuffledGrid(),
      phase: "player", // "player" | "monster"
      currentPlayerIndex: 0,
      actionTaken: false,
      flipArmed: false,
    };
  }

  function makeShuffledGrid() {
    let pool = [];
    COLORS.forEach((c) => {
      for (let i = 0; i < 4; i++) pool.push(newTile(c));
    });
    // Fisher-Yates
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const grid = [];
    for (let r = 0; r < 4; r++) {
      grid.push(pool.slice(r * 4, r * 4 + 4));
    }
    return grid;
  }

  function cloneState(s) {
    return {
      playerCount: s.playerCount,
      sides: s.sides.slice(),
      grid: s.grid.map((row) => row.map((t) => ({ id: t.id, color: t.color }))),
      phase: s.phase,
      currentPlayerIndex: s.currentPlayerIndex,
      actionTaken: s.actionTaken,
      flipArmed: s.flipArmed,
    };
  }

  function pushHistory() {
    history.push(cloneState(state));
  }

  function undo() {
    if (history.length === 0) return;
    state = history.pop();
    renderAll();
  }

  // ---------- Line mechanics ----------
  function getLine(orientation, index) {
    if (orientation === "col") {
      return [0, 1, 2, 3].map((r) => state.grid[r][index]);
    }
    return [0, 1, 2, 3].map((c) => state.grid[index][c]);
  }

  function setLine(orientation, index, line) {
    if (orientation === "col") {
      for (let r = 0; r < 4; r++) state.grid[r][index] = line[r];
    } else {
      for (let c = 0; c < 4; c++) state.grid[index][c] = line[c];
    }
  }

  function shiftLine(line, direction) {
    if (direction === 1) {
      const exiting = line[3];
      return [newTile(exiting.color), line[0], line[1], line[2]];
    }
    const exiting = line[0];
    return [line[1], line[2], line[3], newTile(exiting.color)];
  }

  function performLineAction(side, lineIndex, action) {
    pushHistory();
    const orientation = DOCK_ORIENTATION[side];
    const direction = DIRECTION[side][action];
    const line = getLine(orientation, lineIndex);
    setLine(orientation, lineIndex, shiftLine(line, direction));
    if (state.phase === "player") {
      state.actionTaken = true;
    }
    state.flipArmed = false;
    renderAll();
  }

  function performFlip(r, c) {
    pushHistory();
    const tile = state.grid[r][c];
    tile.color = FLIP_MAP[tile.color];
    if (state.phase === "player") {
      state.actionTaken = true;
    }
    state.flipArmed = false;
    renderAll();
  }

  function endTurn() {
    pushHistory();
    state.currentPlayerIndex += 1;
    if (state.currentPlayerIndex >= state.sides.length) {
      state.phase = "monster";
      state.currentPlayerIndex = 0;
    }
    state.actionTaken = false;
    state.flipArmed = false;
    renderAll();
  }

  function endMonsterTurn() {
    pushHistory();
    state.phase = "player";
    state.currentPlayerIndex = 0;
    state.actionTaken = false;
    state.flipArmed = false;
    renderAll();
  }

  function toggleFlipArmed() {
    state.flipArmed = !state.flipArmed;
    renderAll();
  }

  // ---------- Rendering ----------
  const el = {};
  function cacheEls() {
    el.setupScreen = document.getElementById("setup-screen");
    el.gameScreen = document.getElementById("game-screen");
    el.countButtons = document.getElementById("player-count-buttons");
    el.startBtn = document.getElementById("start-btn");
    el.turnIndicator = document.getElementById("turn-indicator");
    el.turnSubtext = document.getElementById("turn-subtext");
    el.undoBtn = document.getElementById("undo-btn");
    el.newGameBtn = document.getElementById("new-game-btn");
    el.grid = document.getElementById("grid");
    el.docks = {
      top: document.getElementById("dock-top"),
      bottom: document.getElementById("dock-bottom"),
      left: document.getElementById("dock-left"),
      right: document.getElementById("dock-right"),
    };
    el.flipToggleBtn = document.getElementById("flip-toggle-btn");
    el.endTurnBtn = document.getElementById("end-turn-btn");
    el.endMonsterBtn = document.getElementById("end-monster-btn");
    el.flipHint = document.getElementById("flip-hint");
  }

  let selectedCount = 1;

  function renderSetup() {
    el.countButtons.innerHTML = "";
    [1, 2, 3, 4].forEach((n) => {
      const btn = document.createElement("button");
      btn.className = "count-btn" + (n === selectedCount ? " selected" : "");
      btn.textContent = n;
      btn.addEventListener("click", () => {
        selectedCount = n;
        renderSetup();
      });
      el.countButtons.appendChild(btn);
    });
  }

  function activeSideForPlayerPhase() {
    return state.sides[state.currentPlayerIndex];
  }

  function isDockActive(side) {
    if (state.phase === "monster") return true;
    return side === activeSideForPlayerPhase();
  }

  function lineControlsLocked() {
    // During a player's turn, once an action is taken, lines lock until End Turn.
    return state.phase === "player" && state.actionTaken;
  }

  function renderDock(side) {
    const container = el.docks[side];
    container.innerHTML = "";
    const active = isDockActive(side);
    const locked = lineControlsLocked();
    for (let i = 0; i < 4; i++) {
      const wrap = document.createElement("div");
      wrap.className = "line-control" + (active ? " active" : "");

      const pushBtn = document.createElement("button");
      pushBtn.className = "line-btn";
      pushBtn.textContent = ARROW[side].push;
      pushBtn.title = `Push ${DOCK_ORIENTATION[side] === "col" ? "column" : "row"} ${i + 1}`;
      pushBtn.disabled = !active || locked || state.flipArmed;
      pushBtn.addEventListener("click", () => performLineAction(side, i, "push"));

      const pullBtn = document.createElement("button");
      pullBtn.className = "line-btn";
      pullBtn.textContent = ARROW[side].pull;
      pullBtn.title = `Pull ${DOCK_ORIENTATION[side] === "col" ? "column" : "row"} ${i + 1}`;
      pullBtn.disabled = !active || locked || state.flipArmed;
      pullBtn.addEventListener("click", () => performLineAction(side, i, "pull"));

      wrap.appendChild(pushBtn);
      wrap.appendChild(pullBtn);
      container.appendChild(wrap);
    }
  }

  function renderGrid() {
    el.grid.innerHTML = "";
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const tile = state.grid[r][c];
        const div = document.createElement("div");
        div.className = "tile " + tile.color + (state.flipArmed ? " flip-armed" : "");
        if (state.flipArmed) {
          div.addEventListener("click", () => performFlip(r, c));
        }
        el.grid.appendChild(div);
      }
    }
  }

  function renderStatus() {
    if (state.phase === "player") {
      const side = activeSideForPlayerPhase();
      const playerNumber = state.currentPlayerIndex + 1;
      el.turnIndicator.textContent = `Player ${playerNumber}'s Turn`;
      const orientation = DOCK_ORIENTATION[side];
      const noun = orientation === "col" ? "column" : "row";
      if (state.actionTaken) {
        el.turnSubtext.textContent = `${SIDE_LABEL[side]} side — action taken. End your turn when ready.`;
      } else {
        el.turnSubtext.textContent = `${SIDE_LABEL[side]} side — push or pull a ${noun}, or flip a tile.`;
      }
    } else {
      el.turnIndicator.textContent = "Monster Turn";
      el.turnSubtext.textContent = "Any row or column may be pushed or pulled. End the turn when done.";
    }

    el.endTurnBtn.hidden = state.phase !== "player";
    el.endMonsterBtn.hidden = state.phase !== "monster";
    if (state.phase === "player") {
      el.endTurnBtn.disabled = !state.actionTaken;
    }

    el.flipToggleBtn.disabled = state.phase === "player" && state.actionTaken;
    el.flipToggleBtn.classList.toggle("armed", state.flipArmed);
    el.flipHint.hidden = !state.flipArmed;

    el.undoBtn.disabled = history.length === 0;
  }

  function renderAll() {
    renderGrid();
    Object.keys(el.docks).forEach(renderDock);
    renderStatus();
  }

  // ---------- Screen switching ----------
  function showSetup() {
    el.setupScreen.hidden = false;
    el.gameScreen.hidden = true;
  }

  function showGame() {
    el.setupScreen.hidden = true;
    el.gameScreen.hidden = false;
  }

  function startGame() {
    state = freshState(selectedCount);
    history = [];
    showGame();
    renderAll();
  }

  function newGame() {
    state = null;
    history = [];
    showSetup();
  }

  // ---------- Wire up ----------
  function init() {
    cacheEls();
    renderSetup();

    el.startBtn.addEventListener("click", startGame);
    el.newGameBtn.addEventListener("click", newGame);
    el.undoBtn.addEventListener("click", undo);
    el.flipToggleBtn.addEventListener("click", toggleFlipArmed);
    el.endTurnBtn.addEventListener("click", endTurn);
    el.endMonsterBtn.addEventListener("click", endMonsterTurn);

    showSetup();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
