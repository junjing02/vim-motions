// app.js - Vim Motions Game Engine (Comprehensive Edition)

// Game State
let currentState = {
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
  completedLevels: new Set(),
  activeKeys: new Set(), // Keys that are active/highlighted for the current level
};

// Keyboard layout mapping for visual display (QWERTY split layout layout keys)
const PHYSICAL_KEY_MAP = {
  // Left half
  "Escape": "key-esc", "q": "key-q", "w": "key-w", "e": "key-e", "r": "key-r", "t": "key-t",
  "a": "key-a", "s": "key-s", "d": "key-d", "f": "key-f", "g": "key-g",
  "z": "key-z", "x": "key-x", "c": "key-c", "v": "key-v", "b": "key-b",
  "Control": "key-ctrl-l", "Alt": "key-alt-l", "Shift": "key-shift-l", " ": "key-space-l",
  // Right half
  "y": "key-y", "u": "key-u", "i": "key-i", "o": "key-o", "p": "key-p", "Backspace": "key-bksp",
  "h": "key-h", "j": "key-j", "k": "key-k", "l": "key-l", ";": "key-semicolon", "'": "key-quote", "Enter": "key-enter",
  "n": "key-n", "m": "key-m", ",": "key-comma", ".": "key-dot", "/": "key-slash",
  " ": "key-space-r", "AltGraph": "key-alt-r", "Meta": "key-gui-r",
  // Layer shifted mappings for visual feedback
  "_": "key-dash", "$": "key-four", "*": "key-eight", "#": "key-three", "{": "key-bracket-l", "}": "key-bracket-r",
  "(": "key-nine", ")": "key-zero", "\"": "key-quote", "?": "key-slash"
};

// Initialize Application
window.addEventListener("DOMContentLoaded", () => {
  initKeyboard();
  loadLevel(0, 0);
  setupEventListeners();
  updateSidebar();
});

// Setup DOM Event Listeners
function setupEventListeners() {
  document.body.addEventListener("keydown", handleGlobalKeyDown);

  document.getElementById("level-select-btn").addEventListener("click", () => {
    document.getElementById("level-modal").style.display = "flex";
  });

  document.getElementById("close-modal").addEventListener("click", () => {
    document.getElementById("level-modal").style.display = "none";
  });

  document.getElementById("rel-lines-toggle").addEventListener("change", (e) => {
    currentState.relativeLines = e.target.checked;
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
      currentState.completedLevels.clear();
      currentState.score = 0;
      updateSidebar();
      loadLevel(0, 0);
    }
  });

  window.addEventListener("click", (e) => {
    const modal = document.getElementById("level-modal");
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });
}

// Generate the visual keyboard markup
function initKeyboard() {
  const leftHalf = document.querySelector(".keyboard-half.left-half");
  const rightHalf = document.querySelector(".keyboard-half.right-half");
  
  leftHalf.innerHTML = "";
  rightHalf.innerHTML = "";

  const leftRows = [
    [
      { code: "Escape", label: "Esc", id: "key-esc" },
      { code: "q", label: "Q", id: "key-q" },
      { code: "w", label: "W", id: "key-w" },
      { code: "e", label: "E", id: "key-e" },
      { code: "r", label: "R", id: "key-r" },
      { code: "t", label: "T", id: "key-t" }
    ],
    [
      { code: "Tab", label: "Tab", id: "key-tab" },
      { code: "a", label: "A", id: "key-a", home: true },
      { code: "s", label: "S", id: "key-s", home: true },
      { code: "d", label: "D", id: "key-d", home: true },
      { code: "f", label: "F", id: "key-f", home: true },
      { code: "g", label: "G", id: "key-g" }
    ],
    [
      { code: "Shift", label: "Shift", id: "key-shift-l" },
      { code: "z", label: "Z", id: "key-z" },
      { code: "x", label: "X", id: "key-x" },
      { code: "c", label: "C", id: "key-c" },
      { code: "v", label: "V", id: "key-v" },
      { code: "b", label: "B", id: "key-b" }
    ],
    [
      { code: "Control", label: "Ctrl", id: "key-ctrl-l" },
      { code: "Alt", label: "Alt", id: "key-alt-l" },
      { code: " ", label: "Space", id: "key-space-l", class: "thumb-key" }
    ]
  ];

  const rightRows = [
    [
      { code: "y", label: "Y", id: "key-y" },
      { code: "u", label: "U", id: "key-u" },
      { code: "i", label: "I", id: "key-i" },
      { code: "o", label: "O", id: "key-o" },
      { code: "p", label: "P", id: "key-p" },
      { code: "Backspace", label: "Bksp", id: "key-bksp" }
    ],
    [
      { code: "h", label: "H", id: "key-h" },
      { code: "j", label: "J", id: "key-j", home: true },
      { code: "k", label: "K", id: "key-k", home: true },
      { code: "l", label: "L", id: "key-l", home: true },
      { code: ";", label: ";", id: "key-semicolon", home: true },
      { code: "'", label: "'", id: "key-quote" },
      { code: "Enter", label: "Enter", id: "key-enter" }
    ],
    [
      { code: "Shift", label: "Shift", id: "key-shift-r" },
      { code: "n", label: "N", id: "key-n" },
      { code: "m", label: "M", id: "key-m" },
      { code: ",", label: ",", id: "key-comma" },
      { code: ".", label: ".", id: "key-dot" },
      { code: "/", label: "/", id: "key-slash" }
    ],
    [
      { code: " ", label: "Space", id: "key-space-r", class: "thumb-key" },
      { code: "Meta", label: "GUI", id: "key-gui-r" },
      { code: "AltGraph", label: "Alt", id: "key-alt-r" }
    ]
  ];

  renderHalfKeyboard(leftHalf, leftRows);
  renderHalfKeyboard(rightHalf, rightRows);
}

function renderHalfKeyboard(container, rows) {
  rows.forEach(row => {
    const rowEl = document.createElement("div");
    rowEl.className = "keyboard-row";
    row.forEach(key => {
      const keyEl = document.createElement("div");
      keyEl.className = `key-btn ${key.class || ""}`;
      keyEl.id = key.id;
      
      const keyInner = document.createElement("span");
      keyInner.textContent = key.label;
      keyEl.appendChild(keyInner);

      if (key.home) {
        keyEl.classList.add("home-cap");
        if (key.code === "f" || key.code === "j") {
          const bump = document.createElement("div");
          bump.className = "homing-bump";
          keyEl.appendChild(bump);
        }
      }

      rowEl.appendChild(keyEl);
    });
    container.appendChild(rowEl);
  });
}

function getActiveLevel() {
  return VIM_LEVELS[currentState.currentLevelIdx];
}

function getActiveChallenge() {
  return getActiveLevel().challenges[currentState.currentChallengeIdx];
}

// Load level and challenge
function loadLevel(levelIdx, challengeIdx) {
  currentState.currentLevelIdx = levelIdx;
  currentState.currentChallengeIdx = challengeIdx;
  currentState.mode = "normal";
  currentState.pendingKeys = "";
  currentState.digitBuffer = "";
  currentState.searchQuery = "";
  
  const level = getActiveLevel();
  const challenge = getActiveChallenge();

  // Load buffer
  currentState.buffer = challenge.text.split("\n");
  currentState.cursor = { ...challenge.start };
  currentState.visualAnchor = { ...challenge.start };

  // Set active keys for keyboard highlighting
  currentState.activeKeys.clear();
  extractActiveKeys(level.id);

  // Stats initializations
  currentState.levelKeystrokes = 0;
  currentState.levelStartTime = new Date();

  // Setup UI texts
  document.getElementById("level-title").textContent = level.name;
  document.getElementById("level-desc").textContent = level.description;
  document.getElementById("challenge-instr").innerHTML = challenge.instructions;
  document.getElementById("step-indicator").textContent = `Challenge ${challengeIdx + 1} of ${level.challenges.length}`;
  
  document.getElementById("split-tip-text").textContent = challenge.splitTip || "";

  renderEditor();
  highlightActiveKeysOnKeyboard();
  updateStatusLine();
  
  document.getElementById("hint-text").style.opacity = 0;
  updateSidebarHighlights();
}

function extractActiveKeys(levelId) {
  const map = {
    "basic-vim": ["h", "j", "k", "l", "w", "e", "b", "i", "a", "Escape"],
    "insert-pro": ["i", "a", "o", "o", "s", "x", "r", "escape"],
    "essential-motions": ["w", "e", "b", "0", "_", "$", "f", "f", "t", "t", ";", ","],
    "basic-operators": ["d", "c", "y", "p", "w", "j", "k", "escape"],
    "advanced-vertical": ["j", "k", "g", "g", "{", "}", "ctrl", "u", "d"],
    "search": ["/", "?", "n", "n", "*", "#", "escape", "enter"],
    "text-objects-brackets": ["d", "c", "i", "a", "{", "}", "(", ")", "[", "]"],
    "text-objects-quotes": ["d", "c", "i", "a", "\"", "'", "escape"],
    "text-objects-words": ["d", "c", "i", "a", "w"],
    "text-objects-paragraphs": ["d", "c", "i", "a", "p"],
    "text-objects-mega-review": ["d", "c", "i", "a", "w", "{", "}", "'", "\""],
    "visual-mode": ["v", "v", "d", "c", "y", "o", "escape"]
  };
  
  const keys = map[levelId] || [];
  keys.forEach(k => currentState.activeKeys.add(k));
}

function highlightActiveKeysOnKeyboard() {
  document.querySelectorAll(".key-btn").forEach(el => el.classList.remove("key-active"));
  
  currentState.activeKeys.forEach(key => {
    let keyId = PHYSICAL_KEY_MAP[key];
    if (!keyId) keyId = PHYSICAL_KEY_MAP[key.toLowerCase()];
    
    if (keyId) {
      const el = document.getElementById(keyId);
      if (el) el.classList.add("key-active");
    }
  });
}

// Check character visual selection state
function isCharSelected(lineIdx, colIdx) {
  if (currentState.mode === "visual") {
    const a = currentState.visualAnchor;
    const c = currentState.cursor;
    
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
  
  if (currentState.mode === "visual-line") {
    const minL = Math.min(currentState.visualAnchor.line, currentState.cursor.line);
    const maxL = Math.max(currentState.visualAnchor.line, currentState.cursor.line);
    return lineIdx >= minL && lineIdx <= maxL;
  }
  
  return false;
}

// Generate Relative or Absolute line numbers & characters
function renderEditor() {
  const container = document.getElementById("editor-lines");
  container.innerHTML = "";

  const challenge = getActiveChallenge();
  const cursorLine = currentState.cursor.line;
  const cursorCol = currentState.cursor.col;

  currentState.buffer.forEach((lineText, lineIdx) => {
    const lineEl = document.createElement("div");
    lineEl.className = "editor-line";
    if (lineIdx === cursorLine) {
      lineEl.classList.add("active-line");
    }

    const numEl = document.createElement("span");
    numEl.className = "line-number";
    
    if (currentState.relativeLines) {
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

    const renderLength = (currentState.mode === "insert") ? lineText.length + 1 : Math.max(1, lineText.length);
    
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

      if (challenge.type === "navigate" && challenge.target.line === lineIdx && challenge.target.col === colIdx) {
        charSpan.classList.add("char-target");
      }

      if (isCharSelected(lineIdx, colIdx)) {
        charSpan.classList.add("char-selected");
      }

      if (isCursorHere) {
        if (currentState.mode === "insert") {
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
  // Catch modifiers by themselves
  if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
    highlightPhysicalKey(e.key);
    return;
  }

  // Keyboard mapping and animations
  let keyStr = e.key;
  if (e.ctrlKey && e.key !== "Control") {
    keyStr = `Ctrl+${e.key.toLowerCase()}`;
  }
  highlightPhysicalKey(keyStr);

  currentState.levelKeystrokes++;
  currentState.totalKeystrokes++;

  // 1. Route based on Search mode input capture
  if (currentState.mode === "search") {
    handleSearchModeKey(e);
    renderEditor();
    updateStatusLine();
    checkChallengeCompletion();
    return;
  }

  // 2. Route based on Insert mode input capture
  if (currentState.mode === "insert") {
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

function highlightPhysicalKey(key) {
  let mappedId = PHYSICAL_KEY_MAP[key];
  if (!mappedId && key.length === 1) {
    mappedId = PHYSICAL_KEY_MAP[key.toLowerCase()];
  }
  
  if (mappedId) {
    const keyEl = document.getElementById(mappedId);
    if (keyEl) {
      keyEl.classList.add("key-pressed");
      setTimeout(() => {
        keyEl.classList.remove("key-pressed");
      }, 150);
    }
  }
}

function exitInsertMode() {
  currentState.mode = "normal";
  const lineText = currentState.buffer[currentState.cursor.line];
  if (currentState.cursor.col >= lineText.length && lineText.length > 0) {
    currentState.cursor.col = lineText.length - 1;
  }
}

function handleInsertModeKey(e) {
  const lineIdx = currentState.cursor.line;
  const colIdx = currentState.cursor.col;
  let lineText = currentState.buffer[lineIdx];

  if (e.key === "Backspace") {
    if (colIdx > 0) {
      currentState.buffer[lineIdx] = lineText.slice(0, colIdx - 1) + lineText.slice(colIdx);
      currentState.cursor.col--;
    } else if (lineIdx > 0) {
      const prevLineText = currentState.buffer[lineIdx - 1];
      currentState.cursor.col = prevLineText.length;
      currentState.buffer[lineIdx - 1] = prevLineText + lineText;
      currentState.buffer.splice(lineIdx, 1);
      currentState.cursor.line--;
    }
  } else if (e.key === "Enter") {
    const before = lineText.slice(0, colIdx);
    const after = lineText.slice(colIdx);
    currentState.buffer[lineIdx] = before;
    currentState.buffer.splice(lineIdx + 1, 0, after);
    currentState.cursor.line++;
    currentState.cursor.col = 0;
  } else if (e.key.length === 1) {
    currentState.buffer[lineIdx] = lineText.slice(0, colIdx) + e.key + lineText.slice(colIdx);
    currentState.cursor.col++;
  }
}

// Normal Mode Command Controller (Handles digits, modifiers, visual range toggling)
function handleNormalOrVisualModeKey(key) {
  // If waiting for modifier arguments (like f, t, r, d, c)
  if (currentState.pendingKeys) {
    processPendingCommand(key);
    return;
  }

  // Digits buffer for multipliers (Normal mode only)
  if (currentState.mode === "normal") {
    if (/^[1-9]$/.test(key) || (currentState.digitBuffer !== "" && key === "0")) {
      currentState.digitBuffer += key;
      return;
    }
  }

  const multiplier = currentState.digitBuffer ? parseInt(currentState.digitBuffer) : 1;
  currentState.digitBuffer = ""; // Reset count buffer

  const lineText = currentState.buffer[currentState.cursor.line];

  switch (key) {
    // Esc exits visual modes to normal
    case "Escape":
      currentState.mode = "normal";
      break;

    // Direct motions
    case "h":
      currentState.cursor.col = Math.max(0, currentState.cursor.col - multiplier);
      break;
    case "l":
      const maxCol = Math.max(0, lineText.length - 1);
      currentState.cursor.col = Math.min(maxCol, currentState.cursor.col + multiplier);
      break;
    case "j":
      if (currentState.cursor.line < currentState.buffer.length - 1) {
        currentState.cursor.line = Math.min(currentState.buffer.length - 1, currentState.cursor.line + multiplier);
        clipCursorColumn();
      }
      break;
    case "k":
      if (currentState.cursor.line > 0) {
        currentState.cursor.line = Math.max(0, currentState.cursor.line - multiplier);
        clipCursorColumn();
      }
      break;

    // Word Jumps
    case "w":
      for (let i = 0; i < multiplier; i++) {
        currentState.cursor = getNextWordStart(currentState.buffer, currentState.cursor.line, currentState.cursor.col);
      }
      break;
    case "e":
      for (let i = 0; i < multiplier; i++) {
        currentState.cursor = getNextWordEnd(currentState.buffer, currentState.cursor.line, currentState.cursor.col);
      }
      break;
    case "b":
      for (let i = 0; i < multiplier; i++) {
        currentState.cursor = getPrevWordStart(currentState.buffer, currentState.cursor.line, currentState.cursor.col);
      }
      break;

    // WORD Jumps (Capitals)
    case "W":
      for (let i = 0; i < multiplier; i++) {
        currentState.cursor = getNextWORDStart(currentState.buffer, currentState.cursor.line, currentState.cursor.col);
      }
      break;
    case "E":
      for (let i = 0; i < multiplier; i++) {
        currentState.cursor = getNextWORDEnd(currentState.buffer, currentState.cursor.line, currentState.cursor.col);
      }
      break;
    case "B":
      for (let i = 0; i < multiplier; i++) {
        currentState.cursor = getPrevWORDStart(currentState.buffer, currentState.cursor.line, currentState.cursor.col);
      }
      break;

    // Line boundary motions
    case "0":
      currentState.cursor.col = 0;
      break;
    case "^":
    case "_":
      const matchStart = lineText.match(/^\s*/);
      currentState.cursor.col = matchStart ? matchStart[0].length : 0;
      break;
    case "$":
      currentState.cursor.col = Math.max(0, lineText.length - 1);
      break;

    // Character search prefixes
    case "f":
    case "F":
    case "t":
    case "T":
    case "r":
      currentState.pendingKeys = key;
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
      currentState.mode = "search";
      currentState.searchDirection = key;
      currentState.searchQuery = "";
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
      currentState.pendingKeys = "g";
      break;
    case "G":
      currentState.cursor.line = currentState.buffer.length - 1;
      currentState.cursor.col = 0;
      clipCursorColumn();
      break;
    case "{":
      for (let i = 0; i < multiplier; i++) {
        let pl = currentState.cursor.line - 1;
        while (pl > 0 && currentState.buffer[pl].trim().length > 0) pl--;
        currentState.cursor.line = Math.max(0, pl);
      }
      currentState.cursor.col = 0;
      break;
    case "}":
      for (let i = 0; i < multiplier; i++) {
        let nl = currentState.cursor.line + 1;
        while (nl < currentState.buffer.length - 1 && currentState.buffer[nl].trim().length > 0) nl++;
        currentState.cursor.line = Math.min(currentState.buffer.length - 1, nl);
      }
      currentState.cursor.col = 0;
      break;

    // Scroll window
    case "Ctrl+d":
      currentState.cursor.line = Math.min(currentState.buffer.length - 1, currentState.cursor.line + multiplier * 4);
      currentState.cursor.col = 0;
      break;
    case "Ctrl+u":
      currentState.cursor.line = Math.max(0, currentState.cursor.line - multiplier * 4);
      currentState.cursor.col = 0;
      break;

    // Visual Mode Triggers
    case "v":
      if (currentState.mode === "visual") {
        currentState.mode = "normal";
      } else {
        currentState.mode = "visual";
        currentState.visualAnchor = { ...currentState.cursor };
      }
      break;
    case "V":
      if (currentState.mode === "visual-line") {
        currentState.mode = "normal";
      } else {
        currentState.mode = "visual-line";
        currentState.visualAnchor = { ...currentState.cursor };
      }
      break;
    case "o":
      // Swap selection cursor ends in Visual Mode
      if (currentState.mode === "visual" || currentState.mode === "visual-line") {
        const temp = { ...currentState.cursor };
        currentState.cursor = { ...currentState.visualAnchor };
        currentState.visualAnchor = temp;
      }
      break;

    // Editing Operators (Normal and Visual Mode routing)
    case "d":
    case "c":
      if (currentState.mode === "visual" || currentState.mode === "visual-line") {
        executeVisualOperation(key);
      } else {
        currentState.pendingKeys = key;
      }
      break;
    case "y":
      if (currentState.mode === "visual" || currentState.mode === "visual-line") {
        executeVisualOperation(key);
      } else {
        currentState.pendingKeys = key;
      }
      break;
    case "p":
      pasteClipboard(false, multiplier);
      break;
    case "P":
      pasteClipboard(true, multiplier);
      break;

    case "x":
      if (currentState.mode === "visual" || currentState.mode === "visual-line") {
        executeVisualOperation("d");
      } else {
        for (let i = 0; i < multiplier; i++) {
          const lText = currentState.buffer[currentState.cursor.line];
          if (lText.length > 0) {
            currentState.buffer[currentState.cursor.line] = lText.slice(0, currentState.cursor.col) + lText.slice(currentState.cursor.col + 1);
            clipCursorColumn();
          }
        }
      }
      break;

    case "s":
      // Substitute char (delete and insert)
      const lText = currentState.buffer[currentState.cursor.line];
      if (lText.length > 0) {
        currentState.buffer[currentState.cursor.line] = lText.slice(0, currentState.cursor.col) + lText.slice(currentState.cursor.col + 1);
        currentState.mode = "insert";
      }
      break;

    // Normal Insert Modes
    case "i":
      currentState.mode = "insert";
      break;
    case "a":
      currentState.mode = "insert";
      if (lineText.length > 0) currentState.cursor.col++;
      break;
    case "I":
      const nonBlankMatch = lineText.match(/^\s*/);
      currentState.cursor.col = nonBlankMatch ? nonBlankMatch[0].length : 0;
      currentState.mode = "insert";
      break;
    case "A":
      currentState.cursor.col = lineText.length;
      currentState.mode = "insert";
      break;
    case "o":
      currentState.buffer.splice(currentState.cursor.line + 1, 0, "");
      currentState.cursor.line++;
      currentState.cursor.col = 0;
      currentState.mode = "insert";
      break;
    case "O":
      currentState.buffer.splice(currentState.cursor.line, 0, "");
      currentState.cursor.col = 0;
      currentState.mode = "insert";
      break;
  }
}

// Handles input characters when typing a search pattern
function handleSearchModeKey(e) {
  if (e.key === "Enter") {
    currentState.mode = "normal";
    if (currentState.searchQuery !== "") {
      currentState.lastSearch = { query: currentState.searchQuery, direction: currentState.searchDirection };
      executeSearchPattern(currentState.searchQuery, currentState.searchDirection, currentState.cursor.line, currentState.cursor.col);
    }
  } else if (e.key === "Escape") {
    currentState.mode = "normal";
    currentState.searchQuery = "";
  } else if (e.key === "Backspace") {
    if (currentState.searchQuery.length > 0) {
      currentState.searchQuery = currentState.searchQuery.slice(0, -1);
    } else {
      currentState.mode = "normal";
    }
  } else if (e.key.length === 1) {
    currentState.searchQuery += e.key;
  }
}

// Executes Search query search and places cursor
function executeSearchPattern(query, direction, fromLine, fromCol, count = 1) {
  if (!query) return;
  let matches = [];
  
  currentState.buffer.forEach((lineText, lineIdx) => {
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
    currentState.cursor.line = found.line;
    currentState.cursor.col = found.col;
  }
}

function repeatSearchPattern(reverse = false, count = 1) {
  const search = currentState.lastSearch;
  if (!search.query) return;

  let dir = search.direction;
  if (reverse) {
    dir = (dir === "/") ? "?" : "/";
  }

  executeSearchPattern(search.query, dir, currentState.cursor.line, currentState.cursor.col, count);
}

function quickWordSearch(reverse = false) {
  const lineText = currentState.buffer[currentState.cursor.line];
  const col = currentState.cursor.col;
  if (lineText.length === 0) return;

  let start = col;
  while (start > 0 && /[a-zA-Z0-9_]/.test(lineText[start - 1])) start--;
  let end = col;
  while (end < lineText.length - 1 && /[a-zA-Z0-9_]/.test(lineText[end + 1])) end++;

  const word = lineText.slice(start, end + 1);
  if (!/^[a-zA-Z0-9_]+$/.test(word)) return;

  currentState.lastSearch = { query: word, direction: reverse ? "?" : "/" };
  // Search from next/prev character to avoid self-match
  const nextCol = reverse ? Math.max(0, start - 1) : Math.min(lineText.length - 1, end + 1);
  executeSearchPattern(word, reverse ? "?" : "/", currentState.cursor.line, nextCol);
}

// Multi-key routing controller (operators like d, c)
function processPendingCommand(key) {
  const pending = currentState.pendingKeys;
  currentState.pendingKeys = ""; // Clear buffer

  // 1. gg movement
  if (pending === "g") {
    if (key === "g") {
      currentState.cursor.line = 0;
      currentState.cursor.col = 0;
    }
    return;
  }

  // 2. inline search (f, t, F, T)
  if (["f", "F", "t", "T"].includes(pending)) {
    currentState.searchCommand = { type: pending, char: key };
    executeCharacterSearch(pending, key);
    return;
  }

  // 3. character replacement
  if (pending === "r") {
    const lineText = currentState.buffer[currentState.cursor.line];
    if (lineText.length > 0) {
      currentState.buffer[currentState.cursor.line] = 
        lineText.slice(0, currentState.cursor.col) + key + lineText.slice(currentState.cursor.col + 1);
    }
    return;
  }

  // 4. operators d or c
  if (pending === "d" || pending === "c") {
    // dd or cc line operations
    if (key === pending) {
      if (pending === "d") {
        currentState.clipboard = { type: "line", content: [currentState.buffer[currentState.cursor.line]] };
        currentState.buffer.splice(currentState.cursor.line, 1);
        if (currentState.buffer.length === 0) currentState.buffer = [""];
        if (currentState.cursor.line >= currentState.buffer.length) {
          currentState.cursor.line = currentState.buffer.length - 1;
        }
        currentState.cursor.col = 0;
      } else if (pending === "c") {
        currentState.buffer[currentState.cursor.line] = "";
        currentState.cursor.col = 0;
        currentState.mode = "insert";
      }
      return;
    }

    // D deletes to end of line
    if (key === "D") {
      deleteToLineEnd(pending);
      return;
    }

    // dj or dk multi-line deletes
    if (key === "j" && currentState.cursor.line < currentState.buffer.length - 1) {
      const deleteRange = [currentState.buffer[currentState.cursor.line], currentState.buffer[currentState.cursor.line + 1]];
      currentState.clipboard = { type: "line", content: deleteRange };
      currentState.buffer.splice(currentState.cursor.line, 2);
      if (currentState.buffer.length === 0) currentState.buffer = [""];
      if (currentState.cursor.line >= currentState.buffer.length) {
        currentState.cursor.line = currentState.buffer.length - 1;
      }
      currentState.cursor.col = 0;
      return;
    }
    if (key === "k" && currentState.cursor.line > 0) {
      const deleteRange = [currentState.buffer[currentState.cursor.line - 1], currentState.buffer[currentState.cursor.line]];
      currentState.clipboard = { type: "line", content: deleteRange };
      currentState.buffer.splice(currentState.cursor.line - 1, 2);
      currentState.cursor.line--;
      if (currentState.buffer.length === 0) currentState.buffer = [""];
      currentState.cursor.col = 0;
      return;
    }

    // waiting for inner/around text object (di... or ci...)
    if (key === "i" || key === "a") {
      currentState.pendingKeys = pending + key;
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
      currentState.clipboard = { type: "line", content: [currentState.buffer[currentState.cursor.line]] };
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
  const lineText = currentState.buffer[currentState.cursor.line];
  const currentCol = currentState.cursor.col;
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
    currentState.cursor.col = foundCol;
  }
}

function repeatCharacterSearch(reverse = false, count = 1) {
  const search = currentState.searchCommand;
  if (!search.type || !search.char) return;

  let type = search.type;
  if (reverse) {
    const swaps = { "f": "F", "F": "f", "t": "T", "T": "t" };
    type = swaps[type];
  }

  executeCharacterSearch(type, search.char, count);
}

function deleteMotion(op, motionFunc) {
  const targetCursor = motionFunc(currentState.buffer, currentState.cursor.line, currentState.cursor.col);
  
  if (targetCursor.line === currentState.cursor.line) {
    const lineText = currentState.buffer[currentState.cursor.line];
    const minCol = Math.min(currentState.cursor.col, targetCursor.col);
    const maxCol = Math.max(currentState.cursor.col, targetCursor.col);
    
    currentState.buffer[currentState.cursor.line] = lineText.slice(0, minCol) + lineText.slice(maxCol);
    currentState.cursor.col = minCol;
    clipCursorColumn();

    if (op === "c") {
      currentState.mode = "insert";
    }
  }
}

function deleteToLineEnd(op) {
  const lineText = currentState.buffer[currentState.cursor.line];
  currentState.buffer[currentState.cursor.line] = lineText.slice(0, currentState.cursor.col);
  if (op === "c") {
    currentState.mode = "insert";
  } else {
    clipCursorColumn();
  }
}

// Copy-Paste
function pasteClipboard(above = false, count = 1) {
  const clip = currentState.clipboard;
  if (!clip.content) return;

  for (let c = 0; c < count; c++) {
    const lineIdx = currentState.cursor.line;
    if (clip.type === "line") {
      if (above) {
        currentState.buffer.splice(lineIdx, 0, ...clip.content);
        currentState.cursor.line = lineIdx;
      } else {
        currentState.buffer.splice(lineIdx + 1, 0, ...clip.content);
        currentState.cursor.line = lineIdx + clip.content.length;
      }
      currentState.cursor.col = 0;
    } else {
      // char paste
      const lText = currentState.buffer[lineIdx];
      const col = currentState.cursor.col;
      if (above) {
        currentState.buffer[lineIdx] = lText.slice(0, col) + clip.content + lText.slice(col);
        currentState.cursor.col = col + clip.content.length - 1;
      } else {
        currentState.buffer[lineIdx] = lText.slice(0, col + 1) + clip.content + lText.slice(col + 1);
        currentState.cursor.col = col + clip.content.length;
      }
    }
  }
}

// Visual Mode Operators
function executeVisualOperation(op) {
  const a = currentState.visualAnchor;
  const c = currentState.cursor;
  const minL = Math.min(a.line, c.line);
  const maxL = Math.max(a.line, c.line);

  if (currentState.mode === "visual") {
    let content = "";
    if (minL === maxL) {
      const minC = Math.min(a.col, c.col);
      const maxC = Math.max(a.col, c.col);
      const lineText = currentState.buffer[minL];
      content = lineText.slice(minC, maxC + 1);
      
      if (op === "d" || op === "c") {
        currentState.buffer[minL] = lineText.slice(0, minC) + lineText.slice(maxC + 1);
        currentState.cursor.col = minC;
      }
    } else {
      // multi-line visual slice
      const startCol = (minL === a.line) ? a.col : c.col;
      const endCol = (maxL === a.line) ? a.col : c.col;
      
      const headText = currentState.buffer[minL].slice(0, startCol);
      const tailText = currentState.buffer[maxL].slice(endCol + 1);
      
      content = currentState.buffer[minL].slice(startCol) + "\n";
      for (let i = minL + 1; i < maxL; i++) {
        content += currentState.buffer[i] + "\n";
      }
      content += currentState.buffer[maxL].slice(0, endCol + 1);

      if (op === "d" || op === "c") {
        currentState.buffer[minL] = headText + tailText;
        currentState.buffer.splice(minL + 1, maxL - minL);
        currentState.cursor.line = minL;
        currentState.cursor.col = startCol;
      }
    }

    currentState.clipboard = { type: "char", content: content };
    currentState.mode = "normal";
    if (op === "c") currentState.mode = "insert";
    clipCursorColumn();
  } 
  
  else if (currentState.mode === "visual-line") {
    const lines = currentState.buffer.slice(minL, maxL + 1);
    currentState.clipboard = { type: "line", content: lines };

    if (op === "d" || op === "c") {
      currentState.buffer.splice(minL, maxL - minL + 1);
      if (currentState.buffer.length === 0) currentState.buffer = [""];
      currentState.cursor.line = Math.min(currentState.buffer.length - 1, minL);
      currentState.cursor.col = 0;
    }

    currentState.mode = "normal";
    if (op === "c") {
      currentState.buffer.splice(currentState.cursor.line, 0, "");
      currentState.mode = "insert";
    }
  }
}

// --- Text Objects Algorithms ---

function clipCursorColumn() {
  const lineText = currentState.buffer[currentState.cursor.line];
  const maxCol = Math.max(0, lineText.length - 1);
  if (currentState.cursor.col > maxCol) {
    currentState.cursor.col = maxCol;
  }
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
  const lineText = currentState.buffer[currentState.cursor.line];
  const col = currentState.cursor.col;
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

  currentState.buffer[currentState.cursor.line] = lineText.slice(0, start) + lineText.slice(end + 1);
  currentState.cursor.col = start;
  clipCursorColumn();

  if (op === "c") {
    currentState.mode = "insert";
  }
}

function deleteTextObjectQuotes(op, quoteChar, around = false) {
  const lineText = currentState.buffer[currentState.cursor.line];
  const col = currentState.cursor.col;

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
    currentState.buffer[currentState.cursor.line] = 
      lineText.slice(0, leftQuoteIdx) + lineText.slice(rightQuoteIdx + 1);
    currentState.cursor.col = leftQuoteIdx;
  } else {
    currentState.buffer[currentState.cursor.line] = 
      lineText.slice(0, leftQuoteIdx + 1) + lineText.slice(rightQuoteIdx);
    currentState.cursor.col = leftQuoteIdx + 1;
  }
  
  if (op === "c") {
    currentState.mode = "insert";
  } else {
    clipCursorColumn();
  }
}

function deleteInnerBrackets(op, openChar, closeChar, around = false) {
  const lineText = currentState.buffer[currentState.cursor.line];
  const col = currentState.cursor.col;
  
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
      currentState.buffer[currentState.cursor.line] = 
        lineText.slice(0, leftIdx) + lineText.slice(rightIdx + 1);
      currentState.cursor.col = leftIdx;
    } else {
      currentState.buffer[currentState.cursor.line] = 
        lineText.slice(0, leftIdx + 1) + lineText.slice(rightIdx);
      currentState.cursor.col = leftIdx + 1;
    }
    
    if (op === "c") {
      currentState.mode = "insert";
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
  const range = getParagraphRange(currentState.buffer, currentState.cursor.line);
  let count = range.end - range.start + 1;
  let start = range.start;

  if (around) {
    // Also include one empty line
    if (range.end < currentState.buffer.length - 1 && currentState.buffer[range.end + 1].trim().length === 0) {
      count++;
    } else if (range.start > 0 && currentState.buffer[range.start - 1].trim().length === 0) {
      start--;
      count++;
    }
  }

  currentState.buffer.splice(start, count);
  if (currentState.buffer.length === 0) {
    currentState.buffer = [""];
  }

  currentState.cursor.line = Math.min(currentState.buffer.length - 1, start);
  currentState.cursor.col = 0;
  clipCursorColumn();

  if (op === "c") {
    currentState.buffer.splice(currentState.cursor.line, 0, "");
    currentState.mode = "insert";
  }
}

// Update Neovim-like statusline
function updateStatusLine() {
  const modeEl = document.getElementById("vim-status-mode");
  const posEl = document.getElementById("vim-status-pos");
  const percentEl = document.getElementById("vim-status-percent");
  const keysEl = document.getElementById("vim-status-keys");

  // Mode Indicator
  if (currentState.mode === "normal") {
    modeEl.textContent = " NORMAL ";
    modeEl.className = "status-mode mode-normal";
  } else if (currentState.mode === "insert") {
    modeEl.textContent = " INSERT ";
    modeEl.className = "status-mode mode-insert";
  } else if (currentState.mode === "visual") {
    modeEl.textContent = " VISUAL ";
    modeEl.className = "status-mode mode-normal"; // uses high contrast
  } else if (currentState.mode === "visual-line") {
    modeEl.textContent = " V-LINE ";
    modeEl.className = "status-mode mode-normal";
  } else if (currentState.mode === "search") {
    modeEl.textContent = " SEARCH ";
    modeEl.className = "status-mode mode-insert";
  }

  // Position
  const line = currentState.cursor.line + 1;
  const col = currentState.cursor.col + 1;
  posEl.textContent = `${line}:${col}`;

  // File scroll percentage
  const totalLines = currentState.buffer.length;
  const percent = Math.round((line / totalLines) * 100);
  percentEl.textContent = `${percent}%`;

  // Key buffer indicator: shows digit multiplier, pending command buffers, or active search pattern input
  if (currentState.mode === "search") {
    keysEl.textContent = `${currentState.searchDirection}${currentState.searchQuery}`;
  } else {
    keysEl.textContent = `${currentState.digitBuffer}${currentState.pendingKeys}`;
  }
}

// Check if current challenge win conditions are satisfied
function checkChallengeCompletion() {
  const challenge = getActiveChallenge();
  
  if (challenge.type === "navigate") {
    if (currentState.cursor.line === challenge.target.line && currentState.cursor.col === challenge.target.col) {
      advanceChallenge();
    }
  } else if (challenge.type === "edit") {
    const currentText = currentState.buffer.join("\n").trim();
    const targetText = challenge.targetText.trim();
    
    // Normal mode check is essential unless the challenge is v + esc navigation which does not edit
    if (currentText === targetText && currentState.mode === "normal") {
      advanceChallenge();
    }
  }
}

function advanceChallenge() {
  triggerSuccessAnimation();

  const challengeTimeSec = (new Date() - currentState.levelStartTime) / 1000;
  const challengeScore = Math.max(10, Math.round(100 - (currentState.levelKeystrokes * 2) - challengeTimeSec));
  currentState.score += challengeScore;
  
  updateStatsDisplay(challengeScore);

  const level = getActiveLevel();
  if (currentState.currentChallengeIdx < level.challenges.length - 1) {
    currentState.currentChallengeIdx++;
    loadLevel(currentState.currentLevelIdx, currentState.currentChallengeIdx);
  } else {
    currentState.completedLevels.add(currentState.currentLevelIdx);
    updateSidebar();
    
    if (currentState.currentLevelIdx < VIM_LEVELS.length - 1) {
      showLevelCompletePopup(level.name, challengeScore);
    } else {
      showGameCompletePopup();
    }
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
  document.getElementById("stat-score").textContent = currentState.score;
  
  const efficiency = Math.max(30, Math.min(100, Math.round(100 - (currentState.levelKeystrokes * 1.5))));
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
        <div><span>Keystrokes:</span> <strong>${currentState.levelKeystrokes}</strong></div>
      </div>
      <button id="next-level-btn" class="glow-btn">Next Level</button>
    </div>
  `;
  document.body.appendChild(overlay);
  
  document.getElementById("next-level-btn").focus();
  document.getElementById("next-level-btn").addEventListener("click", () => {
    overlay.remove();
    loadLevel(currentState.currentLevelIdx + 1, 0);
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
      <p class="win-score">Total Score: <strong>${currentState.score}</strong></p>
      <button id="restart-game-btn" class="glow-btn">Play Again</button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById("restart-game-btn").focus();
  document.getElementById("restart-game-btn").addEventListener("click", () => {
    overlay.remove();
    currentState.completedLevels.clear();
    currentState.score = 0;
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
    const isCompleted = currentState.completedLevels.has(idx);
    
    // Create Table Row
    const row = document.createElement("tr");
    row.className = `level-row ${isCompleted ? "completed" : ""}`;
    row.id = `sidebar-level-${idx}`;
    if (idx === currentState.currentLevelIdx) {
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
      badge.textContent = challenge.subtopic;
      
      const isActiveChallenge = (idx === currentState.currentLevelIdx && challengeIdx === currentState.currentChallengeIdx);
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
    if (idx === currentState.currentLevelIdx) card.classList.add("active");
    
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
    if (idx === currentState.currentLevelIdx) {
      el.classList.add("active");
    }
  });
  
  // Update subtopic badges highlights
  document.querySelectorAll(".subtopic-badge").forEach(badge => {
    badge.classList.remove("active-subtopic");
  });
  
  // Find active row and add class to active badge
  const activeRow = document.getElementById(`sidebar-level-${currentState.currentLevelIdx}`);
  if (activeRow) {
    const badges = activeRow.querySelectorAll(".subtopic-badge");
    if (badges[currentState.currentChallengeIdx]) {
      badges[currentState.currentChallengeIdx].classList.add("active-subtopic");
    }
  }
}
