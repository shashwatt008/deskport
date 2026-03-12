import type { FastifyInstance } from 'fastify';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { registerSchema, loginSchema } from '@deskport/shared';
import { db } from '../db/index.js';
import { organizations, users } from '../db/schema.js';
import { authGuard } from '../middleware/auth.js';
import { writeAuditLog } from '../services/audit.js';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // ── Register ────────────────────────────────────────────────
  app.post('/auth/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const { email, password, name, orgName } = parsed.data;

    // Check if email already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return reply.status(409).send({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const slug = slugify(orgName) + '-' + Date.now().toString(36);

    // Create org
    const [org] = await db
      .insert(organizations)
      .values({ name: orgName, slug })
      .returning({ id: organizations.id });

    // Create admin user
    const [user] = await db
      .insert(users)
      .values({
        email,
        name,
        role: 'admin',
        orgId: org.id,
        passwordHash,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        orgId: users.orgId,
      });

    await writeAuditLog(org.id, 'user.login', { userId: user.id });

    const token = app.jwt.sign(
      { userId: user.id, orgId: user.orgId, role: user.role },
      { expiresIn: '7d' },
    );

    return reply.status(201).send({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: user.orgId,
        },
      },
    });
  });

  // ── Login ───────────────────────────────────────────────────
  app.post('/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const { email, password } = parsed.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    await writeAuditLog(user.orgId, 'user.login', { userId: user.id });

    const token = app.jwt.sign(
      { userId: user.id, orgId: user.orgId, role: user.role },
      { expiresIn: '7d' },
    );

    return reply.send({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: user.orgId,
        },
      },
    });
  });

  // ── Me ──────────────────────────────────────────────────────
  app.get('/auth/me', { preHandler: [authGuard] }, async (request, reply) => {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        orgId: users.orgId,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, request.user.userId))
      .limit(1);

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return reply.send({ data: user });
  });
}
