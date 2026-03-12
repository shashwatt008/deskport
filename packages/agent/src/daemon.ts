import chalk from 'chalk';
import type {
  AnyTunnelMessage,
  TunnelSessionCreateMessage,
  TunnelSessionEndMessage,
  TunnelTerminalInputMessage,
  TunnelTerminalResizeMessage,
  TunnelHeartbeatMessage,
  TunnelSessionCreatedMessage,
  TunnelSessionEndedMessage,
  TunnelSessionErrorMessage,
  TunnelTerminalOutputMessage,
} from '@deskport/shared';
import { Tunnel } from './tunnel.js';
import { SessionManager } from './session-manager.js';
import type { AgentConfig } from './cli.js';

// ── Daemon ──────────────────────────────────────────────────────
export class Daemon {
  private tunnel: Tunnel;
  private sessionManager: SessionManager;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private running = false;

  private readonly HEARTBEAT_INTERVAL = 30_000; // 30 seconds

  constructor(private config: AgentConfig) {
    this.tunnel = new Tunnel({
      serverUrl: config.serverUrl,
      agentId: config.agentId,
      apiKey: config.apiKey,
    });

    this.sessionManager = new SessionManager();
    this.wireEvents();
  }

  /**
   * Start the daemon: connect to cloud, begin heartbeats.
   */
  async start(): Promise<void> {
    if (this.running) {
      throw new Error('Daemon already running');
    }

    this.running = true;

    return new Promise<void>((resolve, reject) => {
      const onAuth = (agentId: string) => {
        cleanup();
        this.startHeartbeat();
        this.log('info', `Authenticated as agent ${agentId}`);
        resolve();
      };

      const onAuthError = (message: string) => {
        cleanup();
        reject(new Error(`Authentication failed: ${message}`));
      };

      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };

      const cleanup = () => {
        this.tunnel.removeListener('authenticated', onAuth);
        this.tunnel.removeListener('auth-error', onAuthError);
        this.tunnel.removeListener('error', onError);
      };

      this.tunnel.once('authenticated', onAuth);
      this.tunnel.once('auth-error', onAuthError);
      this.tunnel.once('error', onError);

      // Set a timeout for initial connection
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Connection timeout: could not connect to cloud server'));
      }, 15_000);

      this.tunnel.once('authenticated', () => clearTimeout(timeout));
      this.tunnel.once('auth-error', () => clearTimeout(timeout));
      this.tunnel.once('error', () => clearTimeout(timeout));

      this.tunnel.connect();
    });
  }

  /**
   * Stop the daemon: disconnect tunnel, end all sessions.
   */
  async stop(): Promise<void> {
    this.running = false;
    this.stopHeartbeat();
    this.sessionManager.endAllSessions();
    this.tunnel.disconnect();
    this.log('info', 'Daemon stopped');
  }

  // ── Event Wiring ──────────────────────────────────────────────
  private wireEvents(): void {
    // Tunnel events
    this.tunnel.on('connected', () => {
      this.log('info', 'Connected to cloud server');
    });

    this.tunnel.on('disconnected', (code, reason) => {
      this.log('warn', `Disconnected from cloud (code=${code}, reason=${reason})`);
      this.stopHeartbeat();
    });

    this.tunnel.on('authenticated', () => {
      // Re-start heartbeats on reconnection
      this.startHeartbeat();
    });

    this.tunnel.on('auth-error', (message) => {
      this.log('error', `Auth error: ${message}`);
    });

    this.tunnel.on('error', (err) => {
      this.log('error', `Tunnel error: ${err.message}`);
    });

    this.tunnel.on('message', (msg) => {
      this.handleMessage(msg);
    });

    // Session manager events
    this.sessionManager.on('session-created', (sessionId, tmuxSession) => {
      this.log('info', `Session created: ${sessionId} (tmux: ${tmuxSession})`);
      this.sendMessage({
        type: 'session.created',
        sessionId,
        payload: { tmuxSession },
      } as TunnelSessionCreatedMessage);
    });

    this.sessionManager.on('session-error', (sessionId, error) => {
      this.log('error', `Session error [${sessionId}]: ${error}`);
      this.sendMessage({
        type: 'session.error',
        sessionId,
        payload: { message: error },
      } as TunnelSessionErrorMessage);
    });

    this.sessionManager.on('session-ended', (sessionId, recording) => {
      this.log('info', `Session ended: ${sessionId}`);
      this.sendMessage({
        type: 'session.ended',
        sessionId,
        payload: { recording },
      } as TunnelSessionEndedMessage);
    });

    this.sessionManager.on('session-output', (sessionId, data) => {
      this.sendMessage({
        type: 'terminal.output',
        sessionId,
        payload: { data },
      } as TunnelTerminalOutputMessage);
    });
  }

  // ── Message Handling ──────────────────────────────────────────
  private handleMessage(msg: AnyTunnelMessage): void {
    switch (msg.type) {
      case 'session.create':
        this.handleSessionCreate(msg as TunnelSessionCreateMessage);
        break;

      case 'session.end':
        this.handleSessionEnd(msg as TunnelSessionEndMessage);
        break;

      case 'terminal.input':
        this.handleTerminalInput(msg as TunnelTerminalInputMessage);
        break;

      case 'terminal.resize':
        this.handleTerminalResize(msg as TunnelTerminalResizeMessage);
        break;

      case 'heartbeat.ack':
        // Heartbeat acknowledged, nothing to do
        break;

      default:
        this.log('warn', `Unhandled message type: ${msg.type}`);
        break;
    }
  }

  private handleSessionCreate(msg: TunnelSessionCreateMessage): void {
    this.log('info', `Session create request: ${msg.sessionId}`);
    this.sessionManager.createSession(msg).catch((err) => {
      this.log('error', `Failed to create session: ${err.message}`);
    });
  }

  private handleSessionEnd(msg: TunnelSessionEndMessage): void {
    this.log('info', `Session end request: ${msg.sessionId}`);
    this.sessionManager.endSession(msg.sessionId);
  }

  private handleTerminalInput(msg: TunnelTerminalInputMessage): void {
    try {
      this.sessionManager.writeInput(msg.sessionId, msg.payload.data);
    } catch (err: any) {
      this.log('warn', `Terminal input error [${msg.sessionId}]: ${err.message}`);
    }
  }

  private handleTerminalResize(msg: TunnelTerminalResizeMessage): void {
    this.sessionManager.resizeSession(msg.sessionId, msg.payload.cols, msg.payload.rows);
  }

  // ── Heartbeat ─────────────────────────────────────────────────
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (!this.tunnel.isConnected || !this.tunnel.isAuthenticated) {
        return;
      }

      try {
        this.sendMessage({
          type: 'heartbeat',
          payload: {
            timestamp: Date.now(),
            activeSessions: this.sessionManager.activeSessions,
          },
        } as TunnelHeartbeatMessage);
      } catch (err: any) {
        this.log('warn', `Heartbeat failed: ${err.message}`);
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ── Helpers ───────────────────────────────────────────────────
  private sendMessage(msg: AnyTunnelMessage): void {
    try {
      this.tunnel.send(msg);
    } catch (err: any) {
      this.log('error', `Failed to send message: ${err.message}`);
    }
  }

  private log(level: 'info' | 'warn' | 'error', message: string): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}]`;

    switch (level) {
      case 'info':
        console.log(`${chalk.dim(prefix)} ${chalk.blue('INFO')}  ${message}`);
        break;
      case 'warn':
        console.log(`${chalk.dim(prefix)} ${chalk.yellow('WARN')}  ${message}`);
        break;
      case 'error':
        console.error(`${chalk.dim(prefix)} ${chalk.red('ERROR')} ${message}`);
        break;
    }
  }
}
