// ── Organization ─────────────────────────────────────────────
export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  paypalSubscriptionId: string | null;
  ssoConfig: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── User ─────────────────────────────────────────────────────
export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  orgId: string;
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthPayload {
  userId: string;
  orgId: string;
  role: UserRole;
}

// ── Agent ────────────────────────────────────────────────────
export type AgentStatus = 'online' | 'offline' | 'busy';

export interface Agent {
  id: string;
  orgId: string;
  name: string;
  hostname: string;
  os: string;
  status: AgentStatus;
  apiKeyHash: string;
  lastHeartbeat: Date;
  localIp: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Session Template ─────────────────────────────────────────
export interface SessionTemplate {
  id: string;
  orgId: string;
  name: string;
  allowedDirs: string[];
  allowedTools: string[];
  blockedTools: string[];
  systemPrompt: string | null;
  maxDuration: number; // seconds
  createdAt: Date;
  updatedAt: Date;
}

// ── Session ──────────────────────────────────────────────────
export type SessionStatus = 'pending' | 'active' | 'ended' | 'error';

export interface Session {
  id: string;
  orgId: string;
  templateId: string;
  agentId: string;
  userId: string;
  status: SessionStatus;
  recordingUrl: string | null;
  tmuxSession: string | null;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Audit Log ────────────────────────────────────────────────
export type AuditEventType =
  | 'session.created'
  | 'session.started'
  | 'session.ended'
  | 'agent.connected'
  | 'agent.disconnected'
  | 'user.login'
  | 'user.invited'
  | 'user.removed'
  | 'template.created'
  | 'template.updated'
  | 'template.deleted';

export interface AuditLog {
  id: string;
  orgId: string;
  sessionId: string | null;
  userId: string | null;
  eventType: AuditEventType;
  payload: Record<string, unknown>;
  createdAt: Date;
}
