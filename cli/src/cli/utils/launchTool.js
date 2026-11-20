const { spawn, execSync } = require("child_process");
const path = require("path");
const os = require("os");
const api = require("../api/client");
const { showStatus } = require("./display");
const { pause, confirm } = require("./input");

// Executable name for each CLI tool, keyed by the tool id used by the
// /api/cli-tools/*-settings endpoints.
const TOOL_COMMANDS = {
  claude: { command: "claude", name: "Claude Code" },
  codex: { command: "codex", name: "Codex CLI" },
  droid: { command: "droid", name: "Factory Droid" },
  openclaw: { command: "openclaw", name: "Open Claw" },
  opencode: { command: "opencode", name: "OpenCode" },
  hermes: { command: "hermes", name: "Hermes Agent" },
};

// npm global binaries often are not on PATH even though `where` inside the
// dashboard adds them. Mirror that here so launching works in the same situation.
function withNpmPath(baseEnv) {
  const env = { ...baseEnv };
  if (process.platform === "win32") {
    const appdata = env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    const npmBin = path.join(appdata, "npm");
    const pathKey = Object.keys(env).find((k) => k.toLowerCase() === "path") || "PATH";
    const current = env[pathKey] || "";
    const parts = current.split(path.delimiter);
    if (!parts.some((p) => p.toLowerCase() === npmBin.toLowerCase())) {
      env[pathKey] = `${npmBin}${path.delimiter}${current}`;
    }
  }
  return env;
}

function isInstalled(command) {
  const checker = process.platform === "win32" ? "where" : "which";
  try {
    execSync(`${checker} ${command}`, {
      stdio: "ignore",
      windowsHide: true,
      env: withNpmPath(process.env),
    });
    return true;
  } catch {
    return false;
  }
}

// Start the tool in its own terminal window so it behaves exactly like running
// the command by hand (it picks up the Dissector config written by Quick Setup).
function spawnInNewWindow(command) {
  const env = withNpmPath(process.env);

  if (process.platform === "win32") {
    // `start` treats the FIRST quoted token as the window title. Passing a title
    // like "OpenCode (Dissector)" through Node's argv quoting escapes the inner
    // quotes into \"OpenCode (Dissector)\"", and `start` mis-parses that as a
    // command named `(Dissector)\` -> "Windows cannot find '(Dissector)\'".
    //
    // Fix: use an EMPTY title (`""`) and build the whole command line as one
    // string with windowsVerbatimArguments:true so Node does not re-quote it.
    // All tool commands are plain executable names, so this stays unambiguous.
    const commandLine = `start "" cmd /k ${command}`;
    if (process.env.DISSECTOR_LAUNCH_DEBUG) {
      console.log(`[Dissector launch] cmd.exe /d /c ${commandLine}`);
    }
    const child = spawn("cmd.exe", ["/d", "/c", commandLine], {
      detached: true,
      stdio: "ignore",
      windowsHide: false,
      env,
      windowsVerbatimArguments: true,
    });
    child.unref();
    return;
  }

  if (process.platform === "darwin") {
    const script = `tell application "Terminal" to do script "${command.replace(/"/g, '\\"')}"`;
    const child = spawn("osascript", ["-e", script], { detached: true, stdio: "ignore", env });
    child.unref();
    return;
  }

  // Linux: use a terminal emulator when available, otherwise surface a clear error.
  const candidates = [
    ["x-terminal-emulator", ["-e", command]],
    ["gnome-terminal", ["--", "bash", "-lc", `${command}; exec bash`]],
    ["konsole", ["-e", command]],
    ["xfce4-terminal", ["-e", command]],
    ["xterm", ["-e", command]],
  ];
  for (const [bin, args] of candidates) {
    try {
      const child = spawn(bin, args, { detached: true, stdio: "ignore", env });
      child.unref();
      return;
    } catch {
      // Try the next emulator.
    }
  }
  throw new Error("No terminal emulator found. Install x-terminal-emulator or xterm.");
}

/**
 * Launch a CLI tool as a real app window, pointed at Dissector.
 * @param {string} toolKey - id used by the cli-tools settings API
 * @param {Object} [options]
 * @param {Function} [options.setupFn] - Quick Setup to offer when not configured
 */
async function launchTool(toolKey, options = {}) {
  const tool = TOOL_COMMANDS[toolKey];
  if (!tool) {
    showStatus(`Unknown tool: ${toolKey}`, "error");
    await pause();
    return;
  }

  if (!isInstalled(tool.command)) {
    showStatus(`${tool.name} CLI not found on PATH. Install it first, then try again.`, "error");
    await pause();
    return;
  }

  // If the tool is not routed through Dissector yet, offer to configure it so
  // the launched window actually uses Dissector instead of its default endpoint.
  try {
    const result = await api.getCliToolSettings(toolKey);
    const configured = result?.success && result.data?.hasDissector === true;
    if (!configured) {
      if (options.setupFn) {
        const doSetup = await confirm(
          `${tool.name} is not pointed at Dissector. Run Quick Setup first?`
        );
        if (doSetup) {
          await options.setupFn();
        }
      } else {
        showStatus(
          `${tool.name} may not be routed through Dissector. Run Quick Setup in CLI Tools first.`,
          "warning"
        );
      }
    }
  } catch {
    // A failed status check should not block launching.
  }

  try {
    spawnInNewWindow(tool.command);
    showStatus(`${tool.name} launched in a new window.`, "success");
  } catch (error) {
    showStatus(`Could not launch ${tool.name}: ${error.message}`, "error");
  }
  await pause();
}

module.exports = { launchTool, TOOL_COMMANDS };
