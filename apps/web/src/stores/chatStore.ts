/**
 * Chat Store - Message history and streaming state
 *
 * Manages chat-related state including:
 * - Message history (user and assistant messages)
 * - Streaming state for real-time responses
 * - WebSocket connection status
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// =============================================================================
// Types
// =============================================================================

export type MessageRole = 'user' | 'assistant' | 'system';
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  /** For assistant messages, indicates if this was from streaming */
  isStreamed?: boolean;
  /** Optional metadata (e.g., dial updates, phase changes) */
  metadata?: Record<string, unknown>;
}

export interface ChatState {
  // Message data
  messages: ChatMessage[];

  // Streaming state
  isStreaming: boolean;
  streamingMessageId: string | null;

  // Connection state
  connectionStatus: ConnectionStatus;

  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  appendToStreaming: (chunk: string) => void;
  startStreaming: () => string;
  finalizeStreaming: () => void;
  cancelStreaming: () => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  clearMessages: () => void;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState = {
  messages: [] as ChatMessage[],
  isStreaming: false,
  streamingMessageId: null as string | null,
  connectionStatus: 'disconnected' as ConnectionStatus,
};

// =============================================================================
// Store
// =============================================================================

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        /**
         * Add a new message to the chat
         * Returns the message ID
         */
        addMessage: (message) => {
          const id = crypto.randomUUID();
          const newMessage: ChatMessage = {
            ...message,
            id,
            timestamp: new Date(),
          };

          set(
            (state) => ({
              messages: [...state.messages, newMessage],
            }),
            false,
            'addMessage'
          );

          return id;
        },

        /**
         * Update an existing message
         */
        updateMessage: (id, updates) => {
          set(
            (state) => ({
              messages: state.messages.map((msg) =>
                msg.id === id ? { ...msg, ...updates } : msg
              ),
            }),
            false,
            'updateMessage'
          );
        },

        /**
         * Append a chunk to the current streaming message
         */
        appendToStreaming: (chunk) => {
          const { streamingMessageId, messages } = get();
          if (!streamingMessageId) return;

          set(
            {
              messages: messages.map((msg) =>
                msg.id === streamingMessageId
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              ),
            },
            false,
            'appendToStreaming'
          );
        },

        /**
         * Start a new streaming message
         * Returns the ID of the new streaming message
         */
        startStreaming: () => {
          const id = crypto.randomUUID();
          const streamingMessage: ChatMessage = {
            id,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreamed: true,
          };

          set(
            (state) => ({
              messages: [...state.messages, streamingMessage],
              isStreaming: true,
              streamingMessageId: id,
            }),
            false,
            'startStreaming'
          );

          return id;
        },

        /**
         * Finalize the current streaming message
         */
        finalizeStreaming: () => {
          set(
            {
              isStreaming: false,
              streamingMessageId: null,
            },
            false,
            'finalizeStreaming'
          );
        },

        /**
         * Cancel streaming and remove the incomplete message
         */
        cancelStreaming: () => {
          const { streamingMessageId, messages } = get();
          if (!streamingMessageId) {
            set({ isStreaming: false }, false, 'cancelStreaming');
            return;
          }

          set(
            {
              messages: messages.filter((msg) => msg.id !== streamingMessageId),
              isStreaming: false,
              streamingMessageId: null,
            },
            false,
            'cancelStreaming'
          );
        },

        /**
         * Update WebSocket connection status
         */
        setConnectionStatus: (status) => {
          set({ connectionStatus: status }, false, 'setConnectionStatus');
        },

        /**
         * Clear all messages (e.g., on session reset)
         */
        clearMessages: () => {
          set({ messages: [], streamingMessageId: null, isStreaming: false }, false, 'clearMessages');
        },
      }),
      {
        name: 'dagger-chat-storage',
        // Handle Date serialization
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const parsed = JSON.parse(str);
            // Restore Date objects in messages
            if (parsed.state?.messages) {
              parsed.state.messages = parsed.state.messages.map(
                (msg: ChatMessage & { timestamp: string }) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp),
                })
              );
            }
            return parsed;
          },
          setItem: (name, value) => {
            localStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            localStorage.removeItem(name);
          },
        },
        // Don't persist streaming state - only persist messages and connection status
        partialize: (state) =>
          ({
            messages: state.messages,
            connectionStatus: state.connectionStatus,
          }) as ChatState,
      }
    ),
    { name: 'ChatStore' }
  )
);

// =============================================================================
// Selectors
// =============================================================================

/**
 * Get the most recent message
 */
export const selectLastMessage = (state: ChatState): ChatMessage | undefined =>
  state.messages[state.messages.length - 1];

/**
 * Get messages by role
 */
export const selectMessagesByRole = (state: ChatState, role: MessageRole): ChatMessage[] =>
  state.messages.filter((msg) => msg.role === role);

/**
 * Count messages
 */
export const selectMessageCount = (state: ChatState): number => state.messages.length;

/**
 * Check if currently streaming
 */
export const selectIsStreaming = (state: ChatState): boolean => state.isStreaming;

/**
 * Check if connected to WebSocket
 */
export const selectIsConnected = (state: ChatState): boolean =>
  state.connectionStatus === 'connected';
