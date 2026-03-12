import type { FastifyInstance } from 'fastify';
import type { WebSocket } from 'ws';
import { eq } from 'drizzle-orm';
import {
  parseTunnelMessage,
  serializeTunnelMessage,
  type TunnelAuthMessage,
  type AnyTunnelMessage,
} from '@deskport/shared';
import { authenticateAgentApiKey } from '../middleware/auth.js';
import { agentConnections, sessionConnections, monitorConnections, removeAgent } from './connections.js';
import { db } from '../db/index.js';
import { agents, sessions } from '../db/schema.js';
import { writeAuditLog } from '../services/audit.js';

const HEARTBEAT_TIMEOUT_MS = 60_000;

export async function registerTunnelHandler(app: FastifyInstance): Promise<void> {
  app.get('/ws/tunnel', { websocket: true }, (socket, _request) => {
    const ws = socket as unknown as WebSocket;
    let authenticated = false;
    let agentId: string | null = null;
    let orgId: string | null = null;
    let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;

    function resetHeartbeatTimer(): void {
      if (heartbeatTimer) clearTimeout(heartbeatTimer);
      heartbeatTimer = setTimeout(() => {
        ws.close(4001, 'Heartbeat timeout');
      }, HEARTBEAT_TIMEOUT_MS);
    }

    ws.on('message', async (raw: Buffer | string) => {
      let msg: AnyTunnelMessage;
      try {
        msg = parseTunnelMessage(typeof raw === 'string' ? raw : raw.toString('utf-8'));
      } catch {
        ws.send(serializeTunnelMessage({ type: 'auth.error', payload: { message: 'Invalid message format' } }));
        return;
      }

      // First message must be auth
      if (!authenticated) {
        if (msg.type !== 'auth') {
          ws.send(serializeTunnelMessage({ type: 'auth.error', payload: { message: 'Must authenticate first' } }));
          ws.close(4002, 'Not authenticated');
          return;
        }

        const authMsg = msg as TunnelAuthMessage;
        const apiKeyString = `${authMsg.payload.agentId}:${authMsg.payload.apiKey}`;
        const result = await authenticateAgentApiKey(apiKeyString);

        if (!result) {
          ws.send(serializeTunnelMessage({ type: 'auth.error', payload: { message: 'Invalid API key' } }));
          ws.close(4003, 'Authentication failed');
          return;
        }

        agentId = result.agentId;
        orgId = result.orgId;
        authenticated = true;

        // Close any existing connection for this agent
        const existing = agentConnections.get(agentId);
        if (existing) {
          existing.close(4004, 'Superseded by new connection');
        }

        agentConnections.set(agentId, ws);

        // Update agent status to online
        await db
          .update(agents)
          .set({ status: 'online', lastHeartbeat: new Date(), updatedAt: new Date() })
          .where(eq(agents.id, agentId));

        await writeAuditLog(orgId, 'agent.connected', { payload: { agentId } });

        ws.send(serializeTunnelMessage({ type: 'auth.ok', payload: { agentId } }));
        resetHeartbeatTimer();
        return;
      }

      // Authenticated — handle messages
      resetHeartbeatTimer();

      switch (msg.type) {
        case 'heartbeat': {
          // Update last heartbeat in DB
          if (agentId) {
            await db
              .update(agents)
              .set({ lastHeartbeat: new Date(), updatedAt: new Date() })
              .where(eq(agents.id, agentId));
          }
          ws.send(serializeTunnelMessage({ type: 'heartbeat.ack', payload: { timestamp: Date.now() } }));
          break;
        }

        case 'session.created': {
          // Agent reports session is ready — update session status
          const sessionId = msg.sessionId;
          if (sessionId && 'payload' in msg && msg.payload) {
            const payload = msg.payload as { tmuxSession: string };
            await db
              .update(sessions)
              .set({
                status: 'active',
                tmuxSession: payload.tmuxSession,
                startedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(sessions.id, sessionId));

            if (orgId) {
              await writeAuditLog(orgId, 'session.started', { sessionId });
            }
          }
          break;
        }

        case 'session.error': {
          const sessionId = msg.sessionId;
          if (sessionId) {
            await db
              .update(sessions)
              .set({ status: 'error', updatedAt: new Date() })
              .where(eq(sessions.id, sessionId));
          }
          break;
        }

        case 'session.ended': {
          const sessionId = msg.sessionId;
          if (sessionId) {
            const payload = (msg as { payload?: { recording: string | null } }).payload;
            await db
              .update(sessions)
              .set({
                status: 'ended',
                endedAt: new Date(),
                recordingUrl: payload?.recording ?? null,
                updatedAt: new Date(),
              })
              .where(eq(sessions.id, sessionId));

            if (orgId) {
              await writeAuditLog(orgId, 'session.ended', { sessionId });
            }
          }
          break;
        }

        case 'terminal.output': {
          // Forward terminal output to browser session connection and monitors
          const sessionId = msg.sessionId;
          if (!sessionId) break;

          const sessionWs = sessionConnections.get(sessionId);
          if (sessionWs && sessionWs.readyState === 1) {
            sessionWs.send(JSON.stringify(msg));
          }

          const monitors = monitorConnections.get(sessionId);
          if (monitors) {
            const data = JSON.stringify(msg);
            for (const monitor of monitors) {
              if (monitor.readyState === 1) {
                monitor.send(data);
              }
            }
          }
          break;
        }

        default:
          break;
      }
    });

    ws.on('close', async () => {
      if (heartbeatTimer) clearTimeout(heartbeatTimer);

      if (agentId) {
        removeAgent(agentId);

        await db
          .update(agents)
          .set({ status: 'offline', updatedAt: new Date() })
          .where(eq(agents.id, agentId));

        if (orgId) {
          await writeAuditLog(orgId, 'agent.disconnected', { payload: { agentId } });
        }
      }
    });

    ws.on('error', () => {
      ws.close();
    });
  });
}
