/**
 * Content Components
 *
 * Components for Phase 3+ content generation including:
 * - Frame selection and creation
 * - Outline generation
 * - Scene editing with draft-revise workflow
 * - NPC compilation
 */

// Frame components
export { FrameCard, type FrameCardProps } from './FrameCard';
export { FramePanel, type FramePanelProps } from './FramePanel';
export { FrameEditor, type FrameEditorProps } from './FrameEditor';

// Outline components
export { OutlinePanel, type OutlinePanelProps } from './OutlinePanel';
export { SceneBriefCard, type SceneBriefCardProps } from './SceneBriefCard';

// Scene components (Phase 3.3)
export { SceneEditor, type SceneEditorProps } from './SceneEditor';
export { SceneList, type SceneListProps } from './SceneList';
export { SceneNavigation, type SceneNavigationProps } from './SceneNavigation';

// NPC components (Phase 3.4)
export { NPCCard, type NPCCardProps } from './NPCCard';
export { NPCList, type NPCListProps } from './NPCList';
