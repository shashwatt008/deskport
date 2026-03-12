import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { WebSocket } from 'ws';
import { eq, and } from 'drizzle-orm';
import { parseTunnelMessage, serializeTunnelMessage, type AnyTunnelMessage } from '@deskport/shared';
import { db } from '../db/index.js';
import { sessions } from '../db/schema.js';
import { agentConnections, sessionConnections, removeSession } from './connections.js';

export async function registerSessionHandler(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { token: string; sessionId: string } }>(
    '/ws/session',
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

      if (session.status !== 'active' && session.status !== 'pending') {
        ws.close(4005, 'Session is not active');
        return;
      }

      // Find agent tunnel
      const agentWs = agentConnections.get(session.agentId);
      if (!agentWs || agentWs.readyState !== 1) {
        ws.close(4006, 'Agent is not connected');
        return;
      }

      // Register this browser as the session operator
      const existingSession = sessionConnections.get(sessionId);
      if (existingSession) {
        existingSession.close(4007, 'Superseded by new connection');
      }
      sessionConnections.set(sessionId, ws);

      // Forward terminal input from browser to agent
      ws.on('message', (raw: Buffer | string) => {
        let msg: AnyTunnelMessage;
        try {
          msg = parseTunnelMessage(typeof raw === 'string' ? raw : raw.toString('utf-8'));
        } catch {
          return;
        }

        // Only forward input and resize messages
        if (msg.type === 'terminal.input' || msg.type === 'terminal.resize') {
          const agentSocket = agentConnections.get(session.agentId);
          if (agentSocket && agentSocket.readyState === 1) {
            agentSocket.send(
              serializeTunnelMessage({
                ...msg,
                sessionId,
              } as AnyTunnelMessage),
            );
          }
        }
      });

      ws.on('close', () => {
        removeSession(sessionId);
      });

      ws.on('error', () => {
        ws.close();
      });
    },
  );
}
