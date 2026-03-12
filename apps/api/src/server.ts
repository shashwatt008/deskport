import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { env } from './env.js';

// Routes
import { authRoutes } from './routes/auth.js';
import { agentRoutes } from './routes/agents.js';
import { templateRoutes } from './routes/templates.js';
import { sessionRoutes } from './routes/sessions.js';
import { teamRoutes } from './routes/team.js';
import { auditRoutes } from './routes/audit.js';

// WebSocket handlers
import { registerTunnelHandler } from './ws/tunnel-handler.js';
import { registerSessionHandler } from './ws/session-handler.js';
import { registerMonitorHandler } from './ws/monitor-handler.js';

async function main(): Promise<void> {
  const app = Fastify({
    logger: {
      level: 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // ── Plugins ─────────────────────────────────────────────────
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  await app.register(websocket);

  // ── REST Routes ─────────────────────────────────────────────
  await app.register(authRoutes);
  await app.register(agentRoutes);
  await app.register(templateRoutes);
  await app.register(sessionRoutes);
  await app.register(teamRoutes);
  await app.register(auditRoutes);

  // ── WebSocket Routes ────────────────────────────────────────
  await app.register(registerTunnelHandler);
  await app.register(registerSessionHandler);
  await app.register(registerMonitorHandler);

  // ── Health check ────────────────────────────────────────────
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // ── Start ───────────────────────────────────────────────────
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`DeskPort API running on port ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down...`);
      await app.close();
      process.exit(0);
    });
  }
}

main();
