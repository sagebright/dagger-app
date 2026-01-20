/**
 * MCP Server Implementation
 *
 * Provides a simple MCP-like server for registering and invoking tools.
 * This is used to bridge frontend requests to Claude Code for AI processing.
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Tool schema definition
 */
export interface ToolSchema {
  description: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Tool handler function type
 */
export type ToolHandler<TInput = unknown, TOutput = unknown> = (input: TInput) => Promise<TOutput>;

/**
 * Registered tool entry
 */
interface RegisteredTool {
  schema: ToolSchema;
  handler: ToolHandler;
}

// =============================================================================
// MCP Server Class
// =============================================================================

/**
 * MCP Server for tool registration and invocation
 */
export class MCPServer {
  private tools: Map<string, RegisteredTool> = new Map();

  /**
   * Register a new tool with the server
   */
  registerTool<TInput = unknown, TOutput = unknown>(
    name: string,
    schema: ToolSchema,
    handler: ToolHandler<TInput, TOutput>
  ): void {
    if (this.tools.has(name)) {
      throw new Error(`Tool already registered: ${name}`);
    }

    this.tools.set(name, {
      schema,
      handler: handler as ToolHandler,
    });
  }

  /**
   * Invoke a registered tool
   */
  async invokeTool<TInput = unknown, TOutput = unknown>(
    name: string,
    input: TInput
  ): Promise<TOutput> {
    const tool = this.tools.get(name);

    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    return tool.handler(input) as Promise<TOutput>;
  }

  /**
   * List all registered tool names
   */
  listTools(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get the schema for a specific tool
   */
  getToolSchema(name: string): ToolSchema | undefined {
    return this.tools.get(name)?.schema;
  }

  /**
   * Check if a tool is registered
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a new MCP server instance
 */
export function createMCPServer(): MCPServer {
  return new MCPServer();
}

// =============================================================================
// Singleton Instance
// =============================================================================

let serverInstance: MCPServer | null = null;

/**
 * Get the singleton MCP server instance
 */
export function getMCPServer(): MCPServer {
  if (!serverInstance) {
    serverInstance = createMCPServer();
  }
  return serverInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetMCPServer(): void {
  serverInstance = null;
}
