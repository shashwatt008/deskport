import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import crypto from 'node:crypto';
import { createAgentSchema } from '@deskport/shared';
import { db } from '../db/index.js';
import { agents } from '../db/schema.js';
import { authGuard } from '../middleware/auth.js';

function generateApiKey(): { raw: string; hash: string } {
  const raw = 'dkp_' + crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

export async function agentRoutes(app: FastifyInstance): Promise<void> {
  // All agent routes require auth
  app.addHook('preHandler', authGuard);

  // ── List agents for org ─────────────────────────────────────
  app.get('/agents', async (request, reply) => {
    const orgId = request.user.orgId;

    const rows = await db
      .select({
        id: agents.id,
        name: agents.name,
        hostname: agents.hostname,
        os: agents.os,
        status: agents.status,
        lastHeartbeat: agents.lastHeartbeat,
        localIp: agents.localIp,
        createdAt: agents.createdAt,
      })
      .from(agents)
      .where(eq(agents.orgId, orgId))
      .orderBy(agents.createdAt);

    return reply.send({ data: rows });
  });

  // ── Create agent ────────────────────────────────────────────
  app.post('/agents', async (request, reply) => {
    const parsed = createAgentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const { raw, hash } = generateApiKey();
    const orgId = request.user.orgId;

    const [agent] = await db
      .insert(agents)
      .values({
        orgId,
        name: parsed.data.name,
        hostname: parsed.data.hostname,
        os: parsed.data.os,
        localIp: parsed.data.localIp ?? null,
        apiKeyHash: hash,
      })
      .returning({
        id: agents.id,
        name: agents.name,
        hostname: agents.hostname,
        os: agents.os,
        status: agents.status,
        createdAt: agents.createdAt,
      });

    // Return the raw API key only once — it cannot be retrieved again
    return reply.status(201).send({
      data: {
        ...agent,
        apiKey: `${agent.id}:${raw}`,
      },
    });
  });

  // ── Get agent by ID ─────────────────────────────────────────
  app.get<{ Params: { id: string } }>('/agents/:id', async (request, reply) => {
    const { id } = request.params;
    const orgId = request.user.orgId;

    const [agent] = await db
      .select({
        id: agents.id,
        name: agents.name,
        hostname: agents.hostname,
        os: agents.os,
        status: agents.status,
        lastHeartbeat: agents.lastHeartbeat,
        localIp: agents.localIp,
        createdAt: agents.createdAt,
        updatedAt: agents.updatedAt,
      })
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.orgId, orgId)))
      .limit(1);

    if (!agent) {
      return reply.status(404).send({ error: 'Agent not found' });
    }

    return reply.send({ data: agent });
  });

  // ── Delete agent ────────────────────────────────────────────
  app.delete<{ Params: { id: string } }>('/agents/:id', async (request, reply) => {
    const { id } = request.params;
    const orgId = request.user.orgId;

    const [deleted] = await db
      .delete(agents)
      .where(and(eq(agents.id, id), eq(agents.orgId, orgId)))
      .returning({ id: agents.id });

    if (!deleted) {
      return reply.status(404).send({ error: 'Agent not found' });
    }

    return reply.send({ data: { id: deleted.id, deleted: true } });
  });
}
