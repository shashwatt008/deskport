import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { createSessionSchema } from '@deskport/shared';
import { db } from '../db/index.js';
import { sessions, sessionTemplates, agents } from '../db/schema.js';
import { authGuard } from '../middleware/auth.js';
import { writeAuditLog } from '../services/audit.js';
import { agentConnections } from '../ws/connections.js';
import { serializeTunnelMessage } from '@deskport/shared';

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard);

  // ── List sessions ───────────────────────────────────────────
  app.get('/sessions', async (request, reply) => {
    const orgId = request.user.orgId;

    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.orgId, orgId))
      .orderBy(sessions.createdAt);

    return reply.send({ data: rows });
  });

  // ── Create session ──────────────────────────────────────────
  app.post('/sessions', async (request, reply) => {
    const parsed = createSessionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const orgId = request.user.orgId;
    const userId = parsed.data.userId ?? request.user.userId;

    // Verify agent belongs to org and is online
    const [agent] = await db
      .select({ id: agents.id, status: agents.status })
      .from(agents)
      .where(and(eq(agents.id, parsed.data.agentId), eq(agents.orgId, orgId)))
      .limit(1);

    if (!agent) {
      return reply.status(404).send({ error: 'Agent not found' });
    }

    if (!agentConnections.has(agent.id)) {
      return reply.status(400).send({ error: 'Agent is not connected' });
    }

    // Verify template belongs to org
    const [template] = await db
      .select()
      .from(sessionTemplates)
      .where(and(eq(sessionTemplates.id, parsed.data.templateId), eq(sessionTemplates.orgId, orgId)))
      .limit(1);

    if (!template) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    // Create session in pending state
    const [session] = await db
      .insert(sessions)
      .values({
        orgId,
        templateId: template.id,
        agentId: agent.id,
        userId,
        status: 'pending',
      })
      .returning();

    // Send session.create to agent via tunnel
    const agentWs = agentConnections.get(agent.id);
    if (agentWs) {
      agentWs.send(
        serializeTunnelMessage({
          type: 'session.create',
          sessionId: session.id,
          payload: {
            templateId: template.id,
            allowedDirs: template.allowedDirs,
            allowedTools: template.allowedTools,
            blockedTools: template.blockedTools,
            systemPrompt: template.systemPrompt,
            maxDuration: template.maxDuration,
          },
        }),
      );
    }

    await writeAuditLog(orgId, 'session.created', {
      userId,
      sessionId: session.id,
      payload: { agentId: agent.id, templateId: template.id },
    });

    return reply.status(201).send({ data: session });
  });

  // ── Get session by ID ───────────────────────────────────────
  app.get<{ Params: { id: string } }>('/sessions/:id', async (request, reply) => {
    const { id } = request.params;
    const orgId = request.user.orgId;

    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.orgId, orgId)))
      .limit(1);

    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    return reply.send({ data: session });
  });

  // ── End session ─────────────────────────────────────────────
  app.post<{ Params: { id: string } }>('/sessions/:id/end', async (request, reply) => {
    const { id } = request.params;
    const orgId = request.user.orgId;

    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.orgId, orgId)))
      .limit(1);

    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    if (session.status === 'ended') {
      return reply.status(400).send({ error: 'Session already ended' });
    }

    // Tell agent to end the session
    const agentWs = agentConnections.get(session.agentId);
    if (agentWs) {
      agentWs.send(
        serializeTunnelMessage({
          type: 'session.end',
          sessionId: session.id,
        }),
      );
    }

    const [updated] = await db
      .update(sessions)
      .set({ status: 'ended', endedAt: new Date(), updatedAt: new Date() })
      .where(eq(sessions.id, id))
      .returning();

    await writeAuditLog(orgId, 'session.ended', {
      userId: request.user.userId,
      sessionId: id,
    });

    return reply.send({ data: updated });
  });
}
