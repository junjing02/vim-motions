// app.js - Cheatsheet controller: tool tabs, category nav, live search, and the shared
// split-keyboard visualizer (used both for shortcut hover-highlight here and by practice.js
// during the Neovim motions drill).

// Keep in sync with the "version" field in package.json — shown in the page footer.
const APP_VERSION = "2.1.1";

let currentTool = "neovim";

// Keyboard layout mapping for visual display (QWERTY split layout keys)
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

// Short-form aliases used in cheatsheet copy that don't match PHYSICAL_KEY_MAP's raw KeyboardEvent.key names
const KEY_ALIASES = { "Esc": "Escape", "Ctrl": "Control", "Cmd": "Meta" };

function resolveSingleKeyId(part) {
  const normalized = KEY_ALIASES[part] || part;
  return PHYSICAL_KEY_MAP[normalized] || PHYSICAL_KEY_MAP[normalized.toLowerCase()] || null;
}

// Resolves a display token (e.g. "g", "Ctrl+v", "Prefix", "{motion}") to physical key element ids.
// Unmapped/placeholder tokens (digits, "{char}", "Arrow", "h/j/k/l") resolve to [] and are skipped
// gracefully rather than erroring — not every cheatsheet token corresponds to a single physical key.
function keyTokenToElementIds(token, prefixKey) {
  if (token === "Prefix") {
    return keyTokenToElementIds(prefixKey || "Ctrl+b", null);
  }
  if (token.includes("+")) {
    return token.split("+").map(resolveSingleKeyId).filter(Boolean);
  }
  const id = resolveSingleKeyId(token);
  return id ? [id] : [];
}

function setKeyboardActiveKeys(tokens, prefixKey) {
  clearKeyboardActiveKeys();
  const ids = new Set();
  (tokens || []).forEach(token => {
    keyTokenToElementIds(String(token), prefixKey).forEach(id => ids.add(id));
  });
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("key-active");
  });
}

function clearKeyboardActiveKeys() {
  document.querySelectorAll(".key-btn").forEach(el => el.classList.remove("key-active"));
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

// Generate the visual keyboard markup (built once; shared by the cheatsheet hover-highlight
// and the practice-mode key-press animation)
function initKeyboard() {
  const leftHalf = document.getElementById("kb-left-half");
  const rightHalf = document.getElementById("kb-right-half");

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

// --- Cheatsheet rendering ---

function renderTool(toolId) {
  currentTool = toolId;
  const tool = CHEATSHEETS[toolId];

  document.querySelectorAll(".tool-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tool === toolId);
  });

  document.getElementById("tool-tagline").textContent = tool.tagline;

  const banner = document.getElementById("prefix-banner");
  if (tool.prefixKey) {
    banner.innerHTML = `Prefix key: <span class="key-cap">${tool.prefixKey}</span> &mdash; press this combo first, then the shortcut key shown below.`;
    banner.style.display = "flex";
  } else {
    banner.style.display = "none";
  }

  renderCategoryNav(tool);
  renderShortcutSections(tool);
  renderPluginsGrid(tool);

  document.getElementById("search-input").value = "";
  filterCheatsheet("");
  clearKeyboardActiveKeys();
  document.getElementById("keyboard-context-label").textContent = "Hover a shortcut to see it on the keyboard";

  document.getElementById("practice-toggle-btn").style.display = (toolId === "neovim") ? "" : "none";

  document.getElementById("cheatsheet-board").scrollTop = 0;
}

function renderCategoryNav(tool) {
  const nav = document.getElementById("category-nav");
  nav.innerHTML = "";

  tool.categories.forEach((cat, idx) => {
    const item = document.createElement("div");
    item.className = "category-nav-item" + (idx === 0 ? " active" : "");
    item.textContent = cat.title;
    item.addEventListener("click", () => {
      document.querySelectorAll(".category-nav-item").forEach(el => el.classList.remove("active"));
      item.classList.add("active");
      const target = document.getElementById(`cat-${cat.id}`);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    nav.appendChild(item);
  });

  const pluginsNavItem = document.createElement("div");
  pluginsNavItem.className = "category-nav-item category-nav-plugins";
  pluginsNavItem.textContent = "Recommended Plugins";
  pluginsNavItem.addEventListener("click", () => {
    document.querySelectorAll(".category-nav-item").forEach(el => el.classList.remove("active"));
    pluginsNavItem.classList.add("active");
    document.getElementById("plugins-section").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  nav.appendChild(pluginsNavItem);
}

function renderShortcutSections(tool) {
  const container = document.getElementById("shortcut-sections");
  container.innerHTML = "";

  tool.categories.forEach(cat => {
    const section = document.createElement("section");
    section.className = "shortcut-category";
    section.id = `cat-${cat.id}`;

    const heading = document.createElement("h3");
    heading.className = "category-heading";
    heading.textContent = cat.title;
    section.appendChild(heading);

    const list = document.createElement("div");
    list.className = "shortcut-list";

    cat.shortcuts.forEach(sc => {
      const card = document.createElement("div");
      card.className = "shortcut-card";
      card.dataset.search = (sc.desc + " " + (sc.cmd || (sc.keys || []).join(" "))).toLowerCase();

      const keysEl = document.createElement("div");
      keysEl.className = "shortcut-keys";
      if (sc.cmd) {
        const codeEl = document.createElement("code");
        codeEl.className = "shortcut-cmd";
        codeEl.textContent = sc.cmd;
        keysEl.appendChild(codeEl);
      } else {
        sc.keys.forEach(k => {
          const cap = document.createElement("span");
          cap.className = "key-cap" + (k === "Prefix" ? " key-cap-prefix" : "");
          cap.textContent = k;
          keysEl.appendChild(cap);
        });
      }

      const descEl = document.createElement("div");
      descEl.className = "shortcut-desc";
      descEl.textContent = sc.desc;

      card.appendChild(keysEl);
      card.appendChild(descEl);

      if (sc.keys) {
        card.addEventListener("mouseenter", () => {
          setKeyboardActiveKeys(sc.keys, tool.prefixKey);
          document.getElementById("keyboard-context-label").textContent = sc.desc;
        });
        card.addEventListener("mouseleave", () => {
          clearKeyboardActiveKeys();
          document.getElementById("keyboard-context-label").textContent = "Hover a shortcut to see it on the keyboard";
        });
      }

      list.appendChild(card);
    });

    section.appendChild(list);
    container.appendChild(section);
  });
}

function renderPluginsGrid(tool) {
  const grid = document.getElementById("plugins-grid");
  grid.innerHTML = "";

  tool.plugins.forEach(p => {
    const card = document.createElement("a");
    card.className = "plugin-card";
    card.href = p.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.dataset.search = (p.name + " " + p.tagline).toLowerCase();
    card.innerHTML = `
      <h3>${p.name}</h3>
      <p>${p.tagline}</p>
      <span class="plugin-link">View &rarr;</span>
    `;
    grid.appendChild(card);
  });
}

// --- Live search ---

function filterCheatsheet(query) {
  const q = query.trim().toLowerCase();
  let anyVisible = false;

  document.querySelectorAll(".shortcut-category").forEach(cat => {
    let catHasMatch = false;
    cat.querySelectorAll(".shortcut-card").forEach(card => {
      const match = !q || card.dataset.search.includes(q);
      card.classList.toggle("search-hidden", !match);
      if (match) catHasMatch = true;
    });
    cat.classList.toggle("search-hidden", !catHasMatch);
    if (catHasMatch) anyVisible = true;
  });

  let anyPluginMatch = false;
  document.querySelectorAll(".plugin-card").forEach(card => {
    const match = !q || card.dataset.search.includes(q);
    card.classList.toggle("search-hidden", !match);
    if (match) anyPluginMatch = true;
  });
  const pluginsSection = document.getElementById("plugins-section");
  pluginsSection.classList.toggle("search-hidden", !anyPluginMatch);
  if (anyPluginMatch) anyVisible = true;

  document.getElementById("no-results-msg").classList.toggle("search-hidden", !q || anyVisible);
}

// --- Practice mode toggle ---

function togglePracticeMode() {
  const cheatsheetView = document.getElementById("cheatsheet-view");
  const practiceView = document.getElementById("practice-view");
  const headerCheatsheet = document.getElementById("header-cheatsheet-controls");
  const headerPractice = document.getElementById("header-practice-controls");
  const toggleBtn = document.getElementById("practice-toggle-btn");

  isPracticeActive = !isPracticeActive;

  if (isPracticeActive) {
    cheatsheetView.style.display = "none";
    practiceView.style.display = "flex";
    headerCheatsheet.style.display = "none";
    headerPractice.style.display = "flex";
    toggleBtn.textContent = "← Back to Cheatsheet";
    setKeyboardActiveKeys(Array.from(practiceState.activeKeys));
    document.getElementById("keyboard-context-label").textContent = "Practice Motions — active level keys";
  } else {
    practiceView.style.display = "none";
    cheatsheetView.style.display = "flex";
    headerPractice.style.display = "none";
    headerCheatsheet.style.display = "flex";
    toggleBtn.textContent = "Practice Motions →";
    clearKeyboardActiveKeys();
    document.getElementById("keyboard-context-label").textContent = "Hover a shortcut to see it on the keyboard";
  }
}

// --- Init ---

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("app-version-label").textContent = `v${APP_VERSION}`;

  initKeyboard();

  document.querySelectorAll(".tool-tab").forEach(btn => {
    btn.addEventListener("click", () => renderTool(btn.dataset.tool));
  });

  document.getElementById("search-input").addEventListener("input", (e) => {
    filterCheatsheet(e.target.value);
  });

  document.getElementById("practice-toggle-btn").addEventListener("click", togglePracticeMode);

  renderTool("neovim");
});
