const readline = require("readline");

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underline: "\x1b[4m",
  reverse: "\x1b[7m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  white: "\x1b[37m",
  bgGreen: "\x1b[42m",
  bgBlue: "\x1b[44m",
  black: "\x1b[30m",
  terracotta: "\x1b[38;2;217;119;87m",
  bgTerracotta: "\x1b[48;2;217;119;87m"
};

// Prime stdin once globally. Toggling raw mode between menus adds latency on
// macOS, so we keep raw mode on for the whole TUI session.
let rawPrimed = false;
function primeRawOnce() {
  if (rawPrimed || !process.stdin.isTTY) return;
  try {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.setEncoding("utf8");
    process.stdin.resume();
    rawPrimed = true;
  } catch {}
}

// Keys that must never be echoed as text (arrow keys emit escape sequences
// whose `str` is non-empty, so filter them explicitly).
const NON_TEXT_KEYS = new Set([
  "up", "down", "left", "right", "home", "end", "pageup", "pagedown",
  "insert", "delete", "tab", "escape", "f1", "f2", "f3", "f4", "f5",
  "f6", "f7", "f8", "f9", "f10", "f11", "f12"
]);

/**
 * Read a line of text using the same raw-mode keypress stream the arrow menus
 * use. We intentionally do NOT suspend raw mode here: emitKeypressEvents() is
 * installed globally by primeRawOnce(), and on Windows a fresh
 * readline.question() interface layered on top of that decoder swallows typed
 * characters (they are never echoed and Enter never resolves). Handling the
 * keypress events directly keeps input reliable for every prompt in the TUI.
 */
async function prompt(question) {
  // Non-TTY (piped) input has no keypress stream - fall back to readline.
  if (!process.stdin.isTTY) {
    return new Promise((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question(question, (answer) => {
        rl.close();
        resolve((answer || "").trim());
      });
    });
  }

  return new Promise((resolve) => {
    primeRawOnce();
    process.stdout.write(question);
    let value = "";
    let active = true;

    const cleanup = () => {
      if (!active) return;
      active = false;
      process.stdin.removeListener("keypress", onKeypress);
    };

    const onKeypress = (str, key) => {
      if (!active || !key) return;

      if (key.ctrl && key.name === "c") {
        process.stdout.write("\n");
        cleanup();
        process.exit(0);
        return;
      }
      if (key.name === "return" || key.name === "enter") {
        process.stdout.write("\n");
        cleanup();
        resolve(value.trim());
        return;
      }
      if (key.name === "backspace") {
        if (value.length > 0) {
          value = value.slice(0, -1);
          process.stdout.write("\b \b");
        }
        return;
      }
      if (key.ctrl || key.meta || (key.name && NON_TEXT_KEYS.has(key.name))) return;
      if (typeof str === "string" && str.length > 0) {
        // Drop any stray escape sequences that slip through.
        if (str.includes("\x1b")) return;
        value += str;
        process.stdout.write(str);
      }
    };

    process.stdin.on("keypress", onKeypress);
  });
}

async function select(question, options) {
  console.log(question);
  options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`));
  while (true) {
    const answer = await prompt("\nSelect option (number): ");
    const num = parseInt(answer, 10);
    if (!isNaN(num) && num >= 1 && num <= options.length) return num - 1;
    console.log(`Invalid selection. Please enter a number between 1 and ${options.length}`);
  }
}

async function confirm(question) {
  while (true) {
    const answer = await prompt(`${question} (y/n): `);
    const lower = answer.toLowerCase();
    if (lower === "y" || lower === "yes") return true;
    if (lower === "n" || lower === "no") return false;
    console.log("Please answer 'y' or 'n'");
  }
}

async function pause(message = "Press Enter to continue...") {
  if (!process.stdin.isTTY) {
    return new Promise((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question(message, () => { rl.close(); resolve(); });
    });
  }

  return new Promise((resolve) => {
    primeRawOnce();
    process.stdout.write(message);
    let active = true;

    const cleanup = () => {
      if (!active) return;
      active = false;
      process.stdin.removeListener("keypress", onKeypress);
    };

    const onKeypress = (_str, key) => {
      if (!active || !key) return;
      if (key.ctrl && key.name === "c") {
        process.stdout.write("\n");
        cleanup();
        process.exit(0);
        return;
      }
      if (key.name === "return" || key.name === "enter") {
        process.stdout.write("\n");
        cleanup();
        resolve();
      }
    };

    process.stdin.on("keypress", onKeypress);
  });
}

/**
 * Interactive arrow-key menu. Renders ★/☆ icons; selected line uses reverse+bright
 * (no underline). Uses readline keypress + raw 'data' fallback to prevent
 * arrow-key escape sequence leaks on macOS.
 */
async function selectMenu(title, items, defaultIndex = 0, subtitle = "", headerContent = "", breadcrumb = []) {
  return new Promise((resolve) => {
    let selectedIndex = defaultIndex;
    let isActive = true;

    primeRawOnce();
    if (!process.stdin.isTTY) { resolve(-1); return; }

    const renderMenu = () => {
      if (!isActive) return;
      process.stdout.write("\x1b[2J\x1b[H");
      const width = Math.min(process.stdout.columns || 40, 40);
      console.log(`\n${COLORS.terracotta}${"=".repeat(width)}${COLORS.reset}`);
      console.log(`  ${COLORS.bright}${COLORS.terracotta}${title}${COLORS.reset}`);
      if (subtitle) console.log(`  ${COLORS.dim}${subtitle}${COLORS.reset}`);
      console.log(`${COLORS.terracotta}${"=".repeat(width)}${COLORS.reset}`);
      if (breadcrumb.length > 0) console.log(`  ${COLORS.dim}${breadcrumb.join(" > ")}${COLORS.reset}`);
      console.log();
      if (headerContent) { console.log(headerContent); console.log(); }

      const isWin = process.platform === "win32";
      items.forEach((item, index) => {
        const isSelected = index === selectedIndex;
        const icon = isSelected ? (isWin ? ">" : "★") : (isWin ? " " : "☆");
        if (isSelected) {
          console.log(` ${COLORS.reverse}${COLORS.bright}${icon} ${item.label}${COLORS.reset}`);
        } else {
          console.log(`  ${icon} ${item.label}`);
        }
      });
    };

    const cleanup = () => {
      if (!isActive) return;
      isActive = false;
      process.stdin.removeListener("keypress", onKeypress);
    };

    const move = (delta) => {
      selectedIndex = (selectedIndex + delta + items.length) % items.length;
      renderMenu();
    };

    const onKeypress = (_str, key) => {
      if (!isActive || !key) return;
      if (key.name === "up") return move(-1);
      if (key.name === "down") return move(1);
      if (key.name === "return") { cleanup(); resolve(selectedIndex); return; }
      if (key.name === "escape") { cleanup(); resolve(-1); return; }
      if (key.ctrl && key.name === "c") { cleanup(); process.exit(0); }
    };

    process.stdin.on("keypress", onKeypress);
    renderMenu();
  });
}

module.exports = {
  prompt,
  select,
  confirm,
  pause,
  selectMenu,
  COLORS
};
