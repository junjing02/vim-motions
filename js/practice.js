// practice.js - Vim Motions Practice Drill (extracted engine, reused by the Neovim tab's "Practice Motions" mode)
// Only responds to keystrokes while isPracticeActive is true.
let isPracticeActive = false;

// How many times a challenge must be solved (each with a fresh/randomized scenario when
// available) before Next unlocks. Individual challenges can override via `requiredReps`.
const DEFAULT_REQUIRED_REPS = 3;
const REP_SWITCH_DELAY_MS = 600; // brief pause so the success flash is visible before the scenario changes

function getRequiredReps(challenge) {
  return challenge.requiredReps || DEFAULT_REQUIRED_REPS;
}

// Game State
let practiceState = {
  currentLevelIdx: 0,
  currentChallengeIdx: 0,
  score: 0,
  levelKeystrokes: 0,
  totalKeystrokes: 0,
  accuracy: 100,
  efficiency: 100,
  cursor: { line: 0, col: 0 },
  mode: "normal",        // "normal", "insert", "visual", "visual-line", "search"
  buffer: [],            // Array of lines representing the active text
  pendingKeys: "",       // Buffer for multi-key commands like 'df', 'ciw', 'gg'
  digitBuffer: "",       // Buffer for relative count multiplier, e.g. '3', '10'
  searchCommand: { type: "", char: "" }, // For repeat inline search (';' and ',')
  searchQuery: "",       // For active regex/substring search (via '/' or '?')
  searchDirection: "/",  // "/" (forward) or "?" (backward)
  lastSearch: { query: "", direction: "/" }, // For repeat search ('n' and 'N')
  visualAnchor: { line: 0, col: 0 }, // Visual selection start point
  clipboard: { type: "char", content: "" }, // Copy buffer for y, p, P
  levelTimer: null,
  levelStartTime: null,
  relativeLines: true,   // Toggle relative line numbers
  solvedChallenges: new Set(), // Keys "levelIdx:challengeIdx" — persists across Next/Previous navigation
  lastChallengeScore: 0,
  repsCompleted: 0,       // Successful reps on the current (not-yet-unlocked) challenge
  currentInstance: null,  // The active scenario: { text, start, target } or { text, start, targetText }
  repTransitioning: false, // True during the brief pause between a solved rep and the next scenario loading
};

function challengeKey(levelIdx, challengeIdx) {
  return `${levelIdx}:${challengeIdx}`;
}

function isChallengeSolved(levelIdx, challengeIdx) {
  return practiceState.solvedChallenges.has(challengeKey(levelIdx, challengeIdx));
}

function isLevelCompleted(levelIdx) {
  return VIM_LEVELS[levelIdx].challenges.every((_, i) => isChallengeSolved(levelIdx, i));
}

// Initialize Practice Mode
window.addEventListener("DOMContentLoaded", () => {
  loadLevel(0, 0);
  setupPracticeEventListeners();
  updateSidebar();
});

// Setup DOM Event Listeners
function setupPracticeEventListeners() {
  document.body.addEventListener("keydown", handleGlobalKeyDown);

  document.getElementById("level-select-btn").addEventListener("click", () => {
    document.getElementById("level-modal").style.display = "flex";
  });

  document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("level-modal").style.display = "none";
  });

  document.getElementById("rel-lines-toggle").addEventListener("change", (e) => {
    practiceState.relativeLines = e.target.checked;
    renderEditor();
  });

  document.getElementById("hint-btn").addEventListener("click", () => {
    const challenge = getActiveChallenge();
    const hintText = document.getElementById("hint-text");
    hintText.innerHTML = `Hint: <span class="key-sequence">${challenge.hint}</span>`;
    hintText.style.opacity = 1;
    setTimeout(() => {
      hintText.style.opacity = 0;
    }, 6000);
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    if (confirm("Are you sure you want to reset all game progress?")) {
      practiceState.solvedChallenges.clear();
      practiceState.score = 0;
      updateSidebar();
      loadLevel(0, 0);
    }
  });

  document.getElementById("prev-challenge-btn").addEventListener("click", goToPreviousChallenge);
  document.getElementById("next-challenge-btn").addEventListener("click", goToNextChallenge);

  window.addEventListener("click", (e) => {
    const modal = document.getElementById("level-modal");
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
}

function getActiveLevel() {
  return VIM_LEVELS[practiceState.currentLevelIdx];
}

function getActiveChallenge() {
  return getActiveLevel().challenges[practiceState.currentChallengeIdx];
}

// Builds candidate {line, col} targets from every non-whitespace character in `text`,
// excluding the challenge's own starting cursor position. Lets navigate-type challenges
// get a fresh, randomized target each rep with zero extra content authoring.
function getNavigateTargetCandidates(text, startLine, startCol) {
  const lines = text.split("\n");
  const candidates = [];
  lines.forEach((lineText, lineIdx) => {
    for (let col = 0; col < lineText.length; col++) {
      if (lineIdx === startLine && col === startCol) continue;
      if (/\S/.test(lineText[col])) candidates.push({ line: lineIdx, col });
    }
  });
  return candidates;
}

// Picks a random element from arr, avoiding one matched by isSame() when the pool has
// other options. Bounded retry guards against a bad isSame() ever spinning forever.
function pickRandomExcluding(arr, isSame) {
  if (arr.length === 0) return null;
  if (arr.length === 1) return arr[0];
  let pick = arr[Math.floor(Math.random() * arr.length)];
  if (!isSame) return pick;
  for (let guard = 0; guard < 20 && isSame(pick); guard++) {
    pick = arr[Math.floor(Math.random() * arr.length)];
  }
  return pick;
}

// Picks the next scenario instance for the active challenge: a random target (navigate)
// or a random text/targetText variant (edit, when the challenge defines `variants`).
// Falls back to the challenge's own base scenario when there's nothing to vary.
function pickChallengeInstance(challenge, avoidInstance) {
  if (challenge.type === "navigate") {
    const candidates = getNavigateTargetCandidates(challenge.text, challenge.start.line, challenge.start.col);
    const avoidTarget = avoidInstance && avoidInstance.target;
    const target = candidates.length > 0
      ? pickRandomExcluding(candidates, avoidTarget ? (c => c.line === avoidTarget.line && c.col === avoidTarget.col) : null)
      : challenge.target;
    return { text: challenge.text, start: challenge.start, target };
  }

  if (challenge.type === "edit" && challenge.variants && challenge.variants.length > 0) {
    const pool = [{ text: challenge.text, start: challenge.start, targetText: challenge.targetText }, ...challenge.variants];
    const avoidText = avoidInstance && avoidInstance.targetText;
    return pickRandomExcluding(pool, avoidText ? (v => v.targetText === avoidText) : null);
  }

  return { text: challenge.text, start: challenge.start, targetText: challenge.targetText };
}

// Loads a fresh scenario for the current challenge without touching level/challenge
// index or rep progress — used both by loadLevel() and mid-challenge rep switches.
function startChallengeInstance() {
  const challenge = getActiveChallenge();
  practiceState.currentInstance = pickChallengeInstance(challenge, practiceState.currentInstance);
  const instance = practiceState.currentInstance;

  practiceState.mode = "normal";
  practiceState.pendingKeys = "";
  practiceState.digitBuffer = "";
  practiceState.searchQuery = "";

  practiceState.buffer = instance.text.split("\n");
  practiceState.cursor = { ...instance.start };
  practiceState.visualAnchor = { ...instance.start };

  practiceState.levelKeystrokes = 0;
  practiceState.levelStartTime = new Date();

  renderEditor();
  updateStatusLine();
}

// Load level and challenge
function loadLevel(levelIdx, challengeIdx) {
  practiceState.currentLevelIdx = levelIdx;
  practiceState.currentChallengeIdx = challengeIdx;
  practiceState.repsCompleted = 0;
  practiceState.currentInstance = null;
  practiceState.repTransitioning = false;

  const level = getActiveLevel();
  const challenge = getActiveChallenge();

  startChallengeInstance();

  // Setup UI texts
  document.getElementById("level-title").textContent = level.name;
  document.getElementById("level-desc").textContent = level.description;
  document.getElementById("challenge-instr").innerHTML = challenge.instructions;
  document.getElementById("step-indicator").textContent = `Challenge ${challengeIdx + 1} of ${level.challenges.length}`;

  document.getElementById("split-tip-text").textContent = challenge.splitTip || "";

  document.getElementById("hint-text").style.opacity = 0;
  updateSidebarHighlights();
  updateChallengeNavUI();
}

// Reflects challenge progress: rep count while still practicing, solved badge once
// the required reps are met (which unlocks Next). Previous is disabled only at the
// very first challenge of the whole curriculum.
function updateChallengeNavUI() {
  const level = getActiveLevel();
  const challenge = getActiveChallenge();
  const solved = isChallengeSolved(practiceState.currentLevelIdx, practiceState.currentChallengeIdx);
  const requiredReps = getRequiredReps(challenge);
  const isVeryFirstChallenge = practiceState.currentLevelIdx === 0 && practiceState.currentChallengeIdx === 0;
  const isLastChallengeOfLevel = practiceState.currentChallengeIdx === level.challenges.length - 1;
  const isLastChallengeOfLastLevel = practiceState.currentLevelIdx === VIM_LEVELS.length - 1 && isLastChallengeOfLevel;

  const prevBtn = document.getElementById("prev-challenge-btn");
  const nextBtn = document.getElementById("next-challenge-btn");
  const badge = document.getElementById("challenge-solved-badge");

  prevBtn.disabled = isVeryFirstChallenge;
  nextBtn.disabled = !solved;
  nextBtn.textContent = isLastChallengeOfLastLevel ? "Finish →" : (isLastChallengeOfLevel ? "Next Level →" : "Next →");
  nextBtn.title = solved ? "" : "Solve this challenge the required number of times to unlock";

  if (solved) {
    badge.textContent = "✓ Solved — keep practicing or move on";
    badge.classList.remove("challenge-progress-badge");
    badge.style.display = "inline-flex";
  } else if (practiceState.repsCompleted > 0) {
    badge.textContent = practiceState.repTransitioning
      ? `✓ ${practiceState.repsCompleted} / ${requiredReps} reps — new one incoming...`
      : `${practiceState.repsCompleted} / ${requiredReps} reps — keep practicing!`;
    badge.classList.add("challenge-progress-badge");
    badge.style.display = "inline-flex";
  } else {
    badge.style.display = "none";
  }
}

function goToPreviousChallenge() {
  if (practiceState.currentChallengeIdx > 0) {
    loadLevel(practiceState.currentLevelIdx, practiceState.currentChallengeIdx - 1);
  } else if (practiceState.currentLevelIdx > 0) {
    const prevLevel = VIM_LEVELS[practiceState.currentLevelIdx - 1];
    loadLevel(practiceState.currentLevelIdx - 1, prevLevel.challenges.length - 1);
  }
}

function goToNextChallenge() {
  if (!isChallengeSolved(practiceState.currentLevelIdx, practiceState.currentChallengeIdx)) return;

  const level = getActiveLevel();
  if (practiceState.currentChallengeIdx < level.challenges.length - 1) {
    loadLevel(practiceState.currentLevelIdx, practiceState.currentChallengeIdx + 1);
  } else if (practiceState.currentLevelIdx < VIM_LEVELS.length - 1) {
    showLevelCompletePopup(level.name, practiceState.lastChallengeScore);
  } else {
    showGameCompletePopup();
  }
}

// Check character visual selection state
function isCharSelected(lineIdx, colIdx) {
  if (practiceState.mode === "visual") {
    const a = practiceState.visualAnchor;
    const c = practiceState.cursor;
    
    const minL = Math.min(a.line, c.line);
    const maxL = Math.max(a.line, c.line);
    
    if (lineIdx < minL || lineIdx > maxL) return false;
    if (minL === maxL) {
      const minC = Math.min(a.col, c.col);
      const maxC = Math.max(a.col, c.col);
      return colIdx >= minC && colIdx <= maxC;
    }
    
    if (lineIdx === minL) {
      const startCol = (minL === a.line) ? a.col : c.col;
      return colIdx >= startCol;
    }
    if (lineIdx === maxL) {
      const endCol = (maxL === a.line) ? a.col : c.col;
      return colIdx <= endCol;
    }
    return true; // Strictly between min and max line
  } 
  
  if (practiceState.mode === "visual-line") {
    const minL = Math.min(practiceState.visualAnchor.line, practiceState.cursor.line);
    const maxL = Math.max(practiceState.visualAnchor.line, practiceState.cursor.line);
    return lineIdx >= minL && lineIdx <= maxL;
  }
  
  return false;
}

// Generate Relative or Absolute line numbers & characters
function renderEditor() {
  const container = document.getElementById("editor-lines");
  container.innerHTML = "";

  const challenge = getActiveChallenge();
  const cursorLine = practiceState.cursor.line;
  const cursorCol = practiceState.cursor.col;

  practiceState.buffer.forEach((lineText, lineIdx) => {
    const lineEl = document.createElement("div");
    lineEl.className = "editor-line";
    if (lineIdx === cursorLine) {
      lineEl.classList.add("active-line");
    }

    const numEl = document.createElement("span");
    numEl.className = "line-number";
    
    if (practiceState.relativeLines) {
      if (lineIdx === cursorLine) {
        numEl.textContent = String(lineIdx + 1).padStart(3, " ");
        numEl.classList.add("current-num");
      } else {
        const diff = Math.abs(lineIdx - cursorLine);
        numEl.textContent = String(diff).padStart(3, " ");
      }
    } else {
      numEl.textContent = String(lineIdx + 1).padStart(3, " ");
      if (lineIdx === cursorLine) numEl.classList.add("current-num");
    }
    lineEl.appendChild(numEl);

    const charClasses = tokenizeLine(lineText);

    const contentEl = document.createElement("span");
    contentEl.className = "line-content";

    const renderLength = (practiceState.mode === "insert") ? lineText.length + 1 : Math.max(1, lineText.length);
    
    for (let colIdx = 0; colIdx < renderLength; colIdx++) {
      const charSpan = document.createElement("span");
      charSpan.className = "editor-char";
      
      const isCursorHere = (lineIdx === cursorLine && colIdx === cursorCol);

      if (colIdx < lineText.length) {
        const char = lineText[colIdx];
        charSpan.textContent = char;
        charSpan.classList.add(charClasses[colIdx]);
      } else {
        charSpan.innerHTML = "&nbsp;";
      }

      const navTarget = practiceState.currentInstance && practiceState.currentInstance.target;
      if (challenge.type === "navigate" && navTarget && navTarget.line === lineIdx && navTarget.col === colIdx) {
        charSpan.classList.add("char-target");
      }

      if (isCharSelected(lineIdx, colIdx)) {
        charSpan.classList.add("char-selected");
      }

      if (isCursorHere) {
        if (practiceState.mode === "insert") {
          charSpan.classList.add("cursor-insert");
        } else {
          charSpan.classList.add("cursor-normal");
        }
      }

      contentEl.appendChild(charSpan);
    }

    lineEl.appendChild(contentEl);
    container.appendChild(lineEl);
  });
}

// Tokenizer for code-like syntax highlighting
function tokenizeLine(text) {
  const classes = new Array(text.length).fill("syntax-default");
  
  const commentIdx = text.indexOf("//");
  if (commentIdx !== -1) {
    for (let i = commentIdx; i < text.length; i++) {
      classes[i] = "syntax-comment";
    }
  }
  
  let inDoubleQuote = false;
  let inSingleQuote = false;
  for (let i = 0; i < (commentIdx !== -1 ? commentIdx : text.length); i++) {
    const char = text[i];
    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      classes[i] = "syntax-string";
      continue;
    }
    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      classes[i] = "syntax-string";
      continue;
    }
    if (inDoubleQuote || inSingleQuote) {
      classes[i] = "syntax-string";
    }
  }
  
  const wordRegex = /\b[a-zA-Z0-9_]+\b/g;
  let match;
  const keywords = ["const", "let", "var", "function", "return", "import", "from", "default", "export", "true", "false", "if", "else", "new"];
  
  while ((match = wordRegex.exec(text)) !== null) {
    const word = match[0];
    const startIdx = match.index;
    const endIdx = startIdx + word.length;
    
    if (classes[startIdx] !== "syntax-default") continue;
    
    if (keywords.includes(word)) {
      for (let i = startIdx; i < endIdx; i++) {
        classes[i] = "syntax-keyword";
      }
    } else if (/^\d+$/.test(word)) {
      for (let i = startIdx; i < endIdx; i++) {
        classes[i] = "syntax-number";
      }
    }
  }
  
  return classes;
}

// Handles physical key presses and coordinates Vim command processing
function handleGlobalKeyDown(e) {
  if (!isPracticeActive) return;

  // Catch modifiers by themselves
  if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
    return;
  }

  let keyStr = e.key;
  if (e.ctrlKey && e.key !== "Control") {
    keyStr = `Ctrl+${e.key.toLowerCase()}`;
  }

  practiceState.levelKeystrokes++;
  practiceState.totalKeystrokes++;

  // 1. Route based on Search mode input capture
  if (practiceState.mode === "search") {
    handleSearchModeKey(e);
    renderEditor();
    updateStatusLine();
    checkChallengeCompletion();
    return;
  }

  // 2. Route based on Insert mode input capture
  if (practiceState.mode === "insert") {
    if (e.key === "Escape") {
      e.preventDefault();
      exitInsertMode();
    } else {
      e.preventDefault();
      handleInsertModeKey(e);
    }
    renderEditor();
    updateStatusLine();
    checkChallengeCompletion();
    return;
  }

  // 3. Route based on Normal and Visual mode input capture
  e.preventDefault();
  handleNormalOrVisualModeKey(keyStr);
  renderEditor();
  updateStatusLine();
  checkChallengeCompletion();
}

function exitInsertMode() {
  practiceState.mode = "normal";
  const lineText = practiceState.buffer[practiceState.cursor.line];
  if (practiceState.cursor.col >= lineText.length && lineText.length > 0) {
    practiceState.cursor.col = lineText.length - 1;
  }
}

function handleInsertModeKey(e) {
  const lineIdx = practiceState.cursor.line;
  const colIdx = practiceState.cursor.col;
  let lineText = practiceState.buffer[lineIdx];

  if (e.key === "Backspace") {
    if (colIdx > 0) {
      practiceState.buffer[lineIdx] = lineText.slice(0, colIdx - 1) + lineText.slice(colIdx);
      practiceState.cursor.col--;
    } else if (lineIdx > 0) {
      const prevLineText = practiceState.buffer[lineIdx - 1];
      practiceState.cursor.col = prevLineText.length;
      practiceState.buffer[lineIdx - 1] = prevLineText + lineText;
      practiceState.buffer.splice(lineIdx, 1);
      practiceState.cursor.line--;
    }
  } else if (e.key === "Enter") {
    const before = lineText.slice(0, colIdx);
    const after = lineText.slice(colIdx);
    practiceState.buffer[lineIdx] = before;
    practiceState.buffer.splice(lineIdx + 1, 0, after);
    practiceState.cursor.line++;
    practiceState.cursor.col = 0;
  } else if (e.key.length === 1) {
    practiceState.buffer[lineIdx] = lineText.slice(0, colIdx) + e.key + lineText.slice(colIdx);
    practiceState.cursor.col++;
  }
}

// Normal Mode Command Controller (Handles digits, modifiers, visual range toggling)
function handleNormalOrVisualModeKey(key) {
  // If waiting for modifier arguments (like f, t, r, d, c)
  if (practiceState.pendingKeys) {
    processPendingCommand(key);
    return;
  }

  // Digits buffer for multipliers (Normal mode only)
  if (practiceState.mode === "normal") {
    if (/^[1-9]$/.test(key) || (practiceState.digitBuffer !== "" && key === "0")) {
      practiceState.digitBuffer += key;
      return;
    }
  }

  const multiplier = practiceState.digitBuffer ? parseInt(practiceState.digitBuffer) : 1;
  practiceState.digitBuffer = ""; // Reset count buffer

  const lineText = practiceState.buffer[practiceState.cursor.line];

  switch (key) {
    // Esc exits visual modes to normal
    case "Escape":
      practiceState.mode = "normal";
      break;

    // Direct motions
    case "h":
      practiceState.cursor.col = Math.max(0, practiceState.cursor.col - multiplier);
      break;
    case "l":
      const maxCol = Math.max(0, lineText.length - 1);
      practiceState.cursor.col = Math.min(maxCol, practiceState.cursor.col + multiplier);
      break;
    case "j":
      if (practiceState.cursor.line < practiceState.buffer.length - 1) {
        practiceState.cursor.line = Math.min(practiceState.buffer.length - 1, practiceState.cursor.line + multiplier);
        clipCursorColumn();
      }
      break;
    case "k":
      if (practiceState.cursor.line > 0) {
        practiceState.cursor.line = Math.max(0, practiceState.cursor.line - multiplier);
        clipCursorColumn();
      }
      break;

    // Word Jumps
    case "w":
      for (let i = 0; i < multiplier; i++) {
        practiceState.cursor = getNextWordStart(practiceState.buffer, practiceState.cursor.line, practiceState.cursor.col);
      }
      break;
    case "e":
      for (let i = 0; i < multiplier; i++) {
        practiceState.cursor = getNextWordEnd(practiceState.buffer, practiceState.cursor.line, practiceState.cursor.col);
      }
      break;
    case "b":
      for (let i = 0; i < multiplier; i++) {
        practiceState.cursor = getPrevWordStart(practiceState.buffer, practiceState.cursor.line, practiceState.cursor.col);
      }
      break;

    // WORD Jumps (Capitals)
    case "W":
      for (let i = 0; i < multiplier; i++) {
        practiceState.cursor = getNextWORDStart(practiceState.buffer, practiceState.cursor.line, practiceState.cursor.col);
      }
      break;
    case "E":
      for (let i = 0; i < multiplier; i++) {
        practiceState.cursor = getNextWORDEnd(practiceState.buffer, practiceState.cursor.line, practiceState.cursor.col);
      }
      break;
    case "B":
      for (let i = 0; i < multiplier; i++) {
        practiceState.cursor = getPrevWORDStart(practiceState.buffer, practiceState.cursor.line, practiceState.cursor.col);
      }
      break;

    // Line boundary motions
    case "0":
      practiceState.cursor.col = 0;
      break;
    case "^":
    case "_":
      const matchStart = lineText.match(/^\s*/);
      practiceState.cursor.col = matchStart ? matchStart[0].length : 0;
      break;
    case "$":
      practiceState.cursor.col = Math.max(0, lineText.length - 1);
      break;

    // Character search prefixes
    case "f":
    case "F":
    case "t":
    case "T":
    case "r":
      practiceState.pendingKeys = key;
      break;

    // Repeat search
    case ";":
      repeatCharacterSearch(false, multiplier);
      break;
    case ",":
      repeatCharacterSearch(true, multiplier);
      break;

    // Search Mode triggers
    case "/":
    case "?":
      practiceState.mode = "search";
      practiceState.searchDirection = key;
      practiceState.searchQuery = "";
      break;

    case "n":
      repeatSearchPattern(false, multiplier);
      break;
    case "N":
      repeatSearchPattern(true, multiplier);
      break;
    case "*":
      quickWordSearch(false);
      break;
    case "#":
      quickWordSearch(true);
      break;

    // Vertical Jumps
    case "g":
      practiceState.pendingKeys = "g";
      break;
    case "G":
      practiceState.cursor.line = practiceState.buffer.length - 1;
      practiceState.cursor.col = 0;
      clipCursorColumn();
      break;
    case "{":
      for (let i = 0; i < multiplier; i++) {
        let pl = practiceState.cursor.line - 1;
        while (pl > 0 && practiceState.buffer[pl].trim().length > 0) pl--;
        practiceState.cursor.line = Math.max(0, pl);
      }
      practiceState.cursor.col = 0;
      break;
    case "}":
      for (let i = 0; i < multiplier; i++) {
        let nl = practiceState.cursor.line + 1;
        while (nl < practiceState.buffer.length - 1 && practiceState.buffer[nl].trim().length > 0) nl++;
        practiceState.cursor.line = Math.min(practiceState.buffer.length - 1, nl);
      }
      practiceState.cursor.col = 0;
      break;

    // Scroll window
    case "Ctrl+d":
      practiceState.cursor.line = Math.min(practiceState.buffer.length - 1, practiceState.cursor.line + multiplier * 4);
      practiceState.cursor.col = 0;
      break;
    case "Ctrl+u":
      practiceState.cursor.line = Math.max(0, practiceState.cursor.line - multiplier * 4);
      practiceState.cursor.col = 0;
      break;

    // Visual Mode Triggers
    case "v":
      if (practiceState.mode === "visual") {
        practiceState.mode = "normal";
      } else {
        practiceState.mode = "visual";
        practiceState.visualAnchor = { ...practiceState.cursor };
      }
      break;
    case "V":
      if (practiceState.mode === "visual-line") {
        practiceState.mode = "normal";
      } else {
        practiceState.mode = "visual-line";
        practiceState.visualAnchor = { ...practiceState.cursor };
      }
      break;
    // Editing Operators (Normal and Visual Mode routing)
    case "d":
    case "c":
      if (practiceState.mode === "visual" || practiceState.mode === "visual-line") {
        executeVisualOperation(key);
      } else {
        practiceState.pendingKeys = key;
      }
      break;
    case "y":
      if (practiceState.mode === "visual" || practiceState.mode === "visual-line") {
        executeVisualOperation(key);
      } else {
        practiceState.pendingKeys = key;
      }
      break;
    case "p":
      pasteClipboard(false, multiplier);
      break;
    case "P":
      pasteClipboard(true, multiplier);
      break;

    case "x":
      if (practiceState.mode === "visual" || practiceState.mode === "visual-line") {
        executeVisualOperation("d");
      } else {
        for (let i = 0; i < multiplier; i++) {
          const lText = practiceState.buffer[practiceState.cursor.line];
          if (lText.length > 0) {
            practiceState.buffer[practiceState.cursor.line] = lText.slice(0, practiceState.cursor.col) + lText.slice(practiceState.cursor.col + 1);
            clipCursorColumn();
          }
        }
      }
      break;

    case "s":
      // Substitute char (delete and insert)
      const lText = practiceState.buffer[practiceState.cursor.line];
      if (lText.length > 0) {
        practiceState.buffer[practiceState.cursor.line] = lText.slice(0, practiceState.cursor.col) + lText.slice(practiceState.cursor.col + 1);
        practiceState.mode = "insert";
      }
      break;

    // Normal Insert Modes
    case "i":
      practiceState.mode = "insert";
      break;
    case "a":
      practiceState.mode = "insert";
      if (lineText.length > 0) practiceState.cursor.col++;
      break;
    case "I":
      const nonBlankMatch = lineText.match(/^\s*/);
      practiceState.cursor.col = nonBlankMatch ? nonBlankMatch[0].length : 0;
      practiceState.mode = "insert";
      break;
    case "A":
      practiceState.cursor.col = lineText.length;
      practiceState.mode = "insert";
      break;
    case "o":
      if (practiceState.mode === "visual" || practiceState.mode === "visual-line") {
        // Swap selection cursor ends in Visual Mode
        const temp = { ...practiceState.cursor };
        practiceState.cursor = { ...practiceState.visualAnchor };
        practiceState.visualAnchor = temp;
      } else {
        practiceState.buffer.splice(practiceState.cursor.line + 1, 0, "");
        practiceState.cursor.line++;
        practiceState.cursor.col = 0;
        practiceState.mode = "insert";
      }
      break;
    case "O":
      practiceState.buffer.splice(practiceState.cursor.line, 0, "");
      practiceState.cursor.col = 0;
      practiceState.mode = "insert";
      break;
  }
}

// Handles input characters when typing a search pattern
function handleSearchModeKey(e) {
  if (e.key === "Enter") {
    practiceState.mode = "normal";
    if (practiceState.searchQuery !== "") {
      practiceState.lastSearch = { query: practiceState.searchQuery, direction: practiceState.searchDirection };
      executeSearchPattern(practiceState.searchQuery, practiceState.searchDirection, practiceState.cursor.line, practiceState.cursor.col);
    }
  } else if (e.key === "Escape") {
    practiceState.mode = "normal";
    practiceState.searchQuery = "";
  } else if (e.key === "Backspace") {
    if (practiceState.searchQuery.length > 0) {
      practiceState.searchQuery = practiceState.searchQuery.slice(0, -1);
    } else {
      practiceState.mode = "normal";
    }
  } else if (e.key.length === 1) {
    practiceState.searchQuery += e.key;
  }
}

// Executes Search query search and places cursor
function executeSearchPattern(query, direction, fromLine, fromCol, count = 1) {
  if (!query) return;
  let matches = [];
  
  practiceState.buffer.forEach((lineText, lineIdx) => {
    let pos = lineText.indexOf(query);
    while (pos !== -1) {
      matches.push({ line: lineIdx, col: pos });
      pos = lineText.indexOf(query, pos + 1);
    }
  });

  if (matches.length === 0) return;

  matches.sort((a, b) => {
    if (a.line !== b.line) return a.line - b.line;
    return a.col - b.col;
  });

  let currentIdx = -1;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    if (m.line > fromLine || (m.line === fromLine && m.col >= fromCol)) {
      currentIdx = i;
      break;
    }
  }
  if (currentIdx === -1 && matches.length > 0) {
    currentIdx = 0; 
  }

  let found = null;
  if (direction === "/") {
    let targetIdx = (currentIdx === -1) ? 0 : currentIdx;
    targetIdx = (targetIdx + (count - 1)) % matches.length;
    found = matches[targetIdx];
  } else {
    let targetIdx = (currentIdx === -1) ? matches.length - 1 : currentIdx - 1;
    if (targetIdx < 0) targetIdx = matches.length - 1;
    targetIdx = (targetIdx - (count - 1)) % matches.length;
    if (targetIdx < 0) targetIdx += matches.length;
    found = matches[targetIdx];
  }

  if (found) {
    practiceState.cursor.line = found.line;
    practiceState.cursor.col = found.col;
  }
}

function repeatSearchPattern(reverse = false, count = 1) {
  const search = practiceState.lastSearch;
  if (!search.query) return;

  let dir = search.direction;
  if (reverse) {
    dir = (dir === "/") ? "?" : "/";
  }

  executeSearchPattern(search.query, dir, practiceState.cursor.line, practiceState.cursor.col, count);
}

function quickWordSearch(reverse = false) {
  const lineText = practiceState.buffer[practiceState.cursor.line];
  const col = practiceState.cursor.col;
  if (lineText.length === 0) return;

  let start = col;
  while (start > 0 && /[a-zA-Z0-9_]/.test(lineText[start - 1])) start--;
  let end = col;
  while (end < lineText.length - 1 && /[a-zA-Z0-9_]/.test(lineText[end + 1])) end++;

  const word = lineText.slice(start, end + 1);
  if (!/^[a-zA-Z0-9_]+$/.test(word)) return;

  practiceState.lastSearch = { query: word, direction: reverse ? "?" : "/" };
  // Search from next/prev character to avoid self-match
  const nextCol = reverse ? Math.max(0, start - 1) : Math.min(lineText.length - 1, end + 1);
  executeSearchPattern(word, reverse ? "?" : "/", practiceState.cursor.line, nextCol);
}

// Multi-key routing controller (operators like d, c)
function processPendingCommand(key) {
  const pending = practiceState.pendingKeys;
  practiceState.pendingKeys = ""; // Clear buffer

  // 1. gg movement
  if (pending === "g") {
    if (key === "g") {
      practiceState.cursor.line = 0;
      practiceState.cursor.col = 0;
    }
    return;
  }

  // 2. inline search (f, t, F, T)
  if (["f", "F", "t", "T"].includes(pending)) {
    practiceState.searchCommand = { type: pending, char: key };
    executeCharacterSearch(pending, key);
    return;
  }

  // 3. character replacement
  if (pending === "r") {
    const lineText = practiceState.buffer[practiceState.cursor.line];
    if (lineText.length > 0) {
      practiceState.buffer[practiceState.cursor.line] = 
        lineText.slice(0, practiceState.cursor.col) + key + lineText.slice(practiceState.cursor.col + 1);
    }
    return;
  }

  // 4. operators d or c
  if (pending === "d" || pending === "c") {
    // dd or cc line operations
    if (key === pending) {
      if (pending === "d") {
        practiceState.clipboard = { type: "line", content: [practiceState.buffer[practiceState.cursor.line]] };
        practiceState.buffer.splice(practiceState.cursor.line, 1);
        if (practiceState.buffer.length === 0) practiceState.buffer = [""];
        if (practiceState.cursor.line >= practiceState.buffer.length) {
          practiceState.cursor.line = practiceState.buffer.length - 1;
        }
        practiceState.cursor.col = 0;
      } else if (pending === "c") {
        practiceState.buffer[practiceState.cursor.line] = "";
        practiceState.cursor.col = 0;
        practiceState.mode = "insert";
      }
      return;
    }

    // D deletes to end of line
    if (key === "D") {
      deleteToLineEnd(pending);
      return;
    }

    // dj or dk multi-line deletes
    if (key === "j" && practiceState.cursor.line < practiceState.buffer.length - 1) {
      const deleteRange = [practiceState.buffer[practiceState.cursor.line], practiceState.buffer[practiceState.cursor.line + 1]];
      practiceState.clipboard = { type: "line", content: deleteRange };
      practiceState.buffer.splice(practiceState.cursor.line, 2);
      if (practiceState.buffer.length === 0) practiceState.buffer = [""];
      if (practiceState.cursor.line >= practiceState.buffer.length) {
        practiceState.cursor.line = practiceState.buffer.length - 1;
      }
      practiceState.cursor.col = 0;
      return;
    }
    if (key === "k" && practiceState.cursor.line > 0) {
      const deleteRange = [practiceState.buffer[practiceState.cursor.line - 1], practiceState.buffer[practiceState.cursor.line]];
      practiceState.clipboard = { type: "line", content: deleteRange };
      practiceState.buffer.splice(practiceState.cursor.line - 1, 2);
      practiceState.cursor.line--;
      if (practiceState.buffer.length === 0) practiceState.buffer = [""];
      practiceState.cursor.col = 0;
      return;
    }

    // waiting for inner/around text object (di... or ci...)
    if (key === "i" || key === "a") {
      practiceState.pendingKeys = pending + key;
      return;
    }

    // motions (dw, cw, d$)
    if (key === "w") {
      deleteMotion(pending, getNextWordStart);
    } else if (key === "$") {
      deleteToLineEnd(pending);
    }
    return;
  }

  // 5. operator y (yank/copy)
  if (pending === "y") {
    if (key === "y") {
      practiceState.clipboard = { type: "line", content: [practiceState.buffer[practiceState.cursor.line]] };
    }
    return;
  }

  // 6. Text objects (diw, ciw, da{, etc.)
  if (pending.startsWith("d") || pending.startsWith("c")) {
    const op = pending[0];   // d or c
    const scope = pending[1]; // i or a

    if (scope === "i") {
      if (key === "w") {
        deleteTextObjectWord(op, false);
      } else if (key === '"' || key === "'") {
        deleteTextObjectQuotes(op, key, false);
      } else if (key === "{" || key === "}") {
        deleteInnerBrackets(op, "{", "}", false);
      } else if (key === "(" || key === ")") {
        deleteInnerBrackets(op, "(", ")", false);
      } else if (key === "[" || key === "]") {
        deleteInnerBrackets(op, "[", "]", false);
      } else if (key === "p") {
        deleteTextObjectParagraph(op, false);
      }
    } else if (scope === "a") {
      if (key === "w") {
        deleteTextObjectWord(op, true);
      } else if (key === '"' || key === "'") {
        deleteTextObjectQuotes(op, key, true);
      } else if (key === "{" || key === "}") {
        deleteInnerBrackets(op, "{", "}", true);
      } else if (key === "(" || key === ")") {
        deleteInnerBrackets(op, "(", ")", true);
      } else if (key === "[" || key === "]") {
        deleteInnerBrackets(op, "[", "]", true);
      } else if (key === "p") {
        deleteTextObjectParagraph(op, true);
      }
    }
  }
}

// Core Vim horizontal character search
function executeCharacterSearch(type, char, count = 1) {
  const lineText = practiceState.buffer[practiceState.cursor.line];
  const currentCol = practiceState.cursor.col;
  let foundCol = -1;
  let matches = [];

  if (type === "f" || type === "t") {
    let idx = lineText.indexOf(char, currentCol + 1);
    while (idx !== -1) {
      matches.push(idx);
      idx = lineText.indexOf(char, idx + 1);
    }
    if (matches.length >= count) {
      foundCol = matches[count - 1];
      if (type === "t") foundCol--;
    }
  } else if (type === "F" || type === "T") {
    let idx = lineText.lastIndexOf(char, currentCol - 1);
    while (idx !== -1 && idx >= 0) {
      matches.push(idx);
      idx = lineText.lastIndexOf(char, idx - 1);
    }
    if (matches.length >= count) {
      foundCol = matches[count - 1];
      if (type === "T") foundCol++;
    }
  }

  if (foundCol !== -1) {
    practiceState.cursor.col = foundCol;
  }
}

function repeatCharacterSearch(reverse = false, count = 1) {
  const search = practiceState.searchCommand;
  if (!search.type || !search.char) return;

  let type = search.type;
  if (reverse) {
    const swaps = { "f": "F", "F": "f", "t": "T", "T": "t" };
    type = swaps[type];
  }

  executeCharacterSearch(type, search.char, count);
}

function deleteMotion(op, motionFunc) {
  const targetCursor = motionFunc(practiceState.buffer, practiceState.cursor.line, practiceState.cursor.col);
  
  if (targetCursor.line === practiceState.cursor.line) {
    const lineText = practiceState.buffer[practiceState.cursor.line];
    const minCol = Math.min(practiceState.cursor.col, targetCursor.col);
    const maxCol = Math.max(practiceState.cursor.col, targetCursor.col);
    
    practiceState.buffer[practiceState.cursor.line] = lineText.slice(0, minCol) + lineText.slice(maxCol);
    practiceState.cursor.col = minCol;
    clipCursorColumn();

    if (op === "c") {
      practiceState.mode = "insert";
    }
  }
}

function deleteToLineEnd(op) {
  const lineText = practiceState.buffer[practiceState.cursor.line];
  practiceState.buffer[practiceState.cursor.line] = lineText.slice(0, practiceState.cursor.col);
  if (op === "c") {
    practiceState.mode = "insert";
  } else {
    clipCursorColumn();
  }
}

// Copy-Paste
function pasteClipboard(above = false, count = 1) {
  const clip = practiceState.clipboard;
  if (!clip.content) return;

  for (let c = 0; c < count; c++) {
    const lineIdx = practiceState.cursor.line;
    if (clip.type === "line") {
      if (above) {
        practiceState.buffer.splice(lineIdx, 0, ...clip.content);
        practiceState.cursor.line = lineIdx;
      } else {
        practiceState.buffer.splice(lineIdx + 1, 0, ...clip.content);
        practiceState.cursor.line = lineIdx + clip.content.length;
      }
      practiceState.cursor.col = 0;
    } else {
      // char paste
      const lText = practiceState.buffer[lineIdx];
      const col = practiceState.cursor.col;
      if (above) {
        practiceState.buffer[lineIdx] = lText.slice(0, col) + clip.content + lText.slice(col);
        practiceState.cursor.col = col + clip.content.length - 1;
      } else {
        practiceState.buffer[lineIdx] = lText.slice(0, col + 1) + clip.content + lText.slice(col + 1);
        practiceState.cursor.col = col + clip.content.length;
      }
    }
  }
}

// Visual Mode Operators
function executeVisualOperation(op) {
  const a = practiceState.visualAnchor;
  const c = practiceState.cursor;
  const minL = Math.min(a.line, c.line);
  const maxL = Math.max(a.line, c.line);

  if (practiceState.mode === "visual") {
    let content = "";
    if (minL === maxL) {
      const minC = Math.min(a.col, c.col);
      const maxC = Math.max(a.col, c.col);
      const lineText = practiceState.buffer[minL];
      content = lineText.slice(minC, maxC + 1);
      
      if (op === "d" || op === "c") {
        practiceState.buffer[minL] = lineText.slice(0, minC) + lineText.slice(maxC + 1);
        practiceState.cursor.col = minC;
      }
    } else {
      // multi-line visual slice
      const startCol = (minL === a.line) ? a.col : c.col;
      const endCol = (maxL === a.line) ? a.col : c.col;
      
      const headText = practiceState.buffer[minL].slice(0, startCol);
      const tailText = practiceState.buffer[maxL].slice(endCol + 1);
      
      content = practiceState.buffer[minL].slice(startCol) + "\n";
      for (let i = minL + 1; i < maxL; i++) {
        content += practiceState.buffer[i] + "\n";
      }
      content += practiceState.buffer[maxL].slice(0, endCol + 1);

      if (op === "d" || op === "c") {
        practiceState.buffer[minL] = headText + tailText;
        practiceState.buffer.splice(minL + 1, maxL - minL);
        practiceState.cursor.line = minL;
        practiceState.cursor.col = startCol;
      }
    }

    practiceState.clipboard = { type: "char", content: content };
    practiceState.mode = "normal";
    if (op === "c") practiceState.mode = "insert";
    clipCursorColumn();
  } 
  
  else if (practiceState.mode === "visual-line") {
    const lines = practiceState.buffer.slice(minL, maxL + 1);
    practiceState.clipboard = { type: "line", content: lines };

    if (op === "d" || op === "c") {
      practiceState.buffer.splice(minL, maxL - minL + 1);
      if (practiceState.buffer.length === 0) practiceState.buffer = [""];
      practiceState.cursor.line = Math.min(practiceState.buffer.length - 1, minL);
      practiceState.cursor.col = 0;
    }

    practiceState.mode = "normal";
    if (op === "c") {
      practiceState.buffer.splice(practiceState.cursor.line, 0, "");
      practiceState.mode = "insert";
    }
  }
}

// --- Text Objects Algorithms ---

function clipCursorColumn() {
  const lineText = practiceState.buffer[practiceState.cursor.line];
  const maxCol = Math.max(0, lineText.length - 1);
  if (practiceState.cursor.col > maxCol) {
    practiceState.cursor.col = maxCol;
  }
}

// Char class for lowercase word motions: word chars, punctuation, and space are three distinct classes
function getCharType(char) {
  if (!char) return "end";
  if (/\s/.test(char)) return "space";
  if (/[a-zA-Z0-9_]/.test(char)) return "word";
  return "punct";
}

function getNextWordStart(lines, line, col) {
  let l = line;
  let c = col;
  let text = lines[l];
  
  if (text.length === 0 || c >= text.length - 1) {
    if (l < lines.length - 1) {
      l++;
      c = 0;
      while (l < lines.length - 1 && lines[l].trim().length === 0) l++;
      const match = lines[l].match(/^\s*/);
      return { line: l, col: match ? match[0].length : 0 };
    }
    return { line, col };
  }
  
  const startType = getCharType(text[c]);
  let i = c;
  while (i < text.length && getCharType(text[i]) === startType) i++;
  while (i < text.length && getCharType(text[i]) === "space") i++;
  
  if (i < text.length) {
    return { line: l, col: i };
  } else {
    if (l < lines.length - 1) {
      l++;
      const match = lines[l].match(/^\s*/);
      return { line: l, col: match ? match[0].length : 0 };
    }
    return { line: l, col: text.length - 1 };
  }
}

function getNextWordEnd(lines, line, col) {
  let l = line;
  let c = col;
  let text = lines[l];
  
  if (text.length === 0 || c >= text.length - 1) {
    if (l < lines.length - 1) {
      l++;
      text = lines[l];
      c = 0;
      while (l < lines.length - 1 && text.trim().length === 0) {
        l++;
        text = lines[l];
      }
      const match = text.match(/^\s*/);
      c = match ? match[0].length : 0;
    } else {
      return { line, col };
    }
  }
  
  let i = c;
  if (getCharType(text[i]) === "space") {
    while (i < text.length && getCharType(text[i]) === "space") i++;
    if (i >= text.length) {
      if (l < lines.length - 1) return getNextWordEnd(lines, l, text.length - 1);
      return { line: l, col: text.length - 1 };
    }
  }
  
  const type = getCharType(text[i]);
  if (i === c && i < text.length - 1 && getCharType(text[i+1]) !== type) {
    i++;
    if (getCharType(text[i]) === "space") {
      while (i < text.length && getCharType(text[i]) === "space") i++;
    }
  }
  
  const currentType = getCharType(text[i]);
  while (i < text.length - 1 && getCharType(text[i + 1]) === currentType) i++;
  
  return { line: l, col: i };
}

function getPrevWordStart(lines, line, col) {
  let l = line;
  let c = col;
  let text = lines[l];
  
  if (c === 0) {
    if (l > 0) {
      l--;
      text = lines[l];
      while (l > 0 && text.trim().length === 0) {
        l--;
        text = lines[l];
      }
      return { line: l, col: Math.max(0, text.length - 1) };
    }
    return { line, col };
  }
  
  let i = c - 1;
  while (i > 0 && getCharType(text[i]) === "space") i--;
  
  const type = getCharType(text[i]);
  while (i > 0 && getCharType(text[i - 1]) === type) i--;
  
  return { line: l, col: i };
}

// WORD mappings (space separated only)
function getWORDCharType(char) {
  if (!char) return "end";
  if (/\s/.test(char)) return "space";
  return "word";
}

function getNextWORDStart(lines, line, col) {
  let l = line;
  let c = col;
  let text = lines[l];
  
  if (text.length === 0 || c >= text.length - 1) {
    if (l < lines.length - 1) {
      l++;
      c = 0;
      while (l < lines.length - 1 && lines[l].trim().length === 0) l++;
      const match = lines[l].match(/^\s*/);
      return { line: l, col: match ? match[0].length : 0 };
    }
    return { line, col };
  }
  
  const startType = getWORDCharType(text[c]);
  let i = c;
  while (i < text.length && getWORDCharType(text[i]) === startType) i++;
  while (i < text.length && getWORDCharType(text[i]) === "space") i++;
  
  if (i < text.length) {
    return { line: l, col: i };
  } else {
    if (l < lines.length - 1) {
      l++;
      const match = lines[l].match(/^\s*/);
      return { line: l, col: match ? match[0].length : 0 };
    }
    return { line: l, col: text.length - 1 };
  }
}

function getNextWORDEnd(lines, line, col) {
  let l = line;
  let c = col;
  let text = lines[l];
  
  if (text.length === 0 || c >= text.length - 1) {
    if (l < lines.length - 1) {
      l++;
      text = lines[l];
      c = 0;
      while (l < lines.length - 1 && text.trim().length === 0) {
        l++;
        text = lines[l];
      }
      const match = text.match(/^\s*/);
      c = match ? match[0].length : 0;
    } else {
      return { line, col };
    }
  }
  
  let i = c;
  if (getWORDCharType(text[i]) === "space") {
    while (i < text.length && getWORDCharType(text[i]) === "space") i++;
    if (i >= text.length) {
      if (l < lines.length - 1) return getNextWORDEnd(lines, l, text.length - 1);
      return { line: l, col: text.length - 1 };
    }
  }
  
  const type = getWORDCharType(text[i]);
  if (i === c && i < text.length - 1 && getWORDCharType(text[i+1]) !== type) {
    i++;
    if (getWORDCharType(text[i]) === "space") {
      while (i < text.length && getWORDCharType(text[i]) === "space") i++;
    }
  }
  
  const currentType = getWORDCharType(text[i]);
  while (i < text.length - 1 && getWORDCharType(text[i + 1]) === currentType) i++;
  
  return { line: l, col: i };
}

function getPrevWORDStart(lines, line, col) {
  let l = line;
  let c = col;
  let text = lines[l];
  
  if (c === 0) {
    if (l > 0) {
      l--;
      text = lines[l];
      while (l > 0 && text.trim().length === 0) {
        l--;
        text = lines[l];
      }
      return { line: l, col: Math.max(0, text.length - 1) };
    }
    return { line, col };
  }
  
  let i = c - 1;
  while (i > 0 && getWORDCharType(text[i]) === "space") i--;
  
  const type = getWORDCharType(text[i]);
  while (i > 0 && getWORDCharType(text[i - 1]) === type) i--;
  
  return { line: l, col: i };
}

// Text objects edit routines (words, quotes, braces, paragraphs)
function deleteTextObjectWord(op, around = false) {
  const lineText = practiceState.buffer[practiceState.cursor.line];
  const col = practiceState.cursor.col;
  if (lineText.length === 0) return;

  let start = col;
  const startType = getCharType(lineText[col]);
  while (start > 0 && getCharType(lineText[start - 1]) === startType) start--;

  let end = col;
  while (end < lineText.length - 1 && getCharType(lineText[end + 1]) === startType) end++;

  if (around) {
    // Delete trailing space if there is one, else delete leading space
    if (end < lineText.length - 1 && getCharType(lineText[end + 1]) === "space") {
      while (end < lineText.length - 1 && getCharType(lineText[end + 1]) === "space") end++;
    } else if (start > 0 && getCharType(lineText[start - 1]) === "space") {
      while (start > 0 && getCharType(lineText[start - 1]) === "space") start--;
    }
  }

  practiceState.buffer[practiceState.cursor.line] = lineText.slice(0, start) + lineText.slice(end + 1);
  practiceState.cursor.col = start;
  clipCursorColumn();

  if (op === "c") {
    practiceState.mode = "insert";
  }
}

function deleteTextObjectQuotes(op, quoteChar, around = false) {
  const lineText = practiceState.buffer[practiceState.cursor.line];
  const col = practiceState.cursor.col;

  const quotes = [];
  for (let i = 0; i < lineText.length; i++) {
    if (lineText[i] === quoteChar) quotes.push(i);
  }

  if (quotes.length < 2) return;

  let leftQuoteIdx = -1;
  let rightQuoteIdx = -1;

  for (let i = 0; i < quotes.length - 1; i += 2) {
    const q1 = quotes[i];
    const q2 = quotes[i + 1];
    if (col >= q1 && col <= q2) {
      leftQuoteIdx = q1;
      rightQuoteIdx = q2;
      break;
    }
  }

  if (leftQuoteIdx === -1) {
    leftQuoteIdx = quotes[0];
    rightQuoteIdx = quotes[1];
  }

  if (around) {
    practiceState.buffer[practiceState.cursor.line] = 
      lineText.slice(0, leftQuoteIdx) + lineText.slice(rightQuoteIdx + 1);
    practiceState.cursor.col = leftQuoteIdx;
  } else {
    practiceState.buffer[practiceState.cursor.line] = 
      lineText.slice(0, leftQuoteIdx + 1) + lineText.slice(rightQuoteIdx);
    practiceState.cursor.col = leftQuoteIdx + 1;
  }
  
  if (op === "c") {
    practiceState.mode = "insert";
  } else {
    clipCursorColumn();
  }
}

function deleteInnerBrackets(op, openChar, closeChar, around = false) {
  const lineText = practiceState.buffer[practiceState.cursor.line];
  const col = practiceState.cursor.col;
  
  let leftIdx = -1;
  let depth = 0;
  for (let i = col; i >= 0; i--) {
    if (lineText[i] === closeChar) depth++;
    if (lineText[i] === openChar) {
      if (depth === 0) {
        leftIdx = i;
        break;
      }
      depth--;
    }
  }

  let rightIdx = -1;
  depth = 0;
  for (let i = col; i < lineText.length; i++) {
    if (lineText[i] === openChar) depth++;
    if (lineText[i] === closeChar) {
      if (depth === 0) {
        rightIdx = i;
        break;
      }
      depth--;
    }
  }

  if (leftIdx !== -1 && rightIdx !== -1) {
    if (around) {
      practiceState.buffer[practiceState.cursor.line] = 
        lineText.slice(0, leftIdx) + lineText.slice(rightIdx + 1);
      practiceState.cursor.col = leftIdx;
    } else {
      practiceState.buffer[practiceState.cursor.line] = 
        lineText.slice(0, leftIdx + 1) + lineText.slice(rightIdx);
      practiceState.cursor.col = leftIdx + 1;
    }
    
    if (op === "c") {
      practiceState.mode = "insert";
    } else {
      clipCursorColumn();
    }
  }
}

// Find paragraph block boundaries
function getParagraphRange(lines, line) {
  let start = line;
  while (start > 0 && lines[start].trim().length > 0) {
    start--;
  }
  if (start < line && lines[start].trim().length === 0) {
    start++;
  }
  
  let end = line;
  while (end < lines.length - 1 && lines[end].trim().length > 0) {
    end++;
  }
  if (end > line && lines[end].trim().length === 0) {
    end--;
  }
  
  return { start, end };
}

function deleteTextObjectParagraph(op, around = false) {
  const range = getParagraphRange(practiceState.buffer, practiceState.cursor.line);
  let count = range.end - range.start + 1;
  let start = range.start;

  if (around) {
    // Also include one empty line
    if (range.end < practiceState.buffer.length - 1 && practiceState.buffer[range.end + 1].trim().length === 0) {
      count++;
    } else if (range.start > 0 && practiceState.buffer[range.start - 1].trim().length === 0) {
      start--;
      count++;
    }
  }

  practiceState.buffer.splice(start, count);
  if (practiceState.buffer.length === 0) {
    practiceState.buffer = [""];
  }

  practiceState.cursor.line = Math.min(practiceState.buffer.length - 1, start);
  practiceState.cursor.col = 0;
  clipCursorColumn();

  if (op === "c") {
    practiceState.buffer.splice(practiceState.cursor.line, 0, "");
    practiceState.mode = "insert";
  }
}

// Update Neovim-like statusline
function updateStatusLine() {
  const modeEl = document.getElementById("vim-status-mode");
  const posEl = document.getElementById("vim-status-pos");
  const percentEl = document.getElementById("vim-status-percent");
  const keysEl = document.getElementById("vim-status-keys");

  // Mode Indicator
  if (practiceState.mode === "normal") {
    modeEl.textContent = " NORMAL ";
    modeEl.className = "status-mode mode-normal";
  } else if (practiceState.mode === "insert") {
    modeEl.textContent = " INSERT ";
    modeEl.className = "status-mode mode-insert";
  } else if (practiceState.mode === "visual") {
    modeEl.textContent = " VISUAL ";
    modeEl.className = "status-mode mode-normal"; // uses high contrast
  } else if (practiceState.mode === "visual-line") {
    modeEl.textContent = " V-LINE ";
    modeEl.className = "status-mode mode-normal";
  } else if (practiceState.mode === "search") {
    modeEl.textContent = " SEARCH ";
    modeEl.className = "status-mode mode-insert";
  }

  // Position
  const line = practiceState.cursor.line + 1;
  const col = practiceState.cursor.col + 1;
  posEl.textContent = `${line}:${col}`;

  // File scroll percentage
  const totalLines = practiceState.buffer.length;
  const percent = Math.round((line / totalLines) * 100);
  percentEl.textContent = `${percent}%`;

  // Key buffer indicator: shows digit multiplier, pending command buffers, or active search pattern input
  if (practiceState.mode === "search") {
    keysEl.textContent = `${practiceState.searchDirection}${practiceState.searchQuery}`;
  } else {
    keysEl.textContent = `${practiceState.digitBuffer}${practiceState.pendingKeys}`;
  }
}

// Check if current challenge win conditions are satisfied. Once solved, the challenge
// stays solved (Next unlocks) but does NOT auto-advance — the player can keep
// retrying the motion as many times as they like until they choose to move on.
function checkChallengeCompletion() {
  if (practiceState.repTransitioning) return;
  if (isChallengeSolved(practiceState.currentLevelIdx, practiceState.currentChallengeIdx)) return;

  const challenge = getActiveChallenge();
  const instance = practiceState.currentInstance;
  let solved = false;

  if (challenge.type === "navigate") {
    solved = practiceState.cursor.line === instance.target.line && practiceState.cursor.col === instance.target.col;
  } else if (challenge.type === "edit") {
    const currentText = practiceState.buffer.join("\n").trim();
    const targetText = instance.targetText.trim();
    // Normal mode check is essential unless the challenge is v + esc navigation which does not edit
    solved = currentText === targetText && practiceState.mode === "normal";
  }

  if (solved) handleRepSolved();
}

// One successful solve of the current scenario. Below the required rep count, this
// awards partial score and swaps in a fresh (often randomized) scenario for another
// go — the player keeps practicing the same motion instead of instantly moving on.
// Once the rep count is met, the challenge unlocks Next for good.
function handleRepSolved() {
  practiceState.repsCompleted++;
  triggerSuccessAnimation();

  const challengeTimeSec = (new Date() - practiceState.levelStartTime) / 1000;
  const requiredReps = getRequiredReps(getActiveChallenge());
  const rawScore = Math.max(10, Math.round(100 - (practiceState.levelKeystrokes * 2) - challengeTimeSec));
  const repScore = Math.max(1, Math.round(rawScore / requiredReps));
  practiceState.score += repScore;
  practiceState.lastChallengeScore = repScore;
  updateStatsDisplay(repScore);

  if (practiceState.repsCompleted >= requiredReps) {
    practiceState.solvedChallenges.add(challengeKey(practiceState.currentLevelIdx, practiceState.currentChallengeIdx));
    updateChallengeNavUI();
    updateSidebar();
  } else {
    practiceState.repTransitioning = true;
    updateChallengeNavUI();
    const levelIdx = practiceState.currentLevelIdx;
    const challengeIdx = practiceState.currentChallengeIdx;
    setTimeout(() => {
      // Bail if the player navigated away (e.g. clicked Previous) during the pause —
      // don't clobber whatever challenge they're on now.
      if (practiceState.currentLevelIdx !== levelIdx || practiceState.currentChallengeIdx !== challengeIdx) return;
      startChallengeInstance();
      practiceState.repTransitioning = false;
      updateChallengeNavUI();
    }, REP_SWITCH_DELAY_MS);
  }
}

function triggerSuccessAnimation() {
  const container = document.querySelector(".editor-panel");
  container.classList.add("pulse-success");
  setTimeout(() => {
    container.classList.remove("pulse-success");
  }, 300);
}

function updateStatsDisplay(lastAddedScore) {
  document.getElementById("stat-score").textContent = practiceState.score;
  
  const efficiency = Math.max(30, Math.min(100, Math.round(100 - (practiceState.levelKeystrokes * 1.5))));
  document.getElementById("stat-efficiency").textContent = `${efficiency}%`;
  
  const xpBadge = document.getElementById("stat-xp-gain");
  xpBadge.textContent = `+${lastAddedScore} XP`;
  xpBadge.classList.add("xp-badge-pop");
  setTimeout(() => {
    xpBadge.classList.remove("xp-badge-pop");
  }, 1000);
}

function showLevelCompletePopup(levelName, score) {
  const overlay = document.createElement("div");
  overlay.className = "win-overlay";
  overlay.innerHTML = `
    <div class="win-card">
      <div class="trophy-icon">🏆</div>
      <h2>Level Complete!</h2>
      <p class="win-level-name">${levelName}</p>
      <p class="win-xp">+${score} XP Gained</p>
      <div class="win-stats">
        <div><span>Keystrokes:</span> <strong>${practiceState.levelKeystrokes}</strong></div>
      </div>
      <button id="next-level-btn" class="glow-btn">Next Level</button>
    </div>
  `;
  document.body.appendChild(overlay);
  
  document.getElementById("next-level-btn").focus();
  document.getElementById("next-level-btn").addEventListener("click", () => {
    overlay.remove();
    loadLevel(practiceState.currentLevelIdx + 1, 0);
  });
}

function showGameCompletePopup() {
  const overlay = document.createElement("div");
  overlay.className = "win-overlay";
  overlay.innerHTML = `
    <div class="win-card final-win">
      <div class="trophy-icon">⚔️🥷</div>
      <h2>VI-MOTION MASTER!</h2>
      <p class="win-desc">Congratulations! You have completed the entire curriculum. You have officially mastered Vim motions and visual layouts on your split keyboard!</p>
      <p class="win-score">Total Score: <strong>${practiceState.score}</strong></p>
      <button id="restart-game-btn" class="glow-btn">Play Again</button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById("restart-game-btn").focus();
  document.getElementById("restart-game-btn").addEventListener("click", () => {
    overlay.remove();
    practiceState.solvedChallenges.clear();
    practiceState.score = 0;
    updateSidebar();
    loadLevel(0, 0);
  });
}

function updateSidebar() {
  const tableBody = document.getElementById("levels-table-body");
  const modalList = document.getElementById("modal-levels-list");
  
  tableBody.innerHTML = "";
  modalList.innerHTML = "";

  VIM_LEVELS.forEach((level, idx) => {
    const isCompleted = isLevelCompleted(idx);
    
    // Create Table Row
    const row = document.createElement("tr");
    row.className = `level-row ${isCompleted ? "completed" : ""}`;
    row.id = `sidebar-level-${idx}`;
    if (idx === practiceState.currentLevelIdx) {
      row.classList.add("active");
    }

    // 1. Topic Cell
    const topicCell = document.createElement("td");
    topicCell.className = "cell-topic";
    topicCell.innerHTML = `<span class="level-name-label">${level.name}</span>`;
    topicCell.addEventListener("click", () => {
      loadLevel(idx, 0);
    });
    row.appendChild(topicCell);

    // 2. Subtopics Cell (clickable list of subtopics!)
    const subtopicsCell = document.createElement("td");
    subtopicsCell.className = "cell-subtopics";
    
    level.challenges.forEach((challenge, challengeIdx) => {
      const badge = document.createElement("span");
      badge.className = "subtopic-badge";

      if (isChallengeSolved(idx, challengeIdx)) {
        badge.classList.add("solved-subtopic");
        badge.textContent = `✓ ${challenge.subtopic}`;
      } else {
        badge.textContent = challenge.subtopic;
      }

      const isActiveChallenge = (idx === practiceState.currentLevelIdx && challengeIdx === practiceState.currentChallengeIdx);
      if (isActiveChallenge) {
        badge.classList.add("active-subtopic");
      }
      
      badge.addEventListener("click", (e) => {
        e.stopPropagation(); // prevent row click loading challenge 0
        loadLevel(idx, challengeIdx);
      });
      
      subtopicsCell.appendChild(badge);
    });
    row.appendChild(subtopicsCell);

    // 3. Status Cell
    const statusCell = document.createElement("td");
    statusCell.className = "cell-status";
    statusCell.textContent = isCompleted ? "[ok]" : "[  ]";
    row.appendChild(statusCell);

    tableBody.appendChild(row);

    // Modal grid cards (keep modal rendering intact)
    const card = document.createElement("div");
    card.className = `level-card ${isCompleted ? "completed" : ""}`;
    if (idx === practiceState.currentLevelIdx) card.classList.add("active");
    
    card.innerHTML = `
      <div class="level-card-status">${isCompleted ? "✓ Completed" : "○ Incomplete"}</div>
      <h3>${level.name}</h3>
      <p>${level.description}</p>
    `;
    card.addEventListener("click", () => {
      document.getElementById("level-modal").style.display = "none";
      loadLevel(idx, 0);
    });
    modalList.appendChild(card);
  });
}

function updateSidebarHighlights() {
  document.querySelectorAll(".level-row").forEach((el, idx) => {
    el.classList.remove("active");
    if (idx === practiceState.currentLevelIdx) {
      el.classList.add("active");
    }
  });
  
  // Update subtopic badges highlights
  document.querySelectorAll(".subtopic-badge").forEach(badge => {
    badge.classList.remove("active-subtopic");
  });
  
  // Find active row and add class to active badge
  const activeRow = document.getElementById(`sidebar-level-${practiceState.currentLevelIdx}`);
  if (activeRow) {
    const badges = activeRow.querySelectorAll(".subtopic-badge");
    if (badges[practiceState.currentChallengeIdx]) {
      badges[practiceState.currentChallengeIdx].classList.add("active-subtopic");
    }
  }
}
