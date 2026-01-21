/**
 * WebSocket handler for MCP Bridge Server
 *
 * Manages WebSocket connections for real-time communication
 * between the frontend and Claude Code via MCP.
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { v4 as uuidv4 } from 'uuid';
import {
  parseClientEvent,
  handleClientEvent,
  emitConnected,
  emitAssistantStart,
  emitAssistantChunk,
  emitAssistantComplete,
  emitDialUpdated,
  emitError,
} from './events.js';
import { processDialInputHandler } from '../mcp/tools/processDial.js';
import { validateDialValue } from '../services/dial-validation.js';

/** Maximum characters per chunk when streaming responses */
const STREAM_CHUNK_SIZE = 50;

/** Milliseconds delay between streaming chunks for natural feel */
const STREAM_CHUNK_DELAY_MS = 20;

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
    emitConnected(ws, 'MCP Bridge connected');
  });

  return wss;
}

/**
 * Handles incoming WebSocket messages.
 */
async function handleMessage(ws: WebSocket, data: Buffer): Promise<void> {
  // Parse the incoming event
  const event = parseClientEvent(data);

  if (!event) {
    emitError(ws, 'INVALID_MESSAGE', 'Invalid or unrecognized message format');
    return;
  }

  console.log('WebSocket message received:', event.type);

  // Handle the event with type-safe handlers
  await handleClientEvent(ws, event, {
    onUserMessage: async (payload) => {
      const messageId = uuidv4();

      // Signal that assistant is starting to respond
      emitAssistantStart(ws, messageId);

      try {
        // Process the dial input
        const result = await processDialInputHandler({
          userMessage: payload.content,
          currentDials: payload.currentDials,
          conversationHistory: [],
        });

        // Stream the response in chunks for a more natural feel
        // For now, send the whole message, but this allows for future streaming
        const chunks = splitIntoChunks(result.assistantMessage, STREAM_CHUNK_SIZE);
        for (const chunk of chunks) {
          emitAssistantChunk(ws, messageId, chunk);
          // Small delay for streaming effect (optional)
          await delay(STREAM_CHUNK_DELAY_MS);
        }

        // Signal completion with dial updates
        emitAssistantComplete(ws, messageId, result.dialUpdates, result.inlineWidgets);

        // If there were high-confidence dial updates, emit them individually
        if (result.dialUpdates) {
          for (const update of result.dialUpdates) {
            if (update.confidence === 'high') {
              emitDialUpdated(ws, update.dialId, update.value, 'assistant');
            }
          }
        }
      } catch (error) {
        console.error('Error processing user message:', error);
        emitError(ws, 'PROCESSING_ERROR', 'Failed to process message');
      }
    },

    onDialUpdate: async (payload) => {
      // Validate the dial update
      if (!validateDialValue(payload.dialId, payload.value)) {
        emitError(ws, 'INVALID_VALUE', `Invalid value for dial: ${payload.dialId}`);
        return;
      }

      // Emit confirmation
      emitDialUpdated(ws, payload.dialId, payload.value, 'user');
    },

    onDialConfirm: async (payload) => {
      // Log confirmation for now
      console.log(`Dial ${payload.dialId} ${payload.accepted ? 'confirmed' : 'rejected'}`);

      if (payload.accepted) {
        // The dial has been confirmed - could trigger state update here
        emitDialUpdated(ws, payload.dialId, undefined, 'user');
      }
    },
  });
}

/**
 * Split text into chunks for streaming
 */
function splitIntoChunks(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Try to break at word boundary
    let breakPoint = maxLength;
    if (remaining.length > maxLength) {
      const lastSpace = remaining.substring(0, maxLength).lastIndexOf(' ');
      if (lastSpace > maxLength * 0.5) {
        breakPoint = lastSpace + 1;
      }
    }

    chunks.push(remaining.substring(0, breakPoint));
    remaining = remaining.substring(breakPoint);
  }

  return chunks;
}

/**
 * Simple delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
