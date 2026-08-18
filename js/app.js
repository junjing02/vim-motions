// app.js - Cheatsheet controller: tool tabs, category nav, live search, and the
// Practice Mode toggle for the Neovim motions drill.

// Keep in sync with the "version" field in package.json — shown in the page footer.
const APP_VERSION = "2.6.0";

let currentTool = "neovim";

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

  document.getElementById("plugins-section-heading").textContent = tool.pluginsLabel || "Recommended Plugins";

  const keyboardSection = document.getElementById("corne-keyboard-section");
  if (tool.keyboardLayouts) {
    keyboardSection.style.display = "block";
    renderCorneLayoutTabs(getCorneLayouts());
  } else {
    keyboardSection.style.display = "none";
  }

  renderCategoryNav(tool);
  renderShortcutSections(tool);
  renderPluginsGrid(tool);

  document.getElementById("search-input").value = "";
  filterCheatsheet("");

  document.getElementById("practice-toggle-btn").style.display = (toolId === "neovim") ? "" : "none";

  document.getElementById("cheatsheet-board").scrollTop = 0;
}

// --- Corne 42 keyboard layer viewer ---

let customCorneLayout = null; // populated from an uploaded .vil file; persists across tab switches

function getCorneLayouts() {
  const base = CHEATSHEETS.corne.keyboardLayouts;
  return customCorneLayout ? [...base, customCorneLayout] : base;
}

function renderCorneLayoutTabs(layouts, selectId) {
  const layoutTabsEl = document.getElementById("corne-layout-tabs");
  layoutTabsEl.innerHTML = "";

  let selectedIdx = selectId ? layouts.findIndex(l => l.id === selectId) : 0;
  if (selectedIdx < 0) selectedIdx = 0;

  layouts.forEach((layout, idx) => {
    const btn = document.createElement("button");
    btn.className = "corne-layout-tab" + (idx === selectedIdx ? " active" : "");
    btn.textContent = layout.name;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".corne-layout-tab").forEach(el => el.classList.remove("active"));
      btn.classList.add("active");
      renderCorneKeyboard(layout);
    });
    layoutTabsEl.appendChild(btn);
  });

  renderCorneKeyboard(layouts[selectedIdx]);
}

function renderCorneKeyboard(layout) {
  const tabsEl = document.getElementById("corne-layer-tabs");
  const noteEl = document.getElementById("corne-keyboard-note");
  noteEl.textContent = layout.note;

  tabsEl.innerHTML = "";
  layout.layers.forEach((layer, idx) => {
    const btn = document.createElement("button");
    btn.className = "corne-layer-tab" + (idx === 0 ? " active" : "");
    btn.textContent = layer.label;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".corne-layer-tab").forEach(el => el.classList.remove("active"));
      btn.classList.add("active");
      renderCorneLayer(layer, layout);
    });
    tabsEl.appendChild(btn);
  });

  renderCorneLayer(layout.layers[0], layout);
}

function renderCorneLayer(layer, layout) {
  if (layout.isRaw) {
    renderRawCorneGrid(layer.rows);
  } else {
    renderCorneGrid(layer, layout.thumbs);
  }
}

// Curated layouts: known 3-row + separate thumb-row shape, so it gets the nicer indented thumb row.
function renderCorneGrid(layer, thumbs) {
  const grid = document.getElementById("corne-keyboard-grid");
  grid.innerHTML = "";

  layer.rows.forEach(row => {
    const rowEl = document.createElement("div");
    rowEl.className = "corne-row";
    row.forEach((label, colIdx) => {
      rowEl.appendChild(makeCorneKey(label));
      if (colIdx === 5) rowEl.appendChild(makeCorneHandGap());
    });
    grid.appendChild(rowEl);
  });

  const thumbRow = document.createElement("div");
  thumbRow.className = "corne-row corne-thumb-row";
  thumbs.forEach((label, idx) => {
    thumbRow.appendChild(makeCorneKey(label));
    if (idx === 2) thumbRow.appendChild(makeCorneHandGap());
  });
  grid.appendChild(thumbRow);
}

// Uploaded layouts: unknown row/thumb shape, so render whatever the file actually contains —
// correctness over a fixed assumption. Splits each row at its midpoint if the width is even.
function renderRawCorneGrid(rows) {
  const grid = document.getElementById("corne-keyboard-grid");
  grid.innerHTML = "";

  rows.forEach(row => {
    const rowEl = document.createElement("div");
    rowEl.className = "corne-row";
    const mid = Math.floor(row.length / 2);
    row.forEach((label, colIdx) => {
      rowEl.appendChild(makeCorneKey(label));
      if (row.length % 2 === 0 && colIdx === mid - 1) rowEl.appendChild(makeCorneHandGap());
    });
    grid.appendChild(rowEl);
  });
}

function makeCorneKey(label) {
  const el = document.createElement("div");
  el.className = "corne-key" + (label === "·" || label === "" ? " corne-key-trans" : "");
  el.textContent = label;
  return el;
}

function makeCorneHandGap() {
  const gap = document.createElement("div");
  gap.className = "corne-hand-gap";
  return gap;
}

// --- .vil upload: parse a Vial keymap export into the same layout/layer shape used above ---

const QMK_KEYCODE_LABELS = {
  TRNS: "·", NO: "",
  ESC: "Esc", SPC: "Space", ENT: "Enter", BSPC: "Bspc", TAB: "Tab", DEL: "Del",
  LSFT: "Shift", RSFT: "Shift", LCTL: "Ctrl", RCTL: "Ctrl", LALT: "Alt", RALT: "Alt",
  LGUI: "GUI", RGUI: "GUI", CAPS: "Caps",
  LEFT: "Left", RGHT: "Right", RIGHT: "Right", UP: "Up", DOWN: "Down",
  HOME: "Home", END: "End", PGUP: "PgUp", PGDN: "PgDn", INS: "Ins", PSCR: "PScr",
  MINS: "-", EQL: "=", LBRC: "[", RBRC: "]", BSLS: "\\", SCLN: ";", QUOT: "'",
  GRV: "`", COMM: ",", DOT: ".", SLSH: "/",
  BOOT: "BOOT", QK_BOOT: "BOOT", RESET: "BOOT"
};

function translateKeycode(raw) {
  if (raw === undefined || raw === null) return "";
  const kc = String(raw).trim();
  if (!kc) return "";

  const layerFn = kc.match(/^(MO|TG|TO|TT|OSL|DF)\((\d+)\)$/);
  if (layerFn) return `${layerFn[1]}(${layerFn[2]})`;

  const ltFn = kc.match(/^LT(\d+)\((KC_\w+)\)$/) || kc.match(/^LT\((\d+),\s*(KC_\w+)\)$/);
  if (ltFn) return `LT(${ltFn[1]},${translateKeycode(ltFn[2])})`;

  const core = kc.startsWith("KC_") ? kc.slice(3) : kc;
  if (core in QMK_KEYCODE_LABELS) return QMK_KEYCODE_LABELS[core];
  if (/^[A-Z0-9]$/.test(core)) return core;
  if (/^F(2[0-4]|1[0-9]|[1-9])$/.test(core)) return core;

  return core || kc;
}

function parseVilFile(data) {
  if (!data || !Array.isArray(data.layout) || data.layout.length === 0) {
    throw new Error('No "layout" array found — this doesn\'t look like a Vial keymap export.');
  }

  const layers = data.layout.map((layerRows, idx) => {
    if (!Array.isArray(layerRows) || !Array.isArray(layerRows[0])) {
      throw new Error(`Layer ${idx} isn't in the expected row/column shape.`);
    }
    return { id: `layer${idx}`, label: `Layer ${idx}`, rows: layerRows.map(row => row.map(translateKeycode)) };
  });

  return {
    id: "uploaded",
    name: "Your Layout",
    isRaw: true,
    note: "Parsed directly from your uploaded .vil file — keycodes are exact. Grid position mirrors your file's raw row/column order, which may not perfectly match physical key placement if your board's wiring differs from the standard Corne matrix.",
    layers
  };
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
  pluginsNavItem.textContent = tool.pluginsLabel || "Recommended Plugins";
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
  } else {
    practiceView.style.display = "none";
    cheatsheetView.style.display = "flex";
    headerPractice.style.display = "none";
    headerCheatsheet.style.display = "flex";
    toggleBtn.textContent = "Practice Motions →";
  }
}

// --- Init ---

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("app-version-label").textContent = `v${APP_VERSION}`;

  document.querySelectorAll(".tool-tab").forEach(btn => {
    btn.addEventListener("click", () => renderTool(btn.dataset.tool));
  });

  document.getElementById("search-input").addEventListener("input", (e) => {
    filterCheatsheet(e.target.value);
  });

  document.getElementById("practice-toggle-btn").addEventListener("click", togglePracticeMode);

  document.getElementById("corne-vil-upload").addEventListener("change", handleVilUpload);
  document.getElementById("corne-upload-clear").addEventListener("click", clearVilUpload);

  renderTool("neovim");
});

function handleVilUpload(e) {
  const file = e.target.files[0];
  const statusEl = document.getElementById("corne-upload-status");
  const clearBtn = document.getElementById("corne-upload-clear");
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      customCorneLayout = parseVilFile(data);
      statusEl.textContent = `Loaded "${file.name}"`;
      statusEl.classList.remove("corne-upload-error");
      clearBtn.style.display = "";
      renderCorneLayoutTabs(getCorneLayouts(), customCorneLayout.id);
    } catch (err) {
      customCorneLayout = null;
      statusEl.textContent = `Couldn't read that file: ${err.message}`;
      statusEl.classList.add("corne-upload-error");
      clearBtn.style.display = "none";
    }
  };
  reader.onerror = () => {
    statusEl.textContent = "Couldn't read that file.";
    statusEl.classList.add("corne-upload-error");
  };
  reader.readAsText(file);
  e.target.value = ""; // allow re-uploading the same filename later
}

function clearVilUpload() {
  customCorneLayout = null;
  document.getElementById("corne-upload-status").textContent = "Stays in your browser — never uploaded anywhere.";
  document.getElementById("corne-upload-status").classList.remove("corne-upload-error");
  document.getElementById("corne-upload-clear").style.display = "none";
  renderCorneLayoutTabs(getCorneLayouts());
}
