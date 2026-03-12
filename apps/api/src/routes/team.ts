import type { FastifyInstance } from 'fastify';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { inviteUserSchema, updateUserRoleSchema } from '@deskport/shared';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { authGuard, adminGuard } from '../middleware/auth.js';
import { writeAuditLog } from '../services/audit.js';

export async function teamRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authGuard);

  // ── List users in org ───────────────────────────────────────
  app.get('/team', async (request, reply) => {
    const orgId = request.user.orgId;

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.orgId, orgId))
      .orderBy(users.createdAt);

    return reply.send({ data: rows });
  });

  // ── Invite user (admin only) ────────────────────────────────
  app.post('/team/invite', { preHandler: [adminGuard] }, async (request, reply) => {
    const parsed = inviteUserSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const orgId = request.user.orgId;
    const { email, name, role } = parsed.data;

    // Check if email already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return reply.status(409).send({ error: 'Email already registered' });
    }

    // Generate a temporary password
    const tempPassword = crypto.randomBytes(16).toString('base64url');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const [user] = await db
      .insert(users)
      .values({
        email,
        name,
        role,
        orgId,
        passwordHash,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      });

    await writeAuditLog(orgId, 'user.invited', {
      userId: request.user.userId,
      payload: { invitedUserId: user.id, email },
    });

    return reply.status(201).send({
      data: {
        ...user,
        tempPassword, // Returned only once for the admin to share
      },
    });
  });

  // ── Update user role (admin only) ───────────────────────────
  app.put<{ Params: { id: string } }>(
    '/team/:id/role',
    { preHandler: [adminGuard] },
    async (request, reply) => {
      const parsed = updateUserRoleSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
      }

      const { id } = request.params;
      const orgId = request.user.orgId;

      // Prevent changing own role
      if (id === request.user.userId) {
        return reply.status(400).send({ error: 'Cannot change your own role' });
      }

      const [updated] = await db
        .update(users)
        .set({ role: parsed.data.role, updatedAt: new Date() })
        .where(and(eq(users.id, id), eq(users.orgId, orgId)))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
        });

      if (!updated) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return reply.send({ data: updated });
    },
  );

  // ── Remove user (admin only) ────────────────────────────────
  app.delete<{ Params: { id: string } }>(
    '/team/:id',
    { preHandler: [adminGuard] },
    async (request, reply) => {
      const { id } = request.params;
      const orgId = request.user.orgId;

      // Prevent self-deletion
      if (id === request.user.userId) {
        return reply.status(400).send({ error: 'Cannot remove yourself' });
      }

      const [deleted] = await db
        .delete(users)
        .where(and(eq(users.id, id), eq(users.orgId, orgId)))
        .returning({ id: users.id });

      if (!deleted) {
        return reply.status(404).send({ error: 'User not found' });
      }

      await writeAuditLog(orgId, 'user.removed', {
        userId: request.user.userId,
        payload: { removedUserId: deleted.id },
      });

      return reply.send({ data: { id: deleted.id, deleted: true } });
    },
  );
}
