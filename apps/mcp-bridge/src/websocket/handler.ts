/**
 * WebSocket handler for MCP Bridge Server
 *
 * Manages WebSocket connections for real-time communication
 * between the frontend and Claude Code via MCP.
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

/** Active WebSocket connections */
const clients = new Set<WebSocket>();

/**
 * Creates and configures the WebSocket server.
 * Attaches to the existing HTTP server for upgrade handling.
 */
export function createWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);
    console.log(`WebSocket client connected. Total: ${clients.size}`);

    ws.on('message', (data: Buffer) => {
      handleMessage(ws, data);
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`WebSocket client disconnected. Total: ${clients.size}`);
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error.message);
      clients.delete(ws);
    });

    // Send welcome message
    ws.send(JSON.stringify({ type: 'connected', message: 'MCP Bridge connected' }));
  });

  return wss;
}

/**
 * Handles incoming WebSocket messages.
 */
function handleMessage(ws: WebSocket, data: Buffer): void {
  try {
    const message = JSON.parse(data.toString());
    console.log('WebSocket message received:', message.type || 'unknown');

    // Echo back for now - real MCP handling will be added later
    ws.send(JSON.stringify({
      type: 'ack',
      received: message.type || 'unknown',
    }));
  } catch {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Invalid JSON message',
    }));
  }
}

/**
 * Broadcasts a message to all connected clients.
 */
export function broadcast(message: unknown): void {
  const payload = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

/**
 * Returns the number of active connections.
 */
export function getConnectionCount(): number {
  return clients.size;
}
