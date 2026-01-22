/**
 * Tests for Claude CLI Service
 *
 * Tests the core functionality for invoking Claude Code CLI
 * with session management and temp file handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ChildProcess } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as childProcess from 'node:child_process';
import {
  invokeClaudeCli,
  checkClaudeAvailable,
  cleanupTempFiles,
  getTempDir,
} from './claude-cli.js';

// Mock child_process
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

// Mock fs/promises
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
  access: vi.fn().mockResolvedValue(undefined),
  readdir: vi.fn().mockResolvedValue([]),
  rm: vi.fn().mockResolvedValue(undefined),
}));

describe('claude-cli service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    vi.clearAllMocks();
  });

  describe('getTempDir', () => {
    it('returns the .claude/temp directory path', () => {
      const tempDir = getTempDir();
      expect(tempDir).toContain('.claude');
      expect(tempDir).toContain('temp');
    });
  });

  describe('checkClaudeAvailable', () => {
    it('returns true when claude CLI is available', async () => {
      const mockSpawn = vi.mocked(childProcess.spawn);
      const mockProcess = createMockProcess();

      mockSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);

      // Simulate successful exit
      setTimeout(() => {
        mockProcess.emit('close', 0);
      }, 10);

      const result = await checkClaudeAvailable();
      expect(result).toBe(true);
      expect(mockSpawn).toHaveBeenCalledWith('claude', ['--version'], expect.any(Object));
    });

    it('returns false when claude CLI is not found', async () => {
      const mockSpawn = vi.mocked(childProcess.spawn);
      const mockProcess = createMockProcess();

      mockSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);

      // Simulate error (CLI not found)
      setTimeout(() => {
        mockProcess.emit('error', new Error('spawn claude ENOENT'));
      }, 10);

      const result = await checkClaudeAvailable();
      expect(result).toBe(false);
    });

    it('returns false when claude CLI exits with non-zero code', async () => {
      const mockSpawn = vi.mocked(childProcess.spawn);
      const mockProcess = createMockProcess();

      mockSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);

      // Simulate non-zero exit
      setTimeout(() => {
        mockProcess.emit('close', 1);
      }, 10);

      const result = await checkClaudeAvailable();
      expect(result).toBe(false);
    });
  });

  describe('invokeClaudeCli', () => {
    it('spawns claude with correct arguments for print mode', async () => {
      const mockSpawn = vi.mocked(childProcess.spawn);
      const mockProcess = createMockProcess();

      mockSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);

      // Simulate successful output
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('{"result":"test","session_id":"sess-123"}'));
        mockProcess.emit('close', 0);
      }, 10);

      const result = await invokeClaudeCli({
        prompt: 'Hello, Claude!',
      });

      expect(mockSpawn).toHaveBeenCalledWith(
        'claude',
        expect.arrayContaining(['-p', '--output-format', 'json']),
        expect.objectContaining({
          stdio: ['inherit', 'pipe', 'pipe'],
        })
      );
      expect(result).toBeDefined();
    });

    it('includes system prompt file when systemPrompt is provided', async () => {
      const mockSpawn = vi.mocked(childProcess.spawn);
      const mockProcess = createMockProcess();
      const mockWriteFile = vi.mocked(fs.writeFile);
      const mockMkdir = vi.mocked(fs.mkdir);

      mockSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);

      // Simulate successful output
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('{"result":"test","session_id":"sess-123"}'));
        mockProcess.emit('close', 0);
      }, 10);

      await invokeClaudeCli({
        prompt: 'Hello, Claude!',
        systemPrompt: 'You are a helpful assistant.',
      });

      expect(mockMkdir).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalled();
      expect(mockSpawn).toHaveBeenCalledWith(
        'claude',
        expect.arrayContaining(['--system-prompt-file']),
        expect.any(Object)
      );
    });

    it('includes --resume flag when sessionId is provided', async () => {
      const mockSpawn = vi.mocked(childProcess.spawn);
      const mockProcess = createMockProcess();

      mockSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);

      // Simulate successful output
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('{"result":"test","session_id":"sess-456"}'));
        mockProcess.emit('close', 0);
      }, 10);

      await invokeClaudeCli({
        prompt: 'Continue the conversation',
        sessionId: 'sess-456',
      });

      expect(mockSpawn).toHaveBeenCalledWith(
        'claude',
        expect.arrayContaining(['--resume', 'sess-456']),
        expect.any(Object)
      );
    });

    it('extracts session_id from JSON response', async () => {
      const mockSpawn = vi.mocked(childProcess.spawn);
      const mockProcess = createMockProcess();

      mockSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);

      const jsonResponse = JSON.stringify({
        result: 'Hello!',
        session_id: 'extracted-session-123',
      });

      // Simulate successful output
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from(jsonResponse));
        mockProcess.emit('close', 0);
      }, 10);

      const result = await invokeClaudeCli({
        prompt: 'Hello!',
      });

      expect(result.sessionId).toBe('extracted-session-123');
    });

    it('cleans up temp file after invocation', async () => {
      const mockSpawn = vi.mocked(childProcess.spawn);
      const mockProcess = createMockProcess();
      const mockUnlink = vi.mocked(fs.unlink);

      mockSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);

      // Simulate successful output
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from('{"result":"test"}'));
        mockProcess.emit('close', 0);
      }, 10);

      await invokeClaudeCli({
        prompt: 'Hello!',
        systemPrompt: 'System prompt content',
      });

      // Verify cleanup was attempted
      expect(mockUnlink).toHaveBeenCalled();
    });

    it('throws error when CLI exits with non-zero code', async () => {
      const mockSpawn = vi.mocked(childProcess.spawn);
      const mockProcess = createMockProcess();

      mockSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);

      // Simulate error output and non-zero exit
      setTimeout(() => {
        mockProcess.stderr.emit('data', Buffer.from('Error: something went wrong'));
        mockProcess.emit('close', 1);
      }, 10);

      await expect(
        invokeClaudeCli({
          prompt: 'Hello!',
        })
      ).rejects.toThrow();
    });

    it('handles chunked JSON output', async () => {
      const mockSpawn = vi.mocked(childProcess.spawn);
      const mockProcess = createMockProcess();

      mockSpawn.mockReturnValue(mockProcess as unknown as ChildProcess);

      const fullResponse = {
        result: 'This is a long response that gets chunked',
        session_id: 'chunked-session',
      };

      const jsonString = JSON.stringify(fullResponse);
      const chunk1 = jsonString.slice(0, 20);
      const chunk2 = jsonString.slice(20);

      // Simulate chunked output
      setTimeout(() => {
        mockProcess.stdout.emit('data', Buffer.from(chunk1));
        mockProcess.stdout.emit('data', Buffer.from(chunk2));
        mockProcess.emit('close', 0);
      }, 10);

      const result = await invokeClaudeCli({
        prompt: 'Hello!',
      });

      expect(result.output).toBe(fullResponse.result);
      expect(result.sessionId).toBe('chunked-session');
    });
  });

  describe('cleanupTempFiles', () => {
    it('removes all files from temp directory', async () => {
      const mockReaddir = vi.mocked(fs.readdir);
      const mockRm = vi.mocked(fs.rm);

      mockReaddir.mockResolvedValue(['temp1.txt', 'temp2.txt'] as unknown as Awaited<ReturnType<typeof fs.readdir>>);

      await cleanupTempFiles();

      expect(mockRm).toHaveBeenCalled();
    });

    it('does not throw when temp directory does not exist', async () => {
      const mockReaddir = vi.mocked(fs.readdir);
      mockReaddir.mockRejectedValue(new Error('ENOENT'));

      // Should not throw
      await expect(cleanupTempFiles()).resolves.toBeUndefined();
    });
  });
});

/**
 * Create a mock child process with event emitter capabilities
 */
function createMockProcess() {
  const events: Record<string, Array<(...args: unknown[]) => void>> = {};

  const createEmitter = () => ({
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!events[event]) events[event] = [];
      events[event].push(handler);
    }),
    emit: (event: string, ...args: unknown[]) => {
      if (events[event]) {
        events[event].forEach((handler) => handler(...args));
      }
    },
  });

  const stdout = createEmitter();
  const stderr = createEmitter();

  return {
    stdout,
    stderr,
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!events[event]) events[event] = [];
      events[event].push(handler);
    }),
    emit: (event: string, ...args: unknown[]) => {
      if (events[event]) {
        events[event].forEach((handler) => handler(...args));
      }
    },
    kill: vi.fn(),
    pid: 12345,
  };
}
