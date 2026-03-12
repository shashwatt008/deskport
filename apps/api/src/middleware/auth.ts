import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';
import { db } from '../db/index.js';
import { agents } from '../db/schema.js';

// Extend Fastify request type
declare module 'fastify' {
  interface FastifyRequest {
    user: {
      userId: string;
      orgId: string;
      role: string;
    };
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string;
      orgId: string;
      role: string;
    };
    user: {
      userId: string;
      orgId: string;
      role: string;
    };
  }
}

/**
 * JWT auth preHandler — verifies Bearer token and populates request.user.
 */
export async function authGuard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}

/**
 * Admin-only guard — must be used AFTER authGuard.
 */
export async function adminGuard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (request.user.role !== 'admin') {
    reply.status(403).send({ error: 'Forbidden: admin access required' });
  }
}

/**
 * API key auth for agent connections.
 * Expects header: X-API-Key: <agentId>:<rawApiKey>
 * Returns the agent row if valid, or null.
 */
export async function authenticateAgentApiKey(
  apiKeyHeader: string,
): Promise<{ agentId: string; orgId: string } | null> {
  const parts = apiKeyHeader.split(':');
  if (parts.length !== 2) return null;

  const [agentId, rawKey] = parts;
  if (!agentId || !rawKey) return null;

  const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

  const [agent] = await db
    .select({ id: agents.id, orgId: agents.orgId, apiKeyHash: agents.apiKeyHash })
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);

  if (!agent || agent.apiKeyHash !== hash) return null;

  return { agentId: agent.id, orgId: agent.orgId };
}
