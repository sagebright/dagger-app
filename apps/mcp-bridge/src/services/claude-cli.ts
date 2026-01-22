/**
 * Claude CLI Service
 *
 * Provides functionality for invoking Claude Code CLI via subprocess
 * with session management and temp file handling.
 */

import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// Types
// =============================================================================

export interface InvokeClaudeOptions {
  /** The prompt to send to Claude */
  prompt: string;
  /** Optional system prompt (written to temp file) */
  systemPrompt?: string;
  /** Session ID for resuming a conversation */
  sessionId?: string;
  /** Timeout in milliseconds (default: 120000) */
  timeout?: number;
}

export interface InvokeClaudeResult {
  /** The raw output from Claude */
  output: string;
  /** The full JSON response if parsing succeeded */
  jsonResponse?: Record<string, unknown>;
  /** Session ID for reuse in subsequent calls */
  sessionId?: string;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_TIMEOUT_MS = 120000;
const CLAUDE_CLI_COMMAND = 'claude';

// =============================================================================
// Temp Directory Management
// =============================================================================

/**
 * Get the temp directory path for Claude CLI temp files.
 * Uses .claude/temp/ relative to the project root.
 */
export function getTempDir(): string {
  // Navigate from mcp-bridge/src/services to project root
  const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
  return path.join(projectRoot, '.claude', 'temp');
}

/**
 * Ensure the temp directory exists
 */
async function ensureTempDir(): Promise<void> {
  const tempDir = getTempDir();
  await fs.mkdir(tempDir, { recursive: true });
}

/**
 * Create a temp file for the system prompt
 */
async function createSystemPromptFile(content: string): Promise<string> {
  await ensureTempDir();
  const filename = `system-prompt-${randomUUID()}.txt`;
  const filepath = path.join(getTempDir(), filename);
  await fs.writeFile(filepath, content, 'utf-8');
  return filepath;
}

/**
 * Delete a temp file (silent on failure)
 */
async function deleteTempFile(filepath: string): Promise<void> {
  try {
    await fs.unlink(filepath);
  } catch {
    // Ignore errors - temp file may already be deleted
  }
}

/**
 * Clean up all temp files in the .claude/temp directory
 */
export async function cleanupTempFiles(): Promise<void> {
  try {
    const tempDir = getTempDir();
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch {
    // Ignore errors - directory may not exist
  }
}

// =============================================================================
// Claude CLI Availability Check
// =============================================================================

/**
 * Check if the Claude CLI is available on the system.
 * Returns boolean without throwing - safe to call unconditionally.
 */
export async function checkClaudeAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const process = spawn(CLAUDE_CLI_COMMAND, ['--version'], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      process.on('error', () => {
        resolve(false);
      });

      process.on('close', (code) => {
        resolve(code === 0);
      });
    } catch {
      resolve(false);
    }
  });
}

// =============================================================================
// Claude CLI Invocation
// =============================================================================

/**
 * Invoke the Claude CLI with the given options.
 *
 * Uses print mode (-p) with JSON output for structured responses.
 * Implements the stdio workaround for Node.js compatibility.
 *
 * @see https://github.com/anthropics/claude-code/issues/771
 */
export async function invokeClaudeCli(
  options: InvokeClaudeOptions
): Promise<InvokeClaudeResult> {
  const { prompt, systemPrompt, sessionId, timeout = DEFAULT_TIMEOUT_MS } = options;

  let systemPromptFile: string | null = null;

  try {
    // Build CLI arguments
    const args = buildCliArguments({
      prompt,
      systemPromptFile: systemPrompt
        ? (systemPromptFile = await createSystemPromptFile(systemPrompt))
        : undefined,
      sessionId,
    });

    // Spawn the Claude CLI process
    const result = await spawnClaudeProcess(args, timeout);

    return result;
  } finally {
    // Clean up temp file if created
    if (systemPromptFile) {
      await deleteTempFile(systemPromptFile);
    }
  }
}

/**
 * Build the CLI arguments array
 */
function buildCliArguments(options: {
  prompt: string;
  systemPromptFile?: string;
  sessionId?: string;
}): string[] {
  const { prompt, systemPromptFile, sessionId } = options;

  const args: string[] = [
    '-p', // Print mode (non-interactive)
    '--output-format',
    'json',
  ];

  // Add system prompt file if provided
  if (systemPromptFile) {
    args.push('--system-prompt-file', systemPromptFile);
  }

  // Add resume flag if session ID provided
  if (sessionId) {
    args.push('--resume', sessionId);
  }

  // Add the prompt as the final argument
  args.push(prompt);

  return args;
}

/**
 * Spawn the Claude CLI process and collect output
 */
function spawnClaudeProcess(
  args: string[],
  timeout: number
): Promise<InvokeClaudeResult> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const errorChunks: Buffer[] = [];

    // Use stdio workaround for Node.js compatibility
    // See: https://github.com/anthropics/claude-code/issues/771
    const process = spawn(CLAUDE_CLI_COMMAND, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    // Set up timeout
    const timeoutId = setTimeout(() => {
      process.kill('SIGTERM');
      reject(new Error(`Claude CLI timed out after ${timeout}ms`));
    }, timeout);

    // Collect stdout
    process.stdout.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    // Collect stderr
    process.stderr.on('data', (chunk: Buffer) => {
      errorChunks.push(chunk);
    });

    // Handle process errors
    process.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to spawn Claude CLI: ${error.message}`));
    });

    // Handle process completion
    process.on('close', (code) => {
      clearTimeout(timeoutId);

      if (code !== 0) {
        const errorOutput = Buffer.concat(errorChunks).toString('utf-8');
        reject(
          new Error(
            `Claude CLI exited with code ${code}: ${errorOutput || 'Unknown error'}`
          )
        );
        return;
      }

      const rawOutput = Buffer.concat(chunks).toString('utf-8');
      const result = parseClaudeResponse(rawOutput);
      resolve(result);
    });
  });
}

/**
 * Parse the Claude CLI JSON response
 */
function parseClaudeResponse(rawOutput: string): InvokeClaudeResult {
  try {
    const json = JSON.parse(rawOutput) as Record<string, unknown>;

    return {
      output: typeof json.result === 'string' ? json.result : rawOutput,
      jsonResponse: json,
      sessionId: typeof json.session_id === 'string' ? json.session_id : undefined,
    };
  } catch {
    // If JSON parsing fails, return raw output
    return {
      output: rawOutput,
      jsonResponse: undefined,
      sessionId: undefined,
    };
  }
}
