/**
 * Content Store Selectors
 *
 * Re-exports all selectors organized by domain (Frame, Outline, Scene, NPC,
 * Adversary, Item, Echo). All selectors are pure functions following the
 * pattern: (state: ContentState) => T
 *
 * Usage:
 *   import { selectHasSelectedFrame, selectNPCById } from './selectors';
 *   // or
 *   import * as selectors from './selectors';
 */

// Frame Selectors
export {
  selectHasSelectedFrame,
  selectIsFrameConfirmed,
  selectIsCustomFrame,
  selectFrameName,
  selectFrameThemes,
  selectCanProceedToOutline,
  selectFramesStatus,
} from './frameSelectors';

// Outline Selectors
export {
  selectHasOutline,
  selectIsOutlineConfirmed,
  selectOutlineTitle,
  selectSceneCount,
  selectSceneBriefs,
  selectSceneBriefById,
  selectIsOutlineComplete,
  selectCanProceedToScenes,
  selectOutlineStatus,
  selectOutlineSummary,
} from './outlineSelectors';

// Scene Selectors
export {
  selectScenes,
  selectCurrentScene,
  selectCurrentSceneId,
  selectSceneById,
  selectConfirmedSceneCount,
  selectAllScenesConfirmed,
  selectSceneStatus,
  selectCanProceedToNPCs,
  selectSceneNavigation,
} from './sceneSelectors';

// NPC Selectors
export {
  selectNPCs,
  selectConfirmedNPCIds,
  selectNPCById,
  selectConfirmedNPCCount,
  selectAllNPCsConfirmed,
  selectNPCStatus,
  selectCanProceedToAdversaries,
  selectNPCSummary,
  selectNPCsByRole,
  selectNPCsByScene,
} from './npcSelectors';

// Adversary Selectors
export {
  selectAvailableAdversaries,
  selectSelectedAdversaries,
  selectConfirmedAdversaryIds,
  selectFilteredAdversaries,
  selectSelectedAdversaryCount,
  selectConfirmedAdversaryCount,
  selectAllAdversariesConfirmed,
  selectAdversaryStatus,
  selectCanProceedToItems,
  selectAdversarySummary,
  selectAvailableAdversaryTypes,
  selectAdversaryFilters,
  selectIsAdversarySelected,
  selectSelectedAdversaryByName,
} from './adversarySelectors';

// Item Selectors
export {
  selectAvailableItems,
  selectSelectedItems,
  selectConfirmedItemIds,
  selectFilteredItems,
  selectSelectedItemCount,
  selectConfirmedItemCount,
  selectAllItemsConfirmed,
  selectItemStatus,
  selectCanProceedToEchoes,
  selectItemSummary,
  selectAvailableItemCategories,
  selectItemFilters,
  selectIsItemSelected,
  selectSelectedItemByKey,
} from './itemSelectors';

// Echo Selectors
export {
  selectEchoes,
  selectEchoesByCategory,
  selectConfirmedEchoIds,
  selectEchoById,
  selectConfirmedEchoCount,
  selectAllEchoesConfirmed,
  selectEchoStatus,
  selectEchoSummary,
  selectActiveEchoCategory,
  selectCanProceedToComplete,
} from './echoSelectors';
