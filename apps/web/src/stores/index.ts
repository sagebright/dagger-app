/**
 * Zustand Stores - Barrel Export
 *
 * Centralized state management for the dagger-app web frontend.
 * All stores use localStorage persistence for session recovery.
 */

// Import stores for use in utility functions
import { useAdventureStore } from './adventureStore';
import { useChatStore } from './chatStore';
import { useDialsStore } from './dialsStore';

// Adventure Store - Session and phase management
export {
  useAdventureStore,
  selectHasActiveSession,
  selectCanGoBack,
  selectPhaseIndex,
  selectIsComplete,
} from './adventureStore';
export type { AdventureState } from './adventureStore';

// Chat Store - Message history and streaming
export {
  useChatStore,
  selectLastMessage,
  selectMessagesByRole,
  selectMessageCount,
  selectIsStreaming,
  selectIsConnected,
} from './chatStore';
export type { ChatState, ChatMessage, MessageRole, ConnectionStatus } from './chatStore';

// Dials Store - Adventure dial configuration
export {
  useDialsStore,
  selectUnconfirmedDials,
  selectConfirmedCount,
  selectCompletionPercentage,
  selectRequiredDialsComplete,
  selectIsDialConfirmed,
  selectConcreteDials,
  selectConceptualDials,
  selectThemesAtMax,
  selectDialsSummary,
} from './dialsStore';
export type { DialsState } from './dialsStore';

// =============================================================================
// Combined Store Reset
// =============================================================================

/**
 * Reset all stores to initial state
 * Useful for starting a new adventure or clearing session data
 */
export function resetAllStores(): void {
  const { reset: resetAdventure } = useAdventureStore.getState();
  const { clearMessages } = useChatStore.getState();
  const { resetDials } = useDialsStore.getState();

  resetAdventure();
  clearMessages();
  resetDials();
}

/**
 * Clear all localStorage data for the stores
 * This is a more thorough reset that clears persisted state
 */
export function clearAllStorageData(): void {
  localStorage.removeItem('dagger-adventure-storage');
  localStorage.removeItem('dagger-chat-storage');
  localStorage.removeItem('dagger-dials-storage');

  // Also reset in-memory state
  resetAllStores();
}
