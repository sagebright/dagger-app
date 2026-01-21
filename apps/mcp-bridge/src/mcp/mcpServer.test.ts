/**
 * Tests for MCP Server
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MCPServer, createMCPServer } from './mcpServer.js';
import type { ProcessDialInput, ProcessDialOutput } from '@dagger-app/shared-types';

describe('MCPServer', () => {
  let server: MCPServer;

  beforeEach(() => {
    server = createMCPServer();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createMCPServer', () => {
    it('should create an MCP server instance', () => {
      expect(server).toBeDefined();
      expect(typeof server.registerTool).toBe('function');
      expect(typeof server.invokeTool).toBe('function');
    });
  });

  describe('registerTool', () => {
    it('should register a tool', () => {
      const handler = vi.fn();
      server.registerTool('test_tool', { description: 'Test tool' }, handler);
      expect(server.listTools()).toContain('test_tool');
    });

    it('should not allow duplicate tool registration', () => {
      const handler = vi.fn();
      server.registerTool('duplicate', { description: 'First' }, handler);
      expect(() => {
        server.registerTool('duplicate', { description: 'Second' }, handler);
      }).toThrow('Tool already registered');
    });
  });

  describe('invokeTool', () => {
    it('should invoke a registered tool', async () => {
      const handler = vi.fn().mockResolvedValue({ result: 'success' });
      server.registerTool('invoke_test', { description: 'Test' }, handler);

      const result = await server.invokeTool('invoke_test', { input: 'test' });

      expect(handler).toHaveBeenCalledWith({ input: 'test' });
      expect(result).toEqual({ result: 'success' });
    });

    it('should throw for unregistered tool', async () => {
      await expect(server.invokeTool('nonexistent', {})).rejects.toThrow('Tool not found');
    });

    it('should handle tool errors gracefully', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Tool failed'));
      server.registerTool('failing_tool', { description: 'Fails' }, handler);

      await expect(server.invokeTool('failing_tool', {})).rejects.toThrow('Tool failed');
    });
  });

  describe('listTools', () => {
    it('should list all registered tools', () => {
      server.registerTool('tool_a', { description: 'A' }, vi.fn());
      server.registerTool('tool_b', { description: 'B' }, vi.fn());

      const tools = server.listTools();

      expect(tools).toContain('tool_a');
      expect(tools).toContain('tool_b');
    });
  });

  describe('getToolSchema', () => {
    it('should return tool schema', () => {
      server.registerTool('schema_test', { description: 'Test', inputSchema: { type: 'object' } }, vi.fn());

      const schema = server.getToolSchema('schema_test');

      expect(schema).toEqual({ description: 'Test', inputSchema: { type: 'object' } });
    });

    it('should return undefined for unregistered tool', () => {
      expect(server.getToolSchema('unknown')).toBeUndefined();
    });
  });

  describe('process_dial_input tool integration', () => {
    it('should be able to register and invoke process_dial_input', async () => {
      const mockHandler = vi.fn().mockResolvedValue({
        assistantMessage: 'Setting tone to gritty.',
        dialUpdates: [{ dialId: 'tone', value: 'gritty', confidence: 'high' }],
      } satisfies ProcessDialOutput);

      server.registerTool(
        'process_dial_input',
        {
          description: 'Process user input for dial tuning',
          inputSchema: {
            type: 'object',
            properties: {
              userMessage: { type: 'string' },
              currentDials: { type: 'object' },
              conversationHistory: { type: 'array' },
            },
            required: ['userMessage', 'currentDials', 'conversationHistory'],
          },
        },
        mockHandler
      );

      const input: ProcessDialInput = {
        userMessage: 'Like The Witcher',
        currentDials: {
          partySize: 4,
          partyTier: 1,
          sceneCount: 4,
          sessionLength: '3-4 hours',
          tone: null,
          pillarBalance: null,
          npcDensity: null,
          lethality: null,
          emotionalRegister: null,
          themes: [],
          confirmedDials: [],
        },
        conversationHistory: [],
      };

      const result = await server.invokeTool('process_dial_input', input);

      expect(mockHandler).toHaveBeenCalledWith(input);
      expect(result).toHaveProperty('assistantMessage');
      expect(result).toHaveProperty('dialUpdates');
    });
  });
});
