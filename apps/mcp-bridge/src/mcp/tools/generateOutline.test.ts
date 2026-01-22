/**
 * Tests for generate_outline_draft MCP Tool
 *
 * Tests the Claude CLI-based outline generation handler.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateOutlineHandler, GENERATE_OUTLINE_SCHEMA } from './generateOutline.js';
import type {
  GenerateOutlineInput,
  FrameDraft,
  DaggerheartFrame,
} from '@dagger-app/shared-types';
import * as claudeCli from '../../services/claude-cli.js';

// Mock the claude-cli module
vi.mock('../../services/claude-cli.js', () => ({
  checkClaudeAvailable: vi.fn(),
  invokeClaudeCli: vi.fn(),
}));

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockDbFrame(overrides: Partial<DaggerheartFrame> = {}): DaggerheartFrame {
  return {
    id: 'frame-1',
    name: 'The Haunted Forest',
    description: 'A dark forest filled with ancient spirits and forgotten secrets',
    themes: ['horror', 'mystery'],
    typical_adversaries: ['undead', 'fey'],
    lore: 'Long ago, this forest was the site of a great battle...',
    embedding: null,
    source_book: 'Core Rulebook',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockCustomFrame(overrides: Partial<FrameDraft> = {}): FrameDraft {
  return {
    id: 'custom-1',
    name: 'The Clockwork City',
    description: 'A city of mechanical wonders where gears rule all',
    themes: ['heist', 'political'],
    typicalAdversaries: ['constructs', 'humanoid'],
    lore: 'Built upon the ruins of the old world...',
    isCustom: true,
    ...overrides,
  };
}

function createMockDialsSummary(
  overrides: Partial<GenerateOutlineInput['dialsSummary']> = {}
): GenerateOutlineInput['dialsSummary'] {
  return {
    partySize: 4,
    partyTier: 2,
    sceneCount: 4,
    sessionLength: '3-4 hours',
    tone: 'dark and mysterious',
    themes: ['redemption', 'identity'],
    pillarBalance: 'balanced',
    lethality: 'moderate',
    ...overrides,
  };
}

function createMockInput(overrides: Partial<GenerateOutlineInput> = {}): GenerateOutlineInput {
  return {
    frame: createMockDbFrame(),
    dialsSummary: createMockDialsSummary(),
    ...overrides,
  };
}

/**
 * Creates a mock Claude CLI response for outline generation
 */
function createMockClaudeResponse(options: {
  sceneCount?: number;
  title?: string;
  summary?: string;
} = {}) {
  const {
    sceneCount = 4,
    title = 'Shadows of the Haunted Forest',
    summary = 'An adventure for experienced heroes exploring the dark forest where ancient spirits dwell.',
  } = options;

  const scenes = Array.from({ length: sceneCount }, (_, i) => ({
    sceneNumber: i + 1,
    title: `Scene ${i + 1}: The ${['Arrival', 'Investigation', 'Confrontation', 'Resolution', 'Escape', 'Climax'][i] || 'Journey'}`,
    description: `Description for scene ${i + 1} that sets up the dramatic moment.`,
    sceneType: ['exploration', 'social', 'combat', 'revelation', 'puzzle', 'mixed'][i % 6],
    keyElements: ['Key element 1', 'Key element 2'],
    location: `Location ${i + 1}`,
    characters: ['NPC 1', 'NPC 2'],
  }));

  return {
    title,
    summary,
    scenes,
  };
}

// =============================================================================
// Schema Tests
// =============================================================================

describe('GENERATE_OUTLINE_SCHEMA', () => {
  it('has correct description', () => {
    expect(GENERATE_OUTLINE_SCHEMA.description).toBe(
      'Generate an adventure outline with scene briefs from frame and dials'
    );
  });

  it('requires frame and dialsSummary', () => {
    expect(GENERATE_OUTLINE_SCHEMA.inputSchema?.required).toContain('frame');
    expect(GENERATE_OUTLINE_SCHEMA.inputSchema?.required).toContain('dialsSummary');
  });

  it('has optional feedback field', () => {
    expect(GENERATE_OUTLINE_SCHEMA.inputSchema?.properties?.feedback).toBeDefined();
  });
});

// =============================================================================
// Claude CLI Availability Tests
// =============================================================================

describe('generateOutlineHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Claude CLI availability', () => {
    it('throws CLAUDE_NOT_AVAILABLE error when CLI is not available', async () => {
      vi.mocked(claudeCli.checkClaudeAvailable).mockResolvedValue(false);

      const input = createMockInput();

      await expect(generateOutlineHandler(input)).rejects.toThrow('CLAUDE_NOT_AVAILABLE');
    });

    it('proceeds with generation when CLI is available', async () => {
      vi.mocked(claudeCli.checkClaudeAvailable).mockResolvedValue(true);
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse()),
        jsonResponse: createMockClaudeResponse(),
      });

      const input = createMockInput();
      const result = await generateOutlineHandler(input);

      expect(result.isComplete).toBe(true);
      expect(result.outline).toBeDefined();
    });
  });

  // =============================================================================
  // Claude CLI Invocation Tests
  // =============================================================================

  describe('Claude CLI invocation', () => {
    beforeEach(() => {
      vi.mocked(claudeCli.checkClaudeAvailable).mockResolvedValue(true);
    });

    it('invokes Claude CLI with 90-second timeout', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse()),
        jsonResponse: createMockClaudeResponse(),
      });

      const input = createMockInput();
      await generateOutlineHandler(input);

      expect(claudeCli.invokeClaudeCli).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 90000,
        })
      );
    });

    it('passes system prompt to Claude CLI', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse()),
        jsonResponse: createMockClaudeResponse(),
      });

      const input = createMockInput();
      await generateOutlineHandler(input);

      expect(claudeCli.invokeClaudeCli).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: expect.stringContaining('TTRPG adventure designer'),
        })
      );
    });

    it('passes user prompt to Claude CLI', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse()),
        jsonResponse: createMockClaudeResponse(),
      });

      const input = createMockInput();
      await generateOutlineHandler(input);

      expect(claudeCli.invokeClaudeCli).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('Generate an adventure outline'),
        })
      );
    });
  });

  // =============================================================================
  // Basic Generation Tests
  // =============================================================================

  describe('basic generation', () => {
    beforeEach(() => {
      vi.mocked(claudeCli.checkClaudeAvailable).mockResolvedValue(true);
    });

    it('generates outline with correct scene count', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse({ sceneCount: 4 })),
        jsonResponse: createMockClaudeResponse({ sceneCount: 4 }),
      });

      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ sceneCount: 4 }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.isComplete).toBe(true);
      expect(result.outline).toBeDefined();
      expect(result.outline?.scenes).toHaveLength(4);
    });

    it('generates minimum 3 scenes', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse({ sceneCount: 3 })),
        jsonResponse: createMockClaudeResponse({ sceneCount: 3 }),
      });

      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ sceneCount: 3 }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.outline?.scenes).toHaveLength(3);
    });

    it('generates maximum 6 scenes', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse({ sceneCount: 6 })),
        jsonResponse: createMockClaudeResponse({ sceneCount: 6 }),
      });

      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ sceneCount: 6 }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.outline?.scenes).toHaveLength(6);
    });

    it('rejects invalid scene count below minimum', async () => {
      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ sceneCount: 2 }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.isComplete).toBe(false);
      expect(result.followUpQuestion).toContain('3-6');
    });

    it('rejects invalid scene count above maximum', async () => {
      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ sceneCount: 7 }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.isComplete).toBe(false);
    });

    it('includes adventure title in outline', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse({ title: 'The Dark Journey' })),
        jsonResponse: createMockClaudeResponse({ title: 'The Dark Journey' }),
      });

      const input = createMockInput();

      const result = await generateOutlineHandler(input);

      expect(result.outline?.title).toBe('The Dark Journey');
    });

    it('includes adventure summary in outline', async () => {
      const mockResponse = createMockClaudeResponse({
        summary: 'A thrilling adventure in the haunted forest.',
      });
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(mockResponse),
        jsonResponse: mockResponse,
      });

      const input = createMockInput();

      const result = await generateOutlineHandler(input);

      expect(result.outline?.summary).toBe('A thrilling adventure in the haunted forest.');
    });
  });

  // =============================================================================
  // Scene Brief Structure Tests
  // =============================================================================

  describe('scene brief structure', () => {
    beforeEach(() => {
      vi.mocked(claudeCli.checkClaudeAvailable).mockResolvedValue(true);
    });

    it('each scene has required fields', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse()),
        jsonResponse: createMockClaudeResponse(),
      });

      const input = createMockInput();

      const result = await generateOutlineHandler(input);

      expect(result.outline?.scenes).toBeDefined();
      for (const scene of result.outline!.scenes) {
        expect(scene.sceneNumber).toBeDefined();
        expect(scene.title).toBeTruthy();
        expect(scene.description).toBeTruthy();
      }
    });

    it('scenes are numbered sequentially starting at 1', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse({ sceneCount: 5 })),
        jsonResponse: createMockClaudeResponse({ sceneCount: 5 }),
      });

      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ sceneCount: 5 }),
      });

      const result = await generateOutlineHandler(input);

      const sceneNumbers = result.outline!.scenes.map((s) => s.sceneNumber);
      expect(sceneNumbers).toEqual([1, 2, 3, 4, 5]);
    });

    it('scenes have valid scene types', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse()),
        jsonResponse: createMockClaudeResponse(),
      });

      const input = createMockInput();

      const result = await generateOutlineHandler(input);

      const validTypes = ['combat', 'exploration', 'social', 'puzzle', 'revelation', 'mixed'];
      for (const scene of result.outline!.scenes) {
        expect(validTypes).toContain(scene.sceneType);
      }
    });

    it('scenes have location suggestions', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse()),
        jsonResponse: createMockClaudeResponse(),
      });

      const input = createMockInput();

      const result = await generateOutlineHandler(input);

      for (const scene of result.outline!.scenes) {
        expect(scene.location).toBeTruthy();
      }
    });

    it('scenes have key elements', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse()),
        jsonResponse: createMockClaudeResponse(),
      });

      const input = createMockInput();

      const result = await generateOutlineHandler(input);

      for (const scene of result.outline!.scenes) {
        expect(scene.keyElements).toBeDefined();
        expect(Array.isArray(scene.keyElements)).toBe(true);
      }
    });
  });

  // =============================================================================
  // Frame Integration Tests
  // =============================================================================

  describe('frame integration', () => {
    beforeEach(() => {
      vi.mocked(claudeCli.checkClaudeAvailable).mockResolvedValue(true);
    });

    it('passes frame context to system prompt', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse()),
        jsonResponse: createMockClaudeResponse(),
      });

      const input = createMockInput({
        frame: createMockDbFrame({ name: 'The Shadow Keep' }),
      });

      await generateOutlineHandler(input);

      expect(claudeCli.invokeClaudeCli).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: expect.stringContaining('Shadow Keep'),
        })
      );
    });

    it('handles custom frame', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse()),
        jsonResponse: createMockClaudeResponse(),
      });

      const input = createMockInput({
        frame: createMockCustomFrame({ name: 'The Clockwork City' }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.isComplete).toBe(true);
    });
  });

  // =============================================================================
  // Feedback/Regeneration Tests
  // =============================================================================

  describe('feedback and regeneration', () => {
    beforeEach(() => {
      vi.mocked(claudeCli.checkClaudeAvailable).mockResolvedValue(true);
    });

    it('acknowledges feedback in response message', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse()),
        jsonResponse: createMockClaudeResponse(),
      });

      const previousOutline = {
        id: 'outline-1',
        title: 'Previous Adventure',
        summary: 'Previous summary',
        scenes: [],
        isConfirmed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const input = createMockInput({
        feedback: 'I want more combat scenes',
        previousOutline,
      });

      const result = await generateOutlineHandler(input);

      expect(result.assistantMessage).toContain('revised');
      expect(result.assistantMessage).toContain('feedback');
    });

    it('passes feedback to user prompt', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse()),
        jsonResponse: createMockClaudeResponse(),
      });

      const previousOutline = {
        id: 'outline-1',
        title: 'Previous Adventure',
        summary: 'Previous summary',
        scenes: [],
        isConfirmed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const input = createMockInput({
        feedback: 'More combat please',
        previousOutline,
      });

      await generateOutlineHandler(input);

      expect(claudeCli.invokeClaudeCli).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('More combat please'),
        })
      );
    });

    it('generates new outline without feedback', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse()),
        jsonResponse: createMockClaudeResponse(),
      });

      const input = createMockInput();

      const result = await generateOutlineHandler(input);

      expect(result.assistantMessage).not.toContain('revised');
      expect(result.assistantMessage).toContain('outline');
    });
  });

  // =============================================================================
  // Response Message Tests
  // =============================================================================

  describe('response messages', () => {
    beforeEach(() => {
      vi.mocked(claudeCli.checkClaudeAvailable).mockResolvedValue(true);
    });

    it('includes frame name in response', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse()),
        jsonResponse: createMockClaudeResponse(),
      });

      const input = createMockInput({
        frame: createMockDbFrame({ name: 'The Crystal Caves' }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.assistantMessage).toContain('Crystal Caves');
    });

    it('includes scene list in response', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse({ sceneCount: 4 })),
        jsonResponse: createMockClaudeResponse({ sceneCount: 4 }),
      });

      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ sceneCount: 4 }),
      });

      const result = await generateOutlineHandler(input);

      // Should have numbered scenes
      expect(result.assistantMessage).toContain('1.');
      expect(result.assistantMessage).toContain('2.');
      expect(result.assistantMessage).toContain('3.');
      expect(result.assistantMessage).toContain('4.');
    });

    it('prompts for review when generation is complete', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse()),
        jsonResponse: createMockClaudeResponse(),
      });

      const input = createMockInput();

      const result = await generateOutlineHandler(input);

      expect(result.assistantMessage.toLowerCase()).toMatch(/review|confirm|proceed/);
    });
  });

  // =============================================================================
  // Error Handling Tests
  // =============================================================================

  describe('error handling', () => {
    beforeEach(() => {
      vi.mocked(claudeCli.checkClaudeAvailable).mockResolvedValue(true);
    });

    it('handles Claude CLI timeout', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockRejectedValue(
        new Error('Claude CLI timed out after 90000ms')
      );

      const input = createMockInput();

      await expect(generateOutlineHandler(input)).rejects.toThrow('timed out');
    });

    it('handles invalid JSON response', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: 'not valid json',
        jsonResponse: undefined,
      });

      const input = createMockInput();

      await expect(generateOutlineHandler(input)).rejects.toThrow();
    });

    it('handles missing required fields in response', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify({ title: 'Missing scenes' }),
        jsonResponse: { title: 'Missing scenes' },
      });

      const input = createMockInput();

      await expect(generateOutlineHandler(input)).rejects.toThrow();
    });
  });

  // =============================================================================
  // Edge Cases
  // =============================================================================

  describe('edge cases', () => {
    beforeEach(() => {
      vi.mocked(claudeCli.checkClaudeAvailable).mockResolvedValue(true);
    });

    it('handles frame with no themes', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse()),
        jsonResponse: createMockClaudeResponse(),
      });

      const input = createMockInput({
        frame: createMockDbFrame({ themes: undefined }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.isComplete).toBe(true);
    });

    it('handles frame with no adversaries', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse()),
        jsonResponse: createMockClaudeResponse(),
      });

      const input = createMockInput({
        frame: createMockDbFrame({ typical_adversaries: undefined }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.isComplete).toBe(true);
    });

    it('handles empty themes array in dials', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse()),
        jsonResponse: createMockClaudeResponse(),
      });

      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ themes: [] }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.isComplete).toBe(true);
    });

    it('handles null pillarBalance', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse()),
        jsonResponse: createMockClaudeResponse(),
      });

      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ pillarBalance: null }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.isComplete).toBe(true);
      expect(result.outline?.scenes).toBeDefined();
    });

    it('handles null tone gracefully', async () => {
      vi.mocked(claudeCli.invokeClaudeCli).mockResolvedValue({
        output: JSON.stringify(createMockClaudeResponse()),
        jsonResponse: createMockClaudeResponse(),
      });

      const input = createMockInput({
        dialsSummary: createMockDialsSummary({ tone: null }),
      });

      const result = await generateOutlineHandler(input);

      expect(result.isComplete).toBe(true);
    });
  });
});
