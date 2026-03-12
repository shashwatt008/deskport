import { EventEmitter } from 'node:events';
import type {
  TunnelSessionCreateMessage,
} from '@deskport/shared';
import { createSandbox, destroySandbox, type SandboxEnvironment } from './sandbox.js';
import { PtyWrapper } from './pty-wrapper.js';
import { TmuxController } from './tmux-controller.js';
import { Recording, startRecording } from './recording.js';

// ── Types ───────────────────────────────────────────────────────
export interface ActiveSession {
  sessionId: string;
  pty: PtyWrapper;
  recording: Recording;
  sandbox: SandboxEnvironment;
  maxDuration: number;
  durationTimer: ReturnType<typeof setTimeout> | null;
  createdAt: number;
}

export interface SessionManagerEvents {
  'session-created': [sessionId: string, tmuxSession: string];
  'session-error': [sessionId: string, error: string];
  'session-ended': [sessionId: string, recording: string | null];
  'session-output': [sessionId: string, data: string];
}

// ── Session Manager ─────────────────────────────────────────────
export class SessionManager extends EventEmitter<SessionManagerEvents> {
  private sessions = new Map<string, ActiveSession>();
  private tmux: TmuxController;

  constructor() {
    super();
    this.tmux = new TmuxController();
  }

  get activeSessions(): number {
    return this.sessions.size;
  }

  getSessionIds(): string[] {
    return Array.from(this.sessions.keys());
  }

  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * Create a new sandboxed session from a cloud request.
   */
  async createSession(msg: TunnelSessionCreateMessage): Promise<void> {
    const { sessionId } = msg;
    const { allowedDirs, allowedTools, blockedTools, maxDuration } = msg.payload;

    if (this.sessions.has(sessionId)) {
      this.emit('session-error', sessionId, 'Session already exists');
      return;
    }

    try {
      // 1. Create sandbox environment
      const sandbox = createSandbox({
        sessionId,
        allowedDirs,
        allowedTools,
        blockedTools,
      });

      // 2. Start recording
      const recording = startRecording(sessionId, 80, 24);

      // 3. Create PTY with sandbox
      const pty = new PtyWrapper({
        cols: 80,
        rows: 24,
        sandbox,
      });

      // 4. Create tmux session
      const shell = sandbox.env.SHELL || '/bin/bash';
      this.tmux.createSession(sessionId, `${shell} --login`, sandbox.env, 80, 24);
      const tmuxSession = `deskport-${sessionId}`;

      // 5. Wire up PTY events
      pty.on('data', (data: string) => {
        recording.writeOutput(data);
        this.emit('session-output', sessionId, data);
      });

      pty.on('exit', (exitCode: number) => {
        this.endSession(sessionId);
      });

      pty.on('error', (err: Error) => {
        this.emit('session-error', sessionId, err.message);
        this.endSession(sessionId);
      });

      // 6. Spawn PTY
      await pty.spawn();

      // 7. Set up max duration timer
      let durationTimer: ReturnType<typeof setTimeout> | null = null;
      if (maxDuration > 0) {
        durationTimer = setTimeout(() => {
          this.endSession(sessionId);
        }, maxDuration * 1000);
      }

      // 8. Store session
      const session: ActiveSession = {
        sessionId,
        pty,
        recording,
        sandbox,
        maxDuration,
        durationTimer,
        createdAt: Date.now(),
      };

      this.sessions.set(sessionId, session);

      this.emit('session-created', sessionId, tmuxSession);
    } catch (err: any) {
      this.emit('session-error', sessionId, err.message || 'Failed to create session');
    }
  }

  /**
   * End a session, clean up resources, and return the recording.
   */
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Remove from map first to prevent re-entrant calls
    this.sessions.delete(sessionId);

    // Clear duration timer
    if (session.durationTimer) {
      clearTimeout(session.durationTimer);
    }

    // Kill PTY
    session.pty.kill();

    // Kill tmux session
    try {
      this.tmux.killSession(sessionId);
    } catch {
      // Non-critical
    }

    // Finalize recording
    let recordingData: string | null = null;
    try {
      recordingData = session.recording.endRecording();
    } catch {
      // Recording may have already ended
    }

    // Destroy sandbox
    destroySandbox(session.sandbox.sandboxDir);

    this.emit('session-ended', sessionId, recordingData);
  }

  /**
   * Send terminal input to a session's PTY.
   */
  writeInput(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.recording.writeInput(data);
    session.pty.write(data);
  }

  /**
   * Resize a session's PTY and tmux window.
   */
  resizeSession(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.pty.resize(cols, rows);
    session.recording.updateDimensions(cols, rows);

    try {
      this.tmux.resizeSession(sessionId, cols, rows);
    } catch {
      // Non-critical
    }
  }

  /**
   * End all active sessions. Used during shutdown.
   */
  endAllSessions(): void {
    const sessionIds = Array.from(this.sessions.keys());
    for (const sessionId of sessionIds) {
      this.endSession(sessionId);
    }
  }
}
