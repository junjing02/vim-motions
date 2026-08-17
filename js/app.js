// app.js - Cheatsheet controller: tool tabs, category nav, live search, and the
// Practice Mode toggle for the Neovim motions drill.

// Keep in sync with the "version" field in package.json — shown in the page footer.
const APP_VERSION = "2.5.1";

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
    renderCorneLayoutTabs(tool.keyboardLayouts);
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

function renderCorneLayoutTabs(layouts) {
  const layoutTabsEl = document.getElementById("corne-layout-tabs");
  layoutTabsEl.innerHTML = "";

  layouts.forEach((layout, idx) => {
    const btn = document.createElement("button");
    btn.className = "corne-layout-tab" + (idx === 0 ? " active" : "");
    btn.textContent = layout.name;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".corne-layout-tab").forEach(el => el.classList.remove("active"));
      btn.classList.add("active");
      renderCorneKeyboard(layout);
    });
    layoutTabsEl.appendChild(btn);
  });

  renderCorneKeyboard(layouts[0]);
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
      renderCorneGrid(layer, layout.thumbs);
    });
    tabsEl.appendChild(btn);
  });

  renderCorneGrid(layout.layers[0], layout.thumbs);
}

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

function makeCorneKey(label) {
  const el = document.createElement("div");
  el.className = "corne-key" + (label === "·" ? " corne-key-trans" : "");
  el.textContent = label;
  return el;
}

function makeCorneHandGap() {
  const gap = document.createElement("div");
  gap.className = "corne-hand-gap";
  return gap;
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

  renderTool("neovim");
});
