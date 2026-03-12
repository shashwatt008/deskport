import { execSync, spawn } from 'node:child_process';

// ── Tmux Controller ─────────────────────────────────────────────
// Manages tmux sessions for DeskPort terminal sessions.
// Each DeskPort session maps to a tmux session named "deskport-<sessionId>".

const SESSION_PREFIX = 'deskport-';

export interface TmuxSessionInfo {
  name: string;
  sessionId: string;
  created: string;
  attached: boolean;
  windows: number;
}

export class TmuxController {
  private tmuxPath: string;

  constructor() {
    this.tmuxPath = this.findTmux();
  }

  private findTmux(): string {
    try {
      const result = execSync('which tmux', { encoding: 'utf-8' }).trim();
      if (result) return result;
    } catch {
      // Not in PATH
    }

    // Common locations
    const paths = ['/usr/bin/tmux', '/usr/local/bin/tmux', '/opt/homebrew/bin/tmux'];
    for (const p of paths) {
      try {
        execSync(`test -x ${p}`);
        return p;
      } catch {
        continue;
      }
    }

    throw new Error('tmux is not installed. Please install tmux to use DeskPort.');
  }

  private exec(args: string[]): string {
    try {
      return execSync(`${this.tmuxPath} ${args.join(' ')}`, {
        encoding: 'utf-8',
        timeout: 10_000,
      }).trim();
    } catch (err: any) {
      // tmux returns exit code 1 for "no sessions" which is not an error
      if (err.status === 1 && err.stderr?.includes('no server running')) {
        return '';
      }
      throw err;
    }
  }

  private tmuxName(sessionId: string): string {
    return `${SESSION_PREFIX}${sessionId}`;
  }

  /**
   * Create a new tmux session for a DeskPort session.
   * The session runs the provided shell command with the given environment.
   */
  createSession(
    sessionId: string,
    shellCommand: string,
    env: Record<string, string>,
    cols: number = 80,
    rows: number = 24,
  ): void {
    const name = this.tmuxName(sessionId);

    // Build environment variable exports
    const envExports = Object.entries(env)
      .map(([k, v]) => `${k}=${this.escapeShellValue(v)}`)
      .join(' ');

    // Create detached tmux session
    const args = [
      'new-session',
      '-d',
      '-s', this.escapeShellArg(name),
      '-x', String(cols),
      '-y', String(rows),
      `env ${envExports} ${shellCommand}`,
    ];

    this.exec(args);
  }

  /**
   * Attach to a DeskPort tmux session (for local monitoring).
   * This spawns a child process with inherited stdio.
   */
  attachSession(sessionId: string): void {
    const name = this.tmuxName(sessionId);

    if (!this.sessionExists(name)) {
      throw new Error(`Session ${sessionId} does not exist`);
    }

    const child = spawn(this.tmuxPath, ['attach-session', '-t', name], {
      stdio: 'inherit',
    });

    child.on('error', (err) => {
      throw new Error(`Failed to attach to tmux session: ${err.message}`);
    });
  }

  /**
   * Kill a DeskPort tmux session.
   */
  killSession(sessionId: string): void {
    const name = this.tmuxName(sessionId);

    if (!this.sessionExists(name)) {
      return; // Already gone
    }

    try {
      this.exec(['kill-session', '-t', this.escapeShellArg(name)]);
    } catch {
      // Session may have already ended
    }
  }

  /**
   * List all active DeskPort tmux sessions.
   */
  listSessions(): TmuxSessionInfo[] {
    try {
      const format = '#{session_name}|#{session_created}|#{session_attached}|#{session_windows}';
      const output = this.exec([
        'list-sessions',
        '-F', `"${format}"`,
      ]);

      if (!output) return [];

      return output
        .split('\n')
        .filter((line) => line.includes(SESSION_PREFIX))
        .map((line) => {
          const cleaned = line.replace(/^"|"$/g, '');
          const [name, created, attached, windows] = cleaned.split('|');
          return {
            name: name || '',
            sessionId: (name || '').replace(SESSION_PREFIX, ''),
            created: created || '',
            attached: attached === '1',
            windows: parseInt(windows || '1', 10),
          };
        })
        .filter((info) => info.name.startsWith(SESSION_PREFIX));
    } catch {
      return [];
    }
  }

  /**
   * Send keystrokes to a tmux session.
   */
  sendKeys(sessionId: string, data: string): void {
    const name = this.tmuxName(sessionId);

    if (!this.sessionExists(name)) {
      throw new Error(`Session ${sessionId} does not exist`);
    }

    // Use send-keys with literal flag for raw input
    // For special characters, we pipe through send-keys -l
    this.exec([
      'send-keys',
      '-t', this.escapeShellArg(name),
      '-l',
      this.escapeShellArg(data),
    ]);
  }

  /**
   * Resize a tmux session window.
   */
  resizeSession(sessionId: string, cols: number, rows: number): void {
    const name = this.tmuxName(sessionId);

    if (!this.sessionExists(name)) {
      return;
    }

    try {
      this.exec([
        'resize-window',
        '-t', this.escapeShellArg(name),
        '-x', String(cols),
        '-y', String(rows),
      ]);
    } catch {
      // Resize failures are non-critical
    }
  }

  /**
   * Check if a tmux session exists.
   */
  private sessionExists(name: string): boolean {
    try {
      this.exec(['has-session', '-t', this.escapeShellArg(name)]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Escape a value for shell argument usage.
   */
  private escapeShellArg(arg: string): string {
    return `'${arg.replace(/'/g, "'\\''")}'`;
  }

  /**
   * Escape a value for use as a shell variable value.
   */
  private escapeShellValue(val: string): string {
    // Use single quotes to prevent expansion, escape embedded single quotes
    return `'${val.replace(/'/g, "'\\''")}'`;
  }
}
