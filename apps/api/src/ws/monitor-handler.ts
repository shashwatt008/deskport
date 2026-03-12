import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { sessions } from '../db/schema.js';
import { addMonitor, removeMonitor } from './connections.js';

export async function registerMonitorHandler(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { token: string; sessionId: string } }>(
    '/ws/monitor',
    { websocket: true },
    async (socket, request: FastifyRequest<{ Querystring: { token: string; sessionId: string } }>) => {
      const ws = socket as unknown as WebSocket;
      const { token, sessionId } = request.query;

      // Auth via JWT in query param
      let user: { userId: string; orgId: string; role: string };
      try {
        user = app.jwt.verify<{ userId: string; orgId: string; role: string }>(token);
      } catch {
        ws.close(4001, 'Invalid token');
        return;
      }

      // Look up session
      const [session] = await db
        .select()
        .from(sessions)
        .where(and(eq(sessions.id, sessionId), eq(sessions.orgId, user.orgId)))
        .limit(1);

      if (!session) {
        ws.close(4004, 'Session not found');
        return;
      }

      if (session.status !== 'active') {
        ws.close(4005, 'Session is not active');
        return;
      }

      // Register as monitor — read-only, receives terminal.output only
      addMonitor(sessionId, ws);

      // Ignore any incoming messages from monitors (read-only)
      ws.on('message', () => {
        // No-op: monitors are read-only
      });

      ws.on('close', () => {
        removeMonitor(sessionId, ws);
      });

      ws.on('error', () => {
        ws.close();
      });
    },
  );
}
