import { EventEmitter } from 'node:events';
import WebSocket from 'ws';
import {
  type AnyTunnelMessage,
  type TunnelAuthMessage,
  parseTunnelMessage,
  serializeTunnelMessage,
} from '@deskport/shared';

// ── Events ──────────────────────────────────────────────────────
export interface TunnelEvents {
  connected: [];
  disconnected: [code: number, reason: string];
  authenticated: [agentId: string];
  'auth-error': [message: string];
  message: [msg: AnyTunnelMessage];
  error: [err: Error];
}

// ── Config ──────────────────────────────────────────────────────
export interface TunnelConfig {
  serverUrl: string;
  agentId: string;
  apiKey: string;
  reconnect?: boolean;
  maxReconnectDelay?: number;
  initialReconnectDelay?: number;
}

// ── Tunnel ──────────────────────────────────────────────────────
export class Tunnel extends EventEmitter<TunnelEvents> {
  private ws: WebSocket | null = null;
  private config: Required<TunnelConfig>;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private authenticated = false;

  constructor(config: TunnelConfig) {
    super();
    this.config = {
      reconnect: true,
      maxReconnectDelay: 30_000,
      initialReconnectDelay: 1_000,
      ...config,
    };
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get isAuthenticated(): boolean {
    return this.authenticated;
  }

  connect(): void {
    this.intentionalClose = false;
    this.createConnection();
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.authenticated = false;
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.removeAllListeners();
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, 'Agent shutting down');
      }
      this.ws = null;
    }
  }

  send(msg: AnyTunnelMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Tunnel not connected');
    }
    this.ws.send(serializeTunnelMessage(msg));
  }

  // ── Private ─────────────────────────────────────────────────
  private createConnection(): void {
    if (this.ws) {
      this.ws.removeAllListeners();
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
    }

    this.ws = new WebSocket(this.config.serverUrl, {
      headers: {
        'x-agent-id': this.config.agentId,
      },
      handshakeTimeout: 10_000,
    });

    this.ws.on('open', () => {
      this.reconnectAttempts = 0;
      this.emit('connected');
      this.sendAuth();
    });

    this.ws.on('message', (raw: WebSocket.RawData) => {
      try {
        const msg = parseTunnelMessage(raw.toString());
        this.handleMessage(msg);
      } catch (err) {
        this.emit('error', new Error(`Failed to parse tunnel message: ${err}`));
      }
    });

    this.ws.on('close', (code: number, reason: Buffer) => {
      const wasAuthenticated = this.authenticated;
      this.authenticated = false;
      this.emit('disconnected', code, reason.toString());

      if (!this.intentionalClose && this.config.reconnect) {
        this.scheduleReconnect();
      }
    });

    this.ws.on('error', (err: Error) => {
      this.emit('error', err);
    });
  }

  private sendAuth(): void {
    const authMsg: TunnelAuthMessage = {
      type: 'auth',
      payload: {
        agentId: this.config.agentId,
        apiKey: this.config.apiKey,
      },
    };
    this.send(authMsg);
  }

  private handleMessage(msg: AnyTunnelMessage): void {
    switch (msg.type) {
      case 'auth.ok':
        this.authenticated = true;
        this.emit('authenticated', msg.payload.agentId);
        break;

      case 'auth.error':
        this.authenticated = false;
        this.emit('auth-error', msg.payload.message);
        // Don't reconnect on auth failure
        this.intentionalClose = true;
        this.ws?.close(4001, 'Authentication failed');
        break;

      default:
        // Forward all other messages to listeners
        this.emit('message', msg);
        break;
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimer();

    const delay = Math.min(
      this.config.initialReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.config.maxReconnectDelay,
    );

    // Add jitter: +/- 20%
    const jitter = delay * 0.2 * (Math.random() * 2 - 1);
    const finalDelay = Math.round(delay + jitter);

    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.createConnection();
    }, finalDelay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
