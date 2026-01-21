/**
 * MCP Bridge Server
 *
 * Entry point for the Express + WebSocket server that bridges
 * the React frontend to Claude Code via MCP.
 */

import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import { config } from './config.js';
import { createCorsMiddleware } from './middleware/cors.js';
import { requestLogger } from './middleware/logger.js';
import { createWebSocketServer } from './websocket/handler.js';
import healthRouter from './routes/health.js';
import chatRouter from './routes/chat.js';
import contentRouter from './routes/content.js';
import adventureRouter from './routes/adventure.js';

const app = express();

// Create HTTP server for both Express and WebSocket
const server = createServer(app);

// Middleware
app.use(requestLogger());
app.use(createCorsMiddleware());
app.use(express.json());

// Routes
app.use('/health', healthRouter);
app.use('/chat', chatRouter);
app.use('/content', contentRouter);
app.use('/adventure', adventureRouter);

// WebSocket server (shares same port via HTTP upgrade)
const wss = createWebSocketServer(server);

// Graceful shutdown handling
function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  // Close WebSocket connections
  wss.close(() => {
    console.log('WebSocket server closed.');
  });

  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  // Force exit after timeout
  setTimeout(() => {
    console.log('Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
server.listen(config.port, () => {
  console.log(`MCP Bridge server running on http://localhost:${config.port}`);
  console.log(`Health check: http://localhost:${config.port}/health`);
  console.log(`WebSocket: ws://localhost:${config.port}`);
});
