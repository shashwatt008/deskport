import type { FastifyInstance } from 'fastify';
import { eq, desc, sql } from 'drizzle-orm';
import { paginationSchema } from '@deskport/shared';
import { db } from '../db/index.js';
import { auditLogs } from '../db/schema.js';
import { authGuard } from '../middleware/auth.js';

export async function auditRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard);

  // ── List audit logs (paginated) ─────────────────────────────
  app.get('/audit', async (request, reply) => {
    const parsed = paginationSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const { page, limit } = parsed.data;
    const offset = (page - 1) * limit;
    const orgId = request.user.orgId;

    const [rows, countResult] = await Promise.all([
      db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.orgId, orgId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLogs)
        .where(eq(auditLogs.orgId, orgId)),
    ]);

    const total = countResult[0]?.count ?? 0;

    return reply.send({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });
}
