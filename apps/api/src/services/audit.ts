import { db } from '../db/index.js';
import { auditLogs } from '../db/schema.js';
import type { AuditEventType } from '@deskport/shared';

interface AuditLogOptions {
  sessionId?: string;
  userId?: string;
  payload?: Record<string, unknown>;
}

export async function writeAuditLog(
  orgId: string,
  eventType: AuditEventType,
  opts: AuditLogOptions = {},
): Promise<void> {
  await db.insert(auditLogs).values({
    orgId,
    eventType,
    sessionId: opts.sessionId ?? null,
    userId: opts.userId ?? null,
    payload: opts.payload ?? {},
  });
}
