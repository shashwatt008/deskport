import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ── Organizations ───────────────────────────────────────────────
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  plan: varchar('plan', { length: 20 }).notNull().default('free'),
  paypalSubscriptionId: varchar('paypal_subscription_id', { length: 255 }),
  ssoConfig: jsonb('sso_config'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  agents: many(agents),
  sessionTemplates: many(sessionTemplates),
  sessions: many(sessions),
  auditLogs: many(auditLogs),
}));

// ── Users ───────────────────────────────────────────────────────
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 100 }).notNull(),
    role: varchar('role', { length: 20 }).notNull().default('member'),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('users_org_id_idx').on(table.orgId),
    index('users_email_idx').on(table.email),
  ],
);

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.orgId],
    references: [organizations.id],
  }),
}));

// ── Agents ──────────────────────────────────────────────────────
export const agents = pgTable(
  'agents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    hostname: varchar('hostname', { length: 255 }).notNull(),
    os: varchar('os', { length: 50 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('offline'),
    apiKeyHash: text('api_key_hash').notNull(),
    lastHeartbeat: timestamp('last_heartbeat', { withTimezone: true }),
    localIp: varchar('local_ip', { length: 45 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('agents_org_id_idx').on(table.orgId),
  ],
);

export const agentsRelations = relations(agents, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [agents.orgId],
    references: [organizations.id],
  }),
  sessions: many(sessions),
}));

// ── Session Templates ───────────────────────────────────────────
export const sessionTemplates = pgTable(
  'session_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    allowedDirs: jsonb('allowed_dirs').notNull().$type<string[]>(),
    allowedTools: jsonb('allowed_tools').notNull().$type<string[]>().default([]),
    blockedTools: jsonb('blocked_tools').notNull().$type<string[]>().default([]),
    systemPrompt: text('system_prompt'),
    maxDuration: integer('max_duration').notNull().default(3600),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('session_templates_org_id_idx').on(table.orgId),
  ],
);

export const sessionTemplatesRelations = relations(sessionTemplates, ({ one }) => ({
  organization: one(organizations, {
    fields: [sessionTemplates.orgId],
    references: [organizations.id],
  }),
}));

// ── Sessions ────────────────────────────────────────────────────
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    templateId: uuid('template_id')
      .notNull()
      .references(() => sessionTemplates.id),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    recordingUrl: text('recording_url'),
    tmuxSession: varchar('tmux_session', { length: 255 }),
    startedAt: timestamp('started_at', { withTimezone: true }),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('sessions_org_id_idx').on(table.orgId),
    index('sessions_agent_id_idx').on(table.agentId),
    index('sessions_user_id_idx').on(table.userId),
    index('sessions_status_idx').on(table.status),
  ],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  organization: one(organizations, {
    fields: [sessions.orgId],
    references: [organizations.id],
  }),
  template: one(sessionTemplates, {
    fields: [sessions.templateId],
    references: [sessionTemplates.id],
  }),
  agent: one(agents, {
    fields: [sessions.agentId],
    references: [agents.id],
  }),
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// ── Audit Logs ──────────────────────────────────────────────────
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id'),
    userId: uuid('user_id'),
    eventType: varchar('event_type', { length: 50 }).notNull(),
    payload: jsonb('payload').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('audit_logs_org_id_idx').on(table.orgId),
    index('audit_logs_event_type_idx').on(table.eventType),
    index('audit_logs_created_at_idx').on(table.createdAt),
  ],
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.orgId],
    references: [organizations.id],
  }),
}));

// ── Subscriptions ──────────────────────────────────────────────
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    paypalSubscriptionId: varchar('paypal_subscription_id', { length: 255 }).notNull().unique(),
    paypalPlanId: varchar('paypal_plan_id', { length: 255 }).notNull(),
    status: varchar('status', { length: 30 }).notNull().default('pending'),
    plan: varchar('plan', { length: 20 }).notNull().default('pro'),
    seatLimit: integer('seat_limit').notNull().default(10),
    amountCents: integer('amount_cents').notNull().default(0),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    canceledAt: timestamp('canceled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('subscriptions_org_id_idx').on(table.orgId),
    index('subscriptions_paypal_sub_id_idx').on(table.paypalSubscriptionId),
  ],
);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [subscriptions.orgId],
    references: [organizations.id],
  }),
}));
