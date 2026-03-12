import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// ── Types ───────────────────────────────────────────────────────
export interface SandboxConfig {
  sessionId: string;
  allowedDirs: string[];
  allowedTools: string[];
  blockedTools: string[];
}

export interface SandboxEnvironment {
  cwd: string;
  env: Record<string, string>;
  sandboxDir: string;
  binDir: string;
  homeDir: string;
  ulimitCommands: string[];
}

// ── Default system tools always available ───────────────────────
const DEFAULT_TOOLS = [
  'ls', 'cat', 'head', 'tail', 'grep', 'find', 'wc', 'sort', 'uniq',
  'cut', 'tr', 'sed', 'awk', 'echo', 'printf', 'test', 'true', 'false',
  'pwd', 'cd', 'mkdir', 'rmdir', 'touch', 'cp', 'mv', 'rm',
  'chmod', 'date', 'env', 'which', 'whoami', 'hostname',
  'less', 'more', 'diff', 'tee', 'xargs', 'basename', 'dirname',
  'readlink', 'realpath', 'stat', 'file',
];

// ── Tool resolution ─────────────────────────────────────────────
function findToolPath(tool: string): string | null {
  const systemPaths = (process.env.PATH || '/usr/bin:/bin:/usr/local/bin').split(':');

  for (const dir of systemPaths) {
    const fullPath = path.join(dir, tool);
    try {
      fs.accessSync(fullPath, fs.constants.X_OK);
      return fullPath;
    } catch {
      // Not found in this directory
    }
  }
  return null;
}

// ── Sandbox creation ────────────────────────────────────────────
export function createSandbox(config: SandboxConfig): SandboxEnvironment {
  // Validate at least one allowed directory exists
  const validDirs = config.allowedDirs.filter((dir) => {
    const resolved = path.resolve(dir);
    try {
      const stat = fs.statSync(resolved);
      return stat.isDirectory();
    } catch {
      return false;
    }
  });

  if (validDirs.length === 0) {
    throw new Error(
      `None of the allowed directories exist: ${config.allowedDirs.join(', ')}`,
    );
  }

  // Use first valid directory as CWD
  const cwd = path.resolve(validDirs[0]);

  // Create sandbox directory structure
  const sandboxDir = path.join(os.tmpdir(), 'deskport', config.sessionId);
  const binDir = path.join(sandboxDir, 'bin');
  const homeDir = path.join(sandboxDir, 'home');

  fs.mkdirSync(binDir, { recursive: true });
  fs.mkdirSync(homeDir, { recursive: true });

  // Determine which tools to expose
  const blockedSet = new Set(config.blockedTools.map((t) => t.toLowerCase()));
  let toolsToExpose: string[];

  if (config.allowedTools.length > 0) {
    // Explicit allowlist: only these tools (minus blocked)
    toolsToExpose = config.allowedTools.filter(
      (t) => !blockedSet.has(t.toLowerCase()),
    );
  } else {
    // No explicit allowlist: use defaults minus blocked
    toolsToExpose = DEFAULT_TOOLS.filter(
      (t) => !blockedSet.has(t.toLowerCase()),
    );
  }

  // Create symlinks for allowed tools
  for (const tool of toolsToExpose) {
    const toolPath = findToolPath(tool);
    if (toolPath) {
      const linkPath = path.join(binDir, tool);
      try {
        // Remove existing symlink if present
        try {
          fs.unlinkSync(linkPath);
        } catch {
          // Doesn't exist yet
        }
        fs.symlinkSync(toolPath, linkPath);
      } catch (err) {
        // Skip tools that fail to symlink (non-critical)
      }
    }
  }

  // Also symlink the user's shell so the pty can spawn it
  const shell = process.env.SHELL || '/bin/bash';
  const shellName = path.basename(shell);
  const shellLink = path.join(binDir, shellName);
  try {
    try { fs.unlinkSync(shellLink); } catch { /* noop */ }
    fs.symlinkSync(shell, shellLink);
  } catch {
    // Fall back — shell must be accessible
  }

  // Build environment variables
  const env: Record<string, string> = {
    PATH: binDir,
    HOME: homeDir,
    USER: os.userInfo().username,
    SHELL: shell,
    TERM: 'xterm-256color',
    LANG: 'en_US.UTF-8',
    DESKPORT_SESSION_ID: config.sessionId,
    DESKPORT_SANDBOX: '1',
    // Prevent history leakage
    HISTFILE: path.join(homeDir, '.bash_history'),
    HISTSIZE: '1000',
    // Limit directory traversal: the user can still cd, but the
    // restricted PATH prevents running unexpected binaries
  };

  // Add allowed dirs as a readable env var
  env.DESKPORT_ALLOWED_DIRS = validDirs.join(':');

  // ulimit restrictions
  const ulimitCommands = [
    'ulimit -u 256',         // max user processes
    'ulimit -f 102400',      // max file size (50MB in 512-byte blocks)
    'ulimit -v 2097152',     // max virtual memory (2GB in KB)
    'ulimit -n 256',         // max open files
    'ulimit -t 3600',        // max CPU time (seconds)
  ];

  // Write a minimal .bashrc for the sandbox
  const bashrc = [
    '# DeskPort Sandbox Shell',
    `export PS1="[deskport] \\w $ "`,
    ...ulimitCommands,
    `cd "${cwd}"`,
    '',
  ].join('\n');

  fs.writeFileSync(path.join(homeDir, '.bashrc'), bashrc, 'utf-8');
  fs.writeFileSync(path.join(homeDir, '.profile'), bashrc, 'utf-8');

  // Write a minimal .zshrc as well
  const zshrc = [
    '# DeskPort Sandbox Shell',
    `export PS1="[deskport] %~ $ "`,
    ...ulimitCommands,
    `cd "${cwd}"`,
    '',
  ].join('\n');

  fs.writeFileSync(path.join(homeDir, '.zshrc'), zshrc, 'utf-8');

  return {
    cwd,
    env,
    sandboxDir,
    binDir,
    homeDir,
    ulimitCommands,
  };
}

// ── Cleanup ─────────────────────────────────────────────────────
export function destroySandbox(sandboxDir: string): void {
  try {
    fs.rmSync(sandboxDir, { recursive: true, force: true });
  } catch {
    // Best effort cleanup
  }
}
