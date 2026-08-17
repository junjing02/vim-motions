// cheatsheet.js - Curated reference data for Neovim, tmux, and lazygit.
// Each tool has categorized shortcuts (keys + description) and a short curated plugin list.
// A shortcut entry uses `keys: [...]` for keypress chords (rendered as key-caps and highlighted
// on the keyboard visualizer), or `cmd: "..."` for a shell command typed outside the tool.
const CHEATSHEETS = {
  neovim: {
    id: "neovim",
    name: "Neovim",
    tagline: "Modal text editing, built for keyboard-only speed.",
    prefixKey: null,
    categories: [
      {
        id: "modes",
        title: "Modes",
        shortcuts: [
          { keys: ["i"], desc: "Enter Insert mode before the cursor" },
          { keys: ["Esc"], desc: "Return to Normal mode" },
          { keys: ["v"], desc: "Visual mode (character-wise selection)" },
          { keys: ["V"], desc: "Visual Line mode (select whole lines)" },
          { keys: ["Ctrl+v"], desc: "Visual Block mode (select a rectangle)" },
          { keys: [":"], desc: "Command-line mode" }
        ]
      },
      {
        id: "movement",
        title: "Movement",
        shortcuts: [
          { keys: ["h"], desc: "Move left" },
          { keys: ["j"], desc: "Move down" },
          { keys: ["k"], desc: "Move up" },
          { keys: ["l"], desc: "Move right" },
          { keys: ["w"], desc: "Jump to start of next word" },
          { keys: ["e"], desc: "Jump to end of word" },
          { keys: ["b"], desc: "Jump back to start of word" },
          { keys: ["W"], desc: "Jump to next WORD (whitespace-separated)" },
          { keys: ["0"], desc: "Jump to start of line (column 0)" },
          { keys: ["^"], desc: "Jump to first non-blank character" },
          { keys: ["$"], desc: "Jump to end of line" },
          { keys: ["g", "g"], desc: "Jump to top of file" },
          { keys: ["G"], desc: "Jump to bottom of file" },
          { keys: ["f", "{char}"], desc: "Jump to next occurrence of {char}" },
          { keys: ["t", "{char}"], desc: "Jump right before next {char}" },
          { keys: [";"], desc: "Repeat last f/t search" },
          { keys: [","], desc: "Repeat last f/t search, reversed" },
          { keys: ["Ctrl+d"], desc: "Scroll down half a page" },
          { keys: ["Ctrl+u"], desc: "Scroll up half a page" },
          { keys: ["%"], desc: "Jump to matching bracket" }
        ]
      },
      {
        id: "editing",
        title: "Editing",
        shortcuts: [
          { keys: ["i"], desc: "Insert before cursor" },
          { keys: ["a"], desc: "Insert after cursor (append)" },
          { keys: ["I"], desc: "Insert at start of line" },
          { keys: ["A"], desc: "Insert at end of line" },
          { keys: ["o"], desc: "Open new line below and insert" },
          { keys: ["O"], desc: "Open new line above and insert" },
          { keys: ["x"], desc: "Delete character under cursor" },
          { keys: ["r", "{char}"], desc: "Replace character under cursor" },
          { keys: ["s"], desc: "Substitute character (delete + insert)" },
          { keys: ["u"], desc: "Undo" },
          { keys: ["Ctrl+r"], desc: "Redo" },
          { keys: ["."], desc: "Repeat last change" },
          { keys: ["J"], desc: "Join line below onto current line" },
          { keys: ["~"], desc: "Toggle case of character under cursor" }
        ]
      },
      {
        id: "operators",
        title: "Operators & Text Objects",
        shortcuts: [
          { keys: ["d", "{motion}"], desc: "Delete over a motion, e.g. dw, d$" },
          { keys: ["c", "{motion}"], desc: "Change over a motion (delete + insert)" },
          { keys: ["y", "{motion}"], desc: "Yank (copy) over a motion" },
          { keys: ["d", "d"], desc: "Delete current line" },
          { keys: ["y", "y"], desc: "Yank current line" },
          { keys: ["c", "c"], desc: "Change current line" },
          { keys: ["d", "i", "w"], desc: "Delete inner word (cursor anywhere in it)" },
          { keys: ["c", "i", "w"], desc: "Change inner word" },
          { keys: ["d", "a", "w"], desc: "Delete a word plus surrounding space" },
          { keys: ["d", "i", "("], desc: "Delete inside ( ), { }, or \" \"" },
          { keys: ["d", "a", "("], desc: "Delete around ( ), { }, or \" \" (incl. delimiters)" },
          { keys: ["p"], desc: "Paste after cursor / below line" },
          { keys: ["P"], desc: "Paste before cursor / above line" },
          { keys: ["D"], desc: "Delete to end of line" },
          { keys: ["C"], desc: "Change to end of line" },
          { keys: ["Y"], desc: "Yank to end of line" }
        ]
      },
      {
        id: "visual",
        title: "Visual Mode",
        shortcuts: [
          { keys: ["v"], desc: "Start character-wise selection" },
          { keys: ["V"], desc: "Start line-wise selection" },
          { keys: ["Ctrl+v"], desc: "Start block-wise selection" },
          { keys: ["o"], desc: "Jump cursor to the other end of selection" },
          { keys: [">"], desc: "Indent selection" },
          { keys: ["<"], desc: "Unindent selection" },
          { keys: ["g", "v"], desc: "Reselect last visual selection" }
        ]
      },
      {
        id: "search",
        title: "Search & Replace",
        shortcuts: [
          { keys: ["/", "{query}"], desc: "Search forward" },
          { keys: ["?", "{query}"], desc: "Search backward" },
          { keys: ["n"], desc: "Repeat search, same direction" },
          { keys: ["N"], desc: "Repeat search, opposite direction" },
          { keys: ["*"], desc: "Search forward for word under cursor" },
          { keys: ["#"], desc: "Search backward for word under cursor" },
          { cmd: ":%s/old/new/g", desc: "Replace all occurrences of 'old' with 'new' in file" }
        ]
      },
      {
        id: "windows",
        title: "Windows & Splits",
        shortcuts: [
          { cmd: ":split", desc: "Split window horizontally" },
          { cmd: ":vsplit", desc: "Split window vertically" },
          { keys: ["Ctrl+w", "h/j/k/l"], desc: "Move to the split in that direction" },
          { keys: ["Ctrl+w", "="], desc: "Equalize split sizes" },
          { keys: ["Ctrl+w", "q"], desc: "Close current split" }
        ]
      },
      {
        id: "buffers",
        title: "Buffers & Files",
        shortcuts: [
          { cmd: ":e {file}", desc: "Open a file" },
          { cmd: ":w", desc: "Save (write) the current file" },
          { cmd: ":q", desc: "Quit" },
          { cmd: ":wq", desc: "Save and quit" },
          { cmd: ":q!", desc: "Quit without saving" },
          { cmd: ":bn", desc: "Go to next buffer" },
          { cmd: ":bp", desc: "Go to previous buffer" },
          { cmd: ":ls", desc: "List open buffers" }
        ]
      }
    ],
    plugins: [
      { name: "lazy.nvim", tagline: "Modern plugin manager that most popular configs (LazyVim, kickstart.nvim) are built on. Lazy-loads plugins for a fast startup.", url: "https://github.com/folke/lazy.nvim" },
      { name: "telescope.nvim", tagline: "Fuzzy finder for files, text, buffers, and git — usually the single biggest productivity jump after learning motions.", url: "https://github.com/nvim-telescope/telescope.nvim" },
      { name: "nvim-treesitter", tagline: "Accurate syntax highlighting and code structure awareness; powers smarter indenting and text objects.", url: "https://github.com/nvim-treesitter/nvim-treesitter" },
      { name: "mason.nvim + nvim-lspconfig", tagline: "Installs and wires up language servers automatically — autocomplete, go-to-definition, diagnostics with minimal setup.", url: "https://github.com/williamboman/mason.nvim" },
      { name: "nvim-cmp", tagline: "Autocompletion engine that pulls suggestions from your LSP, snippets, and open buffers.", url: "https://github.com/hrsh7th/nvim-cmp" },
      { name: "gitsigns.nvim", tagline: "Git change markers in the gutter, inline blame, and hunk stage/undo without leaving Normal mode.", url: "https://github.com/lewis6991/gitsigns.nvim" },
      { name: "which-key.nvim", tagline: "Pops up a menu of available keybindings as you type a prefix — the fastest way to learn your own config.", url: "https://github.com/folke/which-key.nvim" },
      { name: "lualine.nvim", tagline: "Clean statusline showing mode, git branch, diagnostics, and file info.", url: "https://github.com/nvim-lualine/lualine.nvim" },
      { name: "neo-tree.nvim", tagline: "Sidebar file explorer, familiar to anyone coming from VS Code.", url: "https://github.com/nvim-neo-tree/neo-tree.nvim" }
    ]
  },

  tmux: {
    id: "tmux",
    name: "tmux",
    tagline: "Terminal multiplexer: sessions, windows, and panes that survive disconnects.",
    prefixKey: "Ctrl+b",
    categories: [
      {
        id: "sessions",
        title: "Sessions",
        shortcuts: [
          { cmd: "tmux new -s name", desc: "Start a new named session" },
          { cmd: "tmux attach -t name", desc: "Reattach to a session" },
          { keys: ["Prefix", "d"], desc: "Detach from the current session" },
          { keys: ["Prefix", "s"], desc: "List and switch sessions" },
          { keys: ["Prefix", "$"], desc: "Rename current session" },
          { cmd: "tmux kill-session -t name", desc: "Kill a session" }
        ]
      },
      {
        id: "windows",
        title: "Windows",
        shortcuts: [
          { keys: ["Prefix", "c"], desc: "Create a new window" },
          { keys: ["Prefix", "n"], desc: "Go to next window" },
          { keys: ["Prefix", "p"], desc: "Go to previous window" },
          { keys: ["Prefix", "0-9"], desc: "Jump directly to window by number" },
          { keys: ["Prefix", ","], desc: "Rename current window" },
          { keys: ["Prefix", "&"], desc: "Close current window (confirms)" }
        ]
      },
      {
        id: "panes",
        title: "Panes",
        shortcuts: [
          { keys: ["Prefix", "%"], desc: "Split pane vertically (side by side)" },
          { keys: ["Prefix", "\""], desc: "Split pane horizontally (top/bottom)" },
          { keys: ["Prefix", "o"], desc: "Cycle to next pane" },
          { keys: ["Prefix", "Arrow"], desc: "Move to the pane in that direction" },
          { keys: ["Prefix", "z"], desc: "Zoom current pane to full screen (toggle)" },
          { keys: ["Prefix", "x"], desc: "Close current pane (confirms)" },
          { keys: ["Prefix", "Ctrl+Arrow"], desc: "Resize pane in that direction" }
        ]
      },
      {
        id: "copy-mode",
        title: "Copy Mode",
        shortcuts: [
          { keys: ["Prefix", "["], desc: "Enter copy mode (scroll & select)" },
          { keys: ["Space"], desc: "Start selection (vi-style copy mode)" },
          { keys: ["Enter"], desc: "Copy selection and exit copy mode" },
          { keys: ["Prefix", "]"], desc: "Paste most recently copied text" },
          { keys: ["q"], desc: "Exit copy mode without copying" }
        ]
      }
    ],
    plugins: [
      { name: "TPM (Tmux Plugin Manager)", tagline: "Prerequisite for everything else below — install and update tmux plugins with a keybinding instead of manual scripts.", url: "https://github.com/tmux-plugins/tpm" },
      { name: "tmux-resurrect", tagline: "Saves and restores your tmux sessions, windows, panes, and layout across reboots.", url: "https://github.com/tmux-plugins/tmux-resurrect" },
      { name: "tmux-continuum", tagline: "Auto-saves your session continuously and can auto-restore on tmux start, paired with tmux-resurrect.", url: "https://github.com/tmux-plugins/tmux-continuum" },
      { name: "tmux-yank", tagline: "Sends tmux copy-mode selections to your system clipboard instead of just tmux's internal buffer.", url: "https://github.com/tmux-plugins/tmux-yank" },
      { name: "catppuccin/tmux", tagline: "Clean, popular status-line theme that pairs well with a matching Neovim colorscheme.", url: "https://github.com/catppuccin/tmux" },
      { name: "vim-tmux-navigator", tagline: "Move between Neovim splits and tmux panes with the same Ctrl+h/j/k/l — the boundary disappears.", url: "https://github.com/christoomey/vim-tmux-navigator" }
    ]
  },

  lazygit: {
    id: "lazygit",
    name: "lazygit",
    tagline: "A terminal UI for git — stage, commit, branch, and rebase without memorizing git flags.",
    prefixKey: null,
    categories: [
      {
        id: "navigation",
        title: "Navigation",
        shortcuts: [
          { keys: ["1"], desc: "Jump to Status panel" },
          { keys: ["2"], desc: "Jump to Files panel" },
          { keys: ["3"], desc: "Jump to Branches panel" },
          { keys: ["4"], desc: "Jump to Commits panel" },
          { keys: ["5"], desc: "Jump to Stash panel" },
          { keys: ["Esc"], desc: "Back / cancel" },
          { keys: ["q"], desc: "Quit lazygit" },
          { keys: ["?"], desc: "Show full keybinding help for current panel" }
        ]
      },
      {
        id: "files",
        title: "Files Panel",
        shortcuts: [
          { keys: ["Space"], desc: "Stage / unstage selected file" },
          { keys: ["a"], desc: "Stage all files" },
          { keys: ["c"], desc: "Commit staged changes" },
          { keys: ["C"], desc: "Commit using $EDITOR (for multi-line messages)" },
          { keys: ["A"], desc: "Amend last commit with staged changes" },
          { keys: ["d"], desc: "Discard changes (opens options)" }
        ]
      },
      {
        id: "branches",
        title: "Branches Panel",
        shortcuts: [
          { keys: ["Space"], desc: "Checkout selected branch" },
          { keys: ["n"], desc: "Create a new branch" },
          { keys: ["d"], desc: "Delete selected branch" },
          { keys: ["M"], desc: "Merge selected branch into current" },
          { keys: ["r"], desc: "Rebase current branch onto selected" }
        ]
      },
      {
        id: "commits",
        title: "Commits Panel",
        shortcuts: [
          { keys: ["s"], desc: "Squash into commit below" },
          { keys: ["f"], desc: "Fixup into commit below" },
          { keys: ["r"], desc: "Reword commit message" },
          { keys: ["d"], desc: "Drop (delete) commit" },
          { keys: ["g"], desc: "Reset current branch to this commit" }
        ]
      },
      {
        id: "stash",
        title: "Stash",
        shortcuts: [
          { keys: ["Space"], desc: "Apply selected stash" },
          { keys: ["g"], desc: "Pop selected stash (apply + drop)" },
          { keys: ["d"], desc: "Drop selected stash" }
        ]
      },
      {
        id: "sync",
        title: "Push / Pull",
        shortcuts: [
          { keys: ["P"], desc: "Push to remote" },
          { keys: ["p"], desc: "Pull from remote" }
        ]
      }
    ],
    plugins: [
      { name: "Custom config.yml", tagline: "lazygit is heavily configurable through one YAML file (~/.config/lazygit/config.yml) — tweak theme colors, pager, and default behaviors.", url: "https://github.com/jesseduffield/lazygit/blob/master/docs/Config.md" },
      { name: "delta", tagline: "Drop-in diff pager with syntax highlighting and side-by-side view; wire it into lazygit's pager config for far more readable diffs.", url: "https://github.com/dandavison/delta" },
      { name: "Nerd Font", tagline: "Install a Nerd Font and enable icons in lazygit's config for file-type and git-status glyphs instead of plain text.", url: "https://www.nerdfonts.com/" },
      { name: "toggleterm.nvim / lazygit.nvim", tagline: "Open lazygit in a floating terminal right inside Neovim so you never leave your editor to commit.", url: "https://github.com/akinsho/toggleterm.nvim" }
    ]
  },

  corne: {
    id: "corne",
    name: "Corne 42",
    tagline: "A 42-key split keyboard — 3×6 per hand plus 3 thumb keys. Layers do the work a number row and function keys would on a full-size board.",
    prefixKey: null,
    pluginsLabel: "Firmware & Layout Resources",
    // Illustrative layouts, not universal standards — real Corne configs vary widely.
    // "·" marks a transparent key (falls through to Base). Thumbs stay constant across
    // layers within a layout since the layer-access keys themselves don't usually change.
    keyboardLayouts: [
      {
        id: "default",
        name: "Default (Beginner QWERTY)",
        note: "One example layout to learn the concepts from — real Corne configs vary a lot. \"·\" means the key is transparent (falls through to Base).",
        thumbs: ["GUI", "Lower", "Space", "Enter", "Raise", "Alt"],
        layers: [
          {
            id: "base",
            label: "Base",
            rows: [
              ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Bspc"],
              ["Esc", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"],
              ["Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Shift"]
            ]
          },
          {
            id: "lower",
            label: "Lower",
            rows: [
              ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "Del"],
              ["·", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "·"],
              ["·", "-", "=", "[", "]", "\\", "_", "+", "{", "}", "|", "·"]
            ]
          },
          {
            id: "raise",
            label: "Raise",
            rows: [
              ["·", "·", "·", "·", "·", "·", "·", "Home", "PgDn", "PgUp", "End", "·"],
              ["·", "·", "·", "·", "·", "·", "·", "Left", "Down", "Up", "Right", "·"],
              ["·", "·", "·", "·", "·", "·", "·", "·", "·", "·", "·", "·"]
            ]
          },
          {
            id: "adjust",
            label: "Adjust",
            rows: [
              ["·", "·", "·", "·", "·", "·", "·", "·", "·", "·", "·", "BOOT"],
              ["·", "·", "·", "·", "·", "RGB", "·", "·", "·", "·", "·", "·"],
              ["·", "·", "·", "·", "·", "·", "·", "·", "·", "·", "·", "·"]
            ]
          }
        ]
      },
      {
        id: "miryoku",
        name: "Miryoku (Colemak-DH)",
        note: "A faithful-but-simplified rendition of Miryoku's design: Colemak-DH alphas, mirrored home row mods (tap the letter, hold for the modifier shown), and the same layer set (Nav/Mouse/Media/Num/Sym/Fun) it ships with. Miryoku's core is a 36-key (5-column) layout, so the outer column is unused here — see miryoku.org for the pixel-exact reference.",
        thumbs: ["Esc", "Tab", "Space", "Enter", "Bspc", "Del"],
        layers: [
          {
            id: "base",
            label: "Base",
            rows: [
              ["·", "Q", "W", "F", "P", "B", "J", "L", "U", "Y", ";", "·"],
              ["·", "A/Gui", "R/Alt", "S/Ctrl", "T/Shift", "G", "M", "N/Shift", "E/Ctrl", "I/Alt", "O/Gui", "·"],
              ["·", "Z", "X", "C", "D", "V", "K", "H", ",", ".", "/", "·"]
            ]
          },
          {
            id: "nav",
            label: "Nav",
            rows: [
              ["·", "·", "·", "·", "·", "·", "·", "Undo", "Cut", "Copy", "Paste", "·"],
              ["·", "·", "·", "·", "·", "·", "·", "Left", "Down", "Up", "Right", "·"],
              ["·", "·", "·", "·", "·", "·", "·", "Home", "PgDn", "PgUp", "End", "·"]
            ]
          },
          {
            id: "mouse",
            label: "Mouse",
            rows: [
              ["·", "·", "·", "·", "·", "·", "·", "BtnL", "BtnM", "BtnR", "·", "·"],
              ["·", "·", "·", "·", "·", "·", "·", "MLeft", "MDown", "MUp", "MRight", "·"],
              ["·", "·", "·", "·", "·", "·", "·", "WheelL", "WheelD", "WheelU", "WheelR", "·"]
            ]
          },
          {
            id: "media",
            label: "Media",
            rows: [
              ["·", "·", "·", "·", "·", "·", "·", "BT1", "BT2", "BT3", "·", "·"],
              ["·", "·", "·", "·", "·", "·", "·", "RGB Tog", "RGB Mode", "Hue", "Sat", "·"],
              ["·", "·", "·", "·", "·", "·", "·", "Prev", "Vol−", "Vol+", "Next", "·"]
            ]
          },
          {
            id: "num",
            label: "Num",
            rows: [
              ["·", "/", "7", "8", "9", "*", "·", "·", "·", "·", "·", "·"],
              ["·", "0", "4", "5", "6", "-", "·", "·", "·", "·", "·", "·"],
              ["·", ".", "1", "2", "3", "=", "·", "·", "·", "·", "·", "·"]
            ]
          },
          {
            id: "sym",
            label: "Sym",
            rows: [
              ["·", "?", "&", "*", "(", ")", "·", "·", "·", "·", "·", "·"],
              ["·", ")", "$", "%", "^", "_", "·", "·", "·", "·", "·", "·"],
              ["·", ">", "!", "@", "#", "+", "·", "·", "·", "·", "·", "·"]
            ]
          },
          {
            id: "fun",
            label: "Fun",
            rows: [
              ["·", "F12", "F7", "F8", "F9", "·", "·", "·", "·", "·", "·", "·"],
              ["·", "F11", "F4", "F5", "F6", "·", "·", "·", "·", "·", "·", "·"],
              ["·", "F10", "F1", "F2", "F3", "·", "·", "·", "·", "·", "·", "·"]
            ]
          }
        ]
      }
    ],
    categories: [
      {
        id: "basics",
        title: "Layout Basics",
        shortcuts: [
          { keys: ["42 keys"], desc: "3 rows × 6 columns per hand (36 keys) plus 3 thumb keys per hand (6 keys). No number row, no arrow keys, no function row — they all live on layers." },
          { keys: ["Columnar stagger"], desc: "Each column is offset vertically to match finger length, unlike a row-staggered board. Expect a short adjustment period, especially for the pinky columns." },
          { keys: ["Thumb cluster"], desc: "3 keys per thumb usually carry Space, Backspace/Enter, and a layer key — thumbs do far more work than on a standard keyboard." },
          { keys: ["36 vs 42"], desc: "Some Corne users disable the outer pinky column and run it as a 36-key board instead — a common way to simplify further once you're comfortable." }
        ]
      },
      {
        id: "layers",
        title: "Layers",
        shortcuts: [
          { keys: ["Layer 0"], desc: "Base layer — usually QWERTY or Colemak. Always the fallback layer." },
          { keys: ["Lower"], desc: "Common second layer: numbers, symbols, and the function row. Held from a thumb key." },
          { keys: ["Raise"], desc: "Common third layer: navigation (arrows, page up/down), media keys, mouse keys. Held from another thumb key." },
          { keys: ["Adjust"], desc: "Often reached by holding Lower + Raise together: firmware settings, RGB, bootloader/reset." }
        ]
      },
      {
        id: "qmk-keycodes",
        title: "QMK Layer Keycodes",
        shortcuts: [
          { keys: ["MO(layer)"], desc: "Momentary — the layer is active only while the key is held." },
          { keys: ["LT(layer, kc)"], desc: "Layer-tap — tap sends kc, hold activates the layer. Common on thumb keys, e.g. LT(1, KC_SPC)." },
          { keys: ["TG(layer)"], desc: "Toggle — press once to turn the layer on, press again (from that layer) to turn it off." },
          { keys: ["TO(layer)"], desc: "Activates one layer and turns off every other layer except the default." },
          { keys: ["TT(layer)"], desc: "Tap-toggle — hold for momentary access, or tap repeatedly to toggle it on." },
          { keys: ["DF(layer)"], desc: "Sets the default (base) layer — used to switch between e.g. QWERTY and Colemak." },
          { keys: ["OSL(layer)"], desc: "One-shot layer — only the very next keypress comes from that layer, then it reverts." }
        ]
      },
      {
        id: "zmk-behaviors",
        title: "ZMK Behaviors",
        shortcuts: [
          { keys: ["&mo"], desc: "Momentary layer — mirrors QMK's MO(), active only while held. Common on wireless Corne builds." },
          { keys: ["&lt"], desc: "Layer-tap — tap for a keycode, hold for a layer. Mirrors QMK's LT()." },
          { keys: ["&tog"], desc: "Toggles a layer on/off. Mirrors QMK's TG()." },
          { keys: ["&to"], desc: "Activates one layer and disables every other layer except the default." },
          { keys: ["&sk / &sl"], desc: "Sticky key / sticky layer — like a one-shot modifier or layer for just the next keypress." }
        ]
      },
      {
        id: "home-row-mods",
        title: "Home Row Mods",
        shortcuts: [
          { keys: ["A S D F"], desc: "Common left-hand assignment: GUI, Alt, Ctrl, Shift when held — tap for the normal letter." },
          { keys: ["J K L ;"], desc: "Mirrored on the right hand: Shift, Ctrl, Alt, GUI when held." },
          { keys: ["Tapping term"], desc: "The hold-vs-tap timing threshold (usually 150–200ms). Tune this first if letters misfire as modifiers." },
          { keys: ["Permissive hold"], desc: "A QMK/ZMK setting that reduces accidental mod-taps by requiring another key to be pressed before a hold is treated as a modifier." }
        ]
      }
    ],
    plugins: [
      { name: "QMK Firmware", tagline: "The most widely supported open-source keyboard firmware — huge community, extensive docs, works over USB.", url: "https://qmk.fm" },
      { name: "ZMK Firmware", tagline: "Modern firmware built for wireless (Bluetooth) split keyboards — the usual pick if your Corne is wireless.", url: "https://zmk.dev" },
      { name: "VIA / Vial", tagline: "Point-and-click keymap editor for QMK-compatible boards — no recompiling firmware just to remap a key.", url: "https://www.caniusevia.com/" },
      { name: "Miryoku", tagline: "A popular, minimalist layout system built around home row mods — a great reference to start from rather than designing your own from scratch.", url: "https://github.com/manna-harbour/miryoku" },
      { name: "keymap-drawer", tagline: "Generates a clean visual diagram of your keymap straight from your QMK/ZMK config — makes memorizing your own layout much easier.", url: "https://github.com/caksoylar/keymap-drawer" },
      { name: "r/ErgoMechKeyboards", tagline: "The main community hub for split/ergo keyboard builds, layout advice, and troubleshooting.", url: "https://www.reddit.com/r/ErgoMechKeyboards/" }
    ]
  }
};
