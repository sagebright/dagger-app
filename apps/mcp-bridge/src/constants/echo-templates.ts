/**
 * Echo Templates for GM Creativity Tools
 *
 * Static template data for generating echoes across 5 categories.
 * Extracted from content routes for reusability and maintainability.
 */

import type { EchoCategory } from '@dagger-app/shared-types';

// =============================================================================
// Types
// =============================================================================

/**
 * Template structure for echo content
 */
export interface EchoTemplate {
  title: string;
  content: string;
}

// =============================================================================
// Constants
// =============================================================================

/** Number of echoes to generate per category */
export const ECHOES_PER_CATEGORY = 2;

/** Valid echo categories */
export const VALID_ECHO_CATEGORIES: readonly EchoCategory[] = [
  'complications',
  'rumors',
  'discoveries',
  'intrusions',
  'wonders',
] as const;

/**
 * Echo content templates for each category
 */
export const ECHO_TEMPLATES: Record<EchoCategory, EchoTemplate[]> = {
  complications: [
    {
      title: 'The Bridge Collapses',
      content: "The ancient bridge begins to crumble beneath the party's feet, forcing quick decisions.",
    },
    {
      title: 'Sudden Storm',
      content: 'A fierce magical storm rolls in, limiting visibility and forcing the party to seek shelter.',
    },
    {
      title: 'Resource Shortage',
      content: 'Critical supplies run low at the worst possible moment, requiring the party to improvise.',
    },
    {
      title: 'Blocked Path',
      content: 'The intended route is blocked by a recent cave-in or magical barrier.',
    },
    {
      title: 'Time Pressure',
      content: 'An unexpected deadline emerges, forcing the party to accelerate their plans.',
    },
  ],
  rumors: [
    {
      title: 'Whispers of Treasure',
      content: 'Locals speak of hidden riches in a nearby abandoned location, but warn of its dangers.',
    },
    {
      title: "A Stranger's Warning",
      content: 'A mysterious traveler shares cryptic information about events to come.',
    },
    {
      title: 'Political Intrigue',
      content: 'Overheard conversations hint at power struggles among local factions.',
    },
    {
      title: 'Missing Persons',
      content: 'Several people have gone missing under similar, suspicious circumstances.',
    },
    {
      title: 'Ancient Prophecy',
      content: 'An old tale speaks of heroes who will face a great trial in this very place.',
    },
  ],
  discoveries: [
    {
      title: 'Hidden Chamber',
      content: 'A concealed door or passage reveals a previously unknown area to explore.',
    },
    {
      title: 'Ancient Inscription',
      content: "Mysterious writing provides clues about the location's history or secrets.",
    },
    {
      title: 'Unexpected Ally',
      content: 'Someone thought to be hostile turns out to share common goals with the party.',
    },
    {
      title: 'Lost Artifact',
      content: 'An item of significance is found in an unexpected place.',
    },
    {
      title: 'Truth Revealed',
      content: "A key piece of information changes the party's understanding of their situation.",
    },
  ],
  intrusions: [
    {
      title: 'Uninvited Guest',
      content: 'A third party arrives unexpectedly, with unclear intentions.',
    },
    {
      title: 'Ambush',
      content: 'Hidden enemies reveal themselves at an inopportune moment.',
    },
    {
      title: 'Environmental Hazard',
      content: 'Natural or magical forces suddenly threaten the area.',
    },
    {
      title: 'Message Arrives',
      content: 'Urgent news reaches the party, changing priorities.',
    },
    {
      title: 'Old Enemy Returns',
      content: "Someone from the party's past appears with unfinished business.",
    },
  ],
  wonders: [
    {
      title: 'Aurora of Magic',
      content: 'Magical lights fill the sky, marking a moment of supernatural significance.',
    },
    {
      title: 'Living Architecture',
      content: 'Buildings or structures reveal they have a life and will of their own.',
    },
    {
      title: 'Cosmic Alignment',
      content: 'Stars or moons align in a way that amplifies magical power.',
    },
    {
      title: 'Spirit Visitation',
      content: 'Benevolent spirits appear to offer guidance or blessing.',
    },
    {
      title: 'Natural Wonder',
      content: 'The party witnesses something beautiful and awe-inspiring in nature.',
    },
  ],
};
