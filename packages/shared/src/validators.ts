import { z } from 'zod';

// ── Auth ─────────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
  orgName: z.string().min(1).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── Agent ────────────────────────────────────────────────────
export const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  hostname: z.string().min(1).max(255),
  os: z.string().min(1).max(50),
  localIp: z.string().ip().optional(),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(['online', 'offline', 'busy']).optional(),
});

// ── Session Template ─────────────────────────────────────────
export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  allowedDirs: z.array(z.string()).min(1),
  allowedTools: z.array(z.string()).default([]),
  blockedTools: z.array(z.string()).default([]),
  systemPrompt: z.string().max(5000).nullable().default(null),
  maxDuration: z.number().int().min(60).max(86400).default(3600),
});

export const updateTemplateSchema = createTemplateSchema.partial();

// ── Session ──────────────────────────────────────────────────
export const createSessionSchema = z.object({
  templateId: z.string().uuid(),
  agentId: z.string().uuid(),
  userId: z.string().uuid().optional(), // defaults to requester
});

// ── Team ─────────────────────────────────────────────────────
export const inviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'member']).default('member'),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
});

// ── Terminal resize ──────────────────────────────────────────
export const terminalResizeSchema = z.object({
  cols: z.number().int().min(1).max(500),
  rows: z.number().int().min(1).max(200),
});

// ── Pagination ───────────────────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Type exports ─────────────────────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type TerminalResizeInput = z.infer<typeof terminalResizeSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
