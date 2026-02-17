/**
 * Chat state store for the Sage Codex frontend
 *
 * Manages the local chat UI state: messages, streaming status,
 * active tool calls, and error state.
 *
 * Messages arrive from two sources:
 * 1. User input (added immediately on send)
 * 2. SSE events (streamed from the server, assembled incrementally)
 */

import { create } from 'zustand';

// =============================================================================
// Types
// =============================================================================

export interface ChatMessage {
  /** Unique message identifier */
  id: string;
  /** Message author */
  role: 'user' | 'assistant';
  /** Full message content (built up during streaming) */
  content: string;
  /** When the message was created */
  timestamp: string;
  /** Whether this message is still being streamed */
  isStreaming: boolean;
  /** Tool calls made during this message */
  toolCalls: ToolCallInfo[];
}

export interface ToolCallInfo {
  /** Tool use ID from the API */
  toolUseId: string;
  /** Tool name */
  toolName: string;
  /** Tool input parameters */
  input: Record<string, unknown>;
  /** Whether the tool has completed */
  isComplete: boolean;
  /** Whether the tool call resulted in an error */
  isError: boolean;
}

// =============================================================================
// Store Interface
// =============================================================================

export interface ChatStoreState {
  /** All chat messages in chronological order */
  messages: ChatMessage[];

  /** Whether the assistant is currently streaming a response */
  isStreaming: boolean;

  /** The ID of the message currently being streamed */
  activeMessageId: string | null;

  /** Current error state, if any */
  error: string | null;

  // ----- Actions -----

  /** Add a user message to the chat */
  addUserMessage: (content: string) => string;

  /** Start a new assistant message (from chat:start event) */
  startAssistantMessage: (messageId: string) => void;

  /** Append content to the streaming assistant message (from chat:delta) */
  appendDelta: (messageId: string, content: string) => void;

  /** Mark the assistant message as complete (from chat:end) */
  endAssistantMessage: (messageId: string) => void;

  /** Record a tool call start (from tool:start) */
  addToolCall: (messageId: string, toolCall: Omit<ToolCallInfo, 'isComplete' | 'isError'>) => void;

  /** Record a tool call completion (from tool:end) */
  completeToolCall: (toolUseId: string, isError: boolean) => void;

  /** Set an error state */
  setError: (error: string | null) => void;

  /** Clear all messages (e.g., on session change) */
  clearMessages: () => void;

  /** Load messages from server (e.g., on session restore) */
  loadMessages: (messages: ChatMessage[]) => void;
}

// =============================================================================
// Helpers
// =============================================================================

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// =============================================================================
// Store
// =============================================================================

export const useChatStore = create<ChatStoreState>((set) => ({
  messages: [],
  isStreaming: false,
  activeMessageId: null,
  error: null,

  addUserMessage: (content) => {
    const id = generateMessageId();
    set((prev) => ({
      messages: [
        ...prev.messages,
        {
          id,
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
          isStreaming: false,
          toolCalls: [],
        },
      ],
      error: null,
    }));
    return id;
  },

  startAssistantMessage: (messageId) =>
    set((prev) => ({
      messages: [
        ...prev.messages,
        {
          id: messageId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          isStreaming: true,
          toolCalls: [],
        },
      ],
      isStreaming: true,
      activeMessageId: messageId,
    })),

  appendDelta: (messageId, content) =>
    set((prev) => ({
      messages: prev.messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, content: msg.content + content }
          : msg
      ),
    })),

  endAssistantMessage: (messageId) =>
    set((prev) => ({
      messages: prev.messages.map((msg) =>
        msg.id === messageId
          ? { ...msg, isStreaming: false }
          : msg
      ),
      isStreaming: false,
      activeMessageId: null,
    })),

  addToolCall: (messageId, toolCall) =>
    set((prev) => ({
      messages: prev.messages.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              toolCalls: [
                ...msg.toolCalls,
                { ...toolCall, isComplete: false, isError: false },
              ],
            }
          : msg
      ),
    })),

  completeToolCall: (toolUseId, isError) =>
    set((prev) => ({
      messages: prev.messages.map((msg) => ({
        ...msg,
        toolCalls: msg.toolCalls.map((tc) =>
          tc.toolUseId === toolUseId
            ? { ...tc, isComplete: true, isError }
            : tc
        ),
      })),
    })),

  setError: (error) => set({ error }),

  clearMessages: () =>
    set({
      messages: [],
      isStreaming: false,
      activeMessageId: null,
      error: null,
    }),

  loadMessages: (messages) => set({ messages }),
}));
