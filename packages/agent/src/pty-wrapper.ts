import { EventEmitter } from 'node:events';
import * as os from 'node:os';
import type { IPty } from 'node-pty';
import type { SandboxEnvironment } from './sandbox.js';

// ── Events ──────────────────────────────────────────────────────
export interface PtyEvents {
  data: [data: string];
  exit: [exitCode: number, signal: number | undefined];
  error: [err: Error];
}

// ── Options ─────────────────────────────────────────────────────
export interface PtyOptions {
  cols?: number;
  rows?: number;
  sandbox: SandboxEnvironment;
}

// ── PTY Wrapper ─────────────────────────────────────────────────
export class PtyWrapper extends EventEmitter<PtyEvents> {
  private pty: IPty | null = null;
  private killed = false;
  private readonly sandbox: SandboxEnvironment;
  private cols: number;
  private rows: number;

  constructor(options: PtyOptions) {
    super();
    this.sandbox = options.sandbox;
    this.cols = options.cols || 80;
    this.rows = options.rows || 24;
  }

  get pid(): number | null {
    return this.pty?.pid ?? null;
  }

  get isAlive(): boolean {
    return this.pty !== null && !this.killed;
  }

  async spawn(): Promise<void> {
    // Dynamic import for node-pty (native module)
    const nodePty = await import('node-pty');

    const shell = this.sandbox.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : '/bin/bash');

    // Spawn with sandbox environment
    this.pty = nodePty.spawn(shell, ['--login'], {
      name: 'xterm-256color',
      cols: this.cols,
      rows: this.rows,
      cwd: this.sandbox.cwd,
      env: this.sandbox.env,
    });

    this.pty.onData((data: string) => {
      if (!this.killed) {
        this.emit('data', data);
      }
    });

    this.pty.onExit(({ exitCode, signal }: { exitCode: number; signal?: number }) => {
      this.killed = true;
      this.emit('exit', exitCode, signal);
    });
  }

  write(data: string): void {
    if (!this.pty || this.killed) {
      throw new Error('PTY not running');
    }
    this.pty.write(data);
  }

  resize(cols: number, rows: number): void {
    if (!this.pty || this.killed) {
      return;
    }
    this.cols = cols;
    this.rows = rows;
    try {
      this.pty.resize(cols, rows);
    } catch {
      // Resize can fail if the process exited between check and call
    }
  }

  kill(): void {
    if (!this.pty || this.killed) {
      return;
    }

    this.killed = true;

    try {
      this.pty.kill();
    } catch {
      // Process may have already exited
    }

    // Force kill after grace period
    const pid = this.pty.pid;
    setTimeout(() => {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        // Already dead
      }
    }, 5_000);
  }

  clear(): void {
    if (this.pty && !this.killed) {
      this.pty.write('\x1b[2J\x1b[H');
    }
  }
}
