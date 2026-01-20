/**
 * MCP Bridge Server
 *
 * Entry point for the Express + WebSocket server that bridges
 * the React frontend to Claude Code via MCP.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/health', healthRouter);

// Graceful shutdown handling
let server: ReturnType<typeof app.listen>;

function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
server = app.listen(PORT, () => {
  console.log(`MCP Bridge server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
