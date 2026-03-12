import type { WebSocket } from 'ws';

/**
 * Agent tunnel connections: agentId -> WebSocket
 */
export const agentConnections = new Map<string, WebSocket>();

/**
 * Browser session connections: sessionId -> WebSocket (active operator)
 */
export const sessionConnections = new Map<string, WebSocket>();

/**
 * Monitor (read-only) connections: sessionId -> Set<WebSocket>
 */
export const monitorConnections = new Map<string, Set<WebSocket>>();

export function addMonitor(sessionId: string, ws: WebSocket): void {
  let monitors = monitorConnections.get(sessionId);
  if (!monitors) {
    monitors = new Set();
    monitorConnections.set(sessionId, monitors);
  }
  monitors.add(ws);
}

export function removeMonitor(sessionId: string, ws: WebSocket): void {
  const monitors = monitorConnections.get(sessionId);
  if (monitors) {
    monitors.delete(ws);
    if (monitors.size === 0) {
      monitorConnections.delete(sessionId);
    }
  }
}

export function removeAgent(agentId: string): void {
  agentConnections.delete(agentId);
}

export function removeSession(sessionId: string): void {
  sessionConnections.delete(sessionId);
}
