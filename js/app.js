// app.js - Cheatsheet controller: tool tabs, category nav, live search, and the
// Practice Mode toggle for the Neovim motions drill.

// Keep in sync with the "version" field in package.json — shown in the page footer.
const APP_VERSION = "2.7.0";

let currentTool = "workflow";

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

  const shortcutSectionsEl = document.getElementById("shortcut-sections");
  const workflowStepsEl = document.getElementById("workflow-steps");
  if (tool.isWorkflow) {
    shortcutSectionsEl.style.display = "none";
    workflowStepsEl.style.display = "flex";
    document.getElementById("category-nav").innerHTML = "";
    renderWorkflowSteps(tool);
  } else {
    shortcutSectionsEl.style.display = "flex";
    workflowStepsEl.style.display = "none";
    renderCategoryNav(tool);
    renderShortcutSections(tool);
  }
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
  if (!layout.isRaw) {
    // Curated layout: known 3 main rows + a separate fixed 6-key thumbs array.
    renderCorneShapedGrid(layer.rows, layout.thumbs);
    return;
  }

  const rows = layer.rows;

  // Shape A: one 4-row x 12-col matrix — 3 main rows + a thumb row padded with
  // unused slots on the outer columns (both hands interleaved column-wise).
  if (rows.length === 4 && rows.every(r => r.length === 12)) {
    const thumbs = rows[3].filter(label => label !== "");
    renderCorneShapedGrid(rows.slice(0, 3), thumbs);
    return;
  }

  // Shape B: two 4-row x 6-col halves stacked vertically — rows 0-3 are the left
  // hand, rows 4-7 are the right hand, each 3 main rows + 1 padded thumb row.
  // This is what Vial actually exports for split boards (confirmed against a
  // real Corne .vil export), rather than one interleaved 4x12 matrix.
  if (rows.length === 8 && rows.every(r => r.length === 6)) {
    const left = rows.slice(0, 4);
    const right = rows.slice(4, 8);
    const mainRows = [0, 1, 2].map(i => [...left[i], ...right[i]]);
    const thumbs = [...left[3], ...right[3]].filter(label => label !== "");
    renderCorneShapedGrid(mainRows, thumbs);
    return;
  }

  renderRawCorneGrid(rows);
}

// Renders 3 main rows (split at the midpoint column) plus a thumb row (split at the
// midpoint of however many thumb keys there are) — used for both curated and detected-shape layouts.
function renderCorneShapedGrid(mainRows, thumbs) {
  const grid = document.getElementById("corne-keyboard-grid");
  grid.innerHTML = "";

  mainRows.forEach(row => {
    const rowEl = document.createElement("div");
    rowEl.className = "corne-row";
    const mid = Math.floor(row.length / 2);
    row.forEach((label, colIdx) => {
      rowEl.appendChild(makeCorneKey(label));
      if (colIdx === mid - 1) rowEl.appendChild(makeCorneHandGap());
    });
    grid.appendChild(rowEl);
  });

  if (thumbs.length === 0) return;
  const thumbRow = document.createElement("div");
  thumbRow.className = "corne-row corne-thumb-row";
  const tmid = Math.floor(thumbs.length / 2);
  thumbs.forEach((label, idx) => {
    thumbRow.appendChild(makeCorneKey(label));
    if (idx === tmid - 1) thumbRow.appendChild(makeCorneHandGap());
  });
  grid.appendChild(thumbRow);
}

// Fallback for genuinely non-standard shapes: render whatever the file actually contains —
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
  if (label.length > 6) el.title = label; // long labels get ellipsis-truncated; hover shows the rest
  return el;
}

function makeCorneHandGap() {
  const gap = document.createElement("div");
  gap.className = "corne-hand-gap";
  return gap;
}

// --- .vil upload: parse a Vial keymap export into the same layout/layer shape used above ---

// Both short (KC_ESC) and long (KC_ESCAPE) QMK aliases appear in the wild — Vial's own
// export favors the long forms, confirmed against a real Corne .vil file.
const QMK_KEYCODE_LABELS = {
  TRNS: "·", NO: "",
  ESC: "Esc", ESCAPE: "Esc",
  SPC: "Space", SPACE: "Space",
  ENT: "Enter", ENTER: "Enter",
  BSPC: "Bspc", BSPACE: "Bspc",
  DEL: "Del", DELETE: "Del",
  TAB: "Tab", CAPS: "Caps",
  LSFT: "Shift", RSFT: "Shift", LCTL: "Ctrl", RCTL: "Ctrl", LALT: "Alt", RALT: "Alt",
  LGUI: "GUI", RGUI: "GUI",
  LEFT: "Left", RGHT: "Right", RIGHT: "Right", UP: "Up", DOWN: "Down",
  HOME: "Home", END: "End",
  PGUP: "PgUp", PGDN: "PgDn", PGDOWN: "PgDn",
  INS: "Ins", PSCR: "PScr",
  MINS: "-", MINUS: "-",
  EQL: "=", EQUAL: "=",
  LBRC: "[", LBRACKET: "[",
  RBRC: "]", RBRACKET: "]",
  BSLS: "\\", BSLASH: "\\",
  SCLN: ";", SCOLON: ";",
  QUOT: "'", QUOTE: "'",
  GRV: "`", GRAVE: "`",
  COMM: ",", COMMA: ",",
  DOT: ".", SLSH: "/", SLASH: "/",
  BOOT: "BOOT", QK_BOOT: "BOOT", RESET: "BOOT",
  BTN1: "Btn1", BTN2: "Btn2", BTN3: "Btn3",
  MS_U: "M-Up", MS_D: "M-Down", MS_L: "M-Left", MS_R: "M-Right",
  MNXT: "Next", MPRV: "Prev", MPLY: "Play/Pause", MUTE: "Mute",
  VOLU: "Vol+", VOLD: "Vol−",
  RGB_TOG: "RGB Tog", RGB_MOD: "RGB Mode", RGB_VAI: "Bright+", RGB_VAD: "Bright−",
  RGB_SPI: "Speed+", RGB_SPD: "Speed−"
};

const MOD_WRAP_LABELS = { CTL: "Ctrl", SFT: "Shift", ALT: "Alt", GUI: "GUI" };
const MOD_LETTER_LABELS = { C: "Ctrl", S: "Shift", A: "Alt", G: "GUI" };

function translateKeycode(raw) {
  // Vial exports empty matrix positions as the integer -1, not a string
  if (raw === undefined || raw === null || raw === -1 || raw === "-1") return "";
  const kc = String(raw).trim();
  if (!kc) return "";

  const layerFn = kc.match(/^(MO|TG|TO|TT|OSL|DF|TD)\((\d+)\)$/);
  if (layerFn) return `${layerFn[1]}(${layerFn[2]})`;

  const ltFn = kc.match(/^LT(\d+)\((KC_\w+)\)$/) || kc.match(/^LT\((\d+),\s*(KC_\w+)\)$/);
  if (ltFn) return `LT(${ltFn[1]},${translateKeycode(ltFn[2])})`;

  // Single-modifier wrapper, e.g. LCTL(KC_SPACE) -> "Ctrl+Space"
  const modWrap = kc.match(/^[LR](CTL|SFT|ALT|GUI)\((.+)\)$/);
  if (modWrap) return `${MOD_WRAP_LABELS[modWrap[1]]}+${translateKeycode(modWrap[2])}`;

  // Combined-modifier shorthand, e.g. LCG(KC_Q) -> "Ctrl+GUI+Q" (C/S/A/G = Ctrl/Shift/Alt/GUI)
  const comboWrap = kc.match(/^[LR]([CSAG]{2,4})\((.+)\)$/);
  if (comboWrap) {
    const mods = comboWrap[1].split("").map(l => MOD_LETTER_LABELS[l]).join("+");
    return `${mods}+${translateKeycode(comboWrap[2])}`;
  }

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

function renderWorkflowSteps(tool) {
  const container = document.getElementById("workflow-steps");
  container.innerHTML = "";

  tool.steps.forEach((step, idx) => {
    const stepEl = document.createElement("div");
    stepEl.className = "workflow-step";

    const numberEl = document.createElement("div");
    numberEl.className = "workflow-step-number";
    numberEl.textContent = idx + 1;
    stepEl.appendChild(numberEl);

    const bodyEl = document.createElement("div");
    bodyEl.className = "workflow-step-body";

    const badgeEl = document.createElement("span");
    badgeEl.className = `workflow-tool-badge workflow-tool-${step.tool}`;
    badgeEl.textContent = CHEATSHEETS[step.tool].name;
    bodyEl.appendChild(badgeEl);

    const titleEl = document.createElement("h3");
    titleEl.className = "workflow-step-title";
    titleEl.textContent = step.title;
    bodyEl.appendChild(titleEl);

    const descEl = document.createElement("p");
    descEl.className = "workflow-step-desc";
    descEl.textContent = step.desc;
    bodyEl.appendChild(descEl);

    if (step.keys) {
      const keysEl = document.createElement("div");
      keysEl.className = "shortcut-keys workflow-step-keys";
      step.keys.forEach(k => {
        const cap = document.createElement("span");
        cap.className = "key-cap";
        cap.textContent = k;
        keysEl.appendChild(cap);
      });
      bodyEl.appendChild(keysEl);
    }

    stepEl.appendChild(bodyEl);
    container.appendChild(stepEl);
  });
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
    const isInternal = p.url.startsWith("#");
    const card = document.createElement("a");
    card.className = "plugin-card";
    card.href = p.url;
    card.dataset.search = (p.name + " " + p.tagline).toLowerCase();
    card.innerHTML = `
      <h3>${p.name}</h3>
      <p>${p.tagline}</p>
      <span class="plugin-link">${isInternal ? "Jump to tab" : "View"} &rarr;</span>
    `;
    if (isInternal) {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        renderTool(p.url.slice(1));
      });
    } else {
      card.target = "_blank";
      card.rel = "noopener noreferrer";
    }
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

  renderTool("workflow");
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
