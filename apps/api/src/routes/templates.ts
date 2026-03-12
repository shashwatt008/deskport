import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import { createTemplateSchema, updateTemplateSchema } from '@deskport/shared';
import { db } from '../db/index.js';
import { sessionTemplates } from '../db/schema.js';
import { authGuard } from '../middleware/auth.js';
import { writeAuditLog } from '../services/audit.js';

export async function templateRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard);

  // ── List templates ──────────────────────────────────────────
  app.get('/templates', async (request, reply) => {
    const orgId = request.user.orgId;

    const rows = await db
      .select()
      .from(sessionTemplates)
      .where(eq(sessionTemplates.orgId, orgId))
      .orderBy(sessionTemplates.createdAt);

    return reply.send({ data: rows });
  });

  // ── Create template ─────────────────────────────────────────
  app.post('/templates', async (request, reply) => {
    const parsed = createTemplateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const orgId = request.user.orgId;

    const [template] = await db
      .insert(sessionTemplates)
      .values({
        orgId,
        name: parsed.data.name,
        allowedDirs: parsed.data.allowedDirs,
        allowedTools: parsed.data.allowedTools,
        blockedTools: parsed.data.blockedTools,
        systemPrompt: parsed.data.systemPrompt,
        maxDuration: parsed.data.maxDuration,
      })
      .returning();

    await writeAuditLog(orgId, 'template.created', {
      userId: request.user.userId,
      payload: { templateId: template.id, name: template.name },
    });

    return reply.status(201).send({ data: template });
  });

  // ── Get template by ID ──────────────────────────────────────
  app.get<{ Params: { id: string } }>('/templates/:id', async (request, reply) => {
    const { id } = request.params;
    const orgId = request.user.orgId;

    const [template] = await db
      .select()
      .from(sessionTemplates)
      .where(and(eq(sessionTemplates.id, id), eq(sessionTemplates.orgId, orgId)))
      .limit(1);

    if (!template) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    return reply.send({ data: template });
  });

  // ── Update template ─────────────────────────────────────────
  app.put<{ Params: { id: string } }>('/templates/:id', async (request, reply) => {
    const parsed = updateTemplateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const { id } = request.params;
    const orgId = request.user.orgId;

    const [template] = await db
      .update(sessionTemplates)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(sessionTemplates.id, id), eq(sessionTemplates.orgId, orgId)))
      .returning();

    if (!template) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    await writeAuditLog(orgId, 'template.updated', {
      userId: request.user.userId,
      payload: { templateId: template.id },
    });

    return reply.send({ data: template });
  });

  // ── Delete template ─────────────────────────────────────────
  app.delete<{ Params: { id: string } }>('/templates/:id', async (request, reply) => {
    const { id } = request.params;
    const orgId = request.user.orgId;

    const [deleted] = await db
      .delete(sessionTemplates)
      .where(and(eq(sessionTemplates.id, id), eq(sessionTemplates.orgId, orgId)))
      .returning({ id: sessionTemplates.id });

    if (!deleted) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    await writeAuditLog(orgId, 'template.deleted', {
      userId: request.user.userId,
      payload: { templateId: deleted.id },
    });

    return reply.send({ data: { id: deleted.id, deleted: true } });
  });
}
