// ── Tunnel Message Protocol ──────────────────────────────────
// All messages between Cloud ↔ Agent are JSON over WebSocket

export type TunnelMessageType =
  | 'auth'
  | 'auth.ok'
  | 'auth.error'
  | 'heartbeat'
  | 'heartbeat.ack'
  | 'session.create'
  | 'session.created'
  | 'session.error'
  | 'session.end'
  | 'session.ended'
  | 'terminal.input'
  | 'terminal.output'
  | 'terminal.resize';

export interface TunnelMessage {
  type: TunnelMessageType;
  sessionId?: string;
  payload?: unknown;
}

// ── Auth ─────────────────────────────────────────────────────
export interface TunnelAuthMessage extends TunnelMessage {
  type: 'auth';
  payload: {
    agentId: string;
    apiKey: string;
  };
}

export interface TunnelAuthOkMessage extends TunnelMessage {
  type: 'auth.ok';
  payload: {
    agentId: string;
  };
}

export interface TunnelAuthErrorMessage extends TunnelMessage {
  type: 'auth.error';
  payload: {
    message: string;
  };
}

// ── Heartbeat ────────────────────────────────────────────────
export interface TunnelHeartbeatMessage extends TunnelMessage {
  type: 'heartbeat';
  payload: {
    timestamp: number;
    activeSessions: number;
  };
}

export interface TunnelHeartbeatAckMessage extends TunnelMessage {
  type: 'heartbeat.ack';
  payload: {
    timestamp: number;
  };
}

// ── Session lifecycle ────────────────────────────────────────
export interface TunnelSessionCreateMessage extends TunnelMessage {
  type: 'session.create';
  sessionId: string;
  payload: {
    templateId: string;
    allowedDirs: string[];
    allowedTools: string[];
    blockedTools: string[];
    systemPrompt: string | null;
    maxDuration: number;
  };
}

export interface TunnelSessionCreatedMessage extends TunnelMessage {
  type: 'session.created';
  sessionId: string;
  payload: {
    tmuxSession: string;
  };
}

export interface TunnelSessionErrorMessage extends TunnelMessage {
  type: 'session.error';
  sessionId: string;
  payload: {
    message: string;
  };
}

export interface TunnelSessionEndMessage extends TunnelMessage {
  type: 'session.end';
  sessionId: string;
}

export interface TunnelSessionEndedMessage extends TunnelMessage {
  type: 'session.ended';
  sessionId: string;
  payload: {
    recording: string | null; // base64 asciicast or S3 key
  };
}

// ── Terminal I/O ─────────────────────────────────────────────
export interface TunnelTerminalInputMessage extends TunnelMessage {
  type: 'terminal.input';
  sessionId: string;
  payload: {
    data: string;
  };
}

export interface TunnelTerminalOutputMessage extends TunnelMessage {
  type: 'terminal.output';
  sessionId: string;
  payload: {
    data: string;
  };
}

export interface TunnelTerminalResizeMessage extends TunnelMessage {
  type: 'terminal.resize';
  sessionId: string;
  payload: {
    cols: number;
    rows: number;
  };
}

// ── Discriminated union helper ───────────────────────────────
export type AnyTunnelMessage =
  | TunnelAuthMessage
  | TunnelAuthOkMessage
  | TunnelAuthErrorMessage
  | TunnelHeartbeatMessage
  | TunnelHeartbeatAckMessage
  | TunnelSessionCreateMessage
  | TunnelSessionCreatedMessage
  | TunnelSessionErrorMessage
  | TunnelSessionEndMessage
  | TunnelSessionEndedMessage
  | TunnelTerminalInputMessage
  | TunnelTerminalOutputMessage
  | TunnelTerminalResizeMessage;

export function parseTunnelMessage(raw: string): AnyTunnelMessage {
  return JSON.parse(raw) as AnyTunnelMessage;
}

export function serializeTunnelMessage(msg: AnyTunnelMessage): string {
  return JSON.stringify(msg);
}
