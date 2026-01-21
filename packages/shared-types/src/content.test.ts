/**
 * Tests for Content type definitions (Phase 3.4 - NPC Types)
 */

import { describe, it, expect } from 'vitest';
import type {
  NPC,
  NPCRole,
  CompiledNPC,
  CompileNPCsInput,
  CompileNPCsOutput,
  NPCClientEvent,
  NPCServerEvent,
  NPCCompileEvent,
  NPCRefineEvent,
  NPCConfirmEvent,
  NPCCompileStartEvent,
  NPCCompileChunkEvent,
  NPCCompileCompleteEvent,
  NPCRefinedEvent,
  NPCConfirmedEvent,
  NPCErrorEvent,
  CompileNPCsRequest,
  CompileNPCsResponse,
  // Echo types (Phase 4.3)
  Echo,
  EchoCategory,
  GenerateEchoesInput,
  GenerateEchoesOutput,
  EchoClientEvent,
  EchoServerEvent,
  EchoGenerateEvent,
  EchoEditEvent,
  EchoConfirmEvent,
  EchoRegenerateEvent,
  EchoGenerateStartEvent,
  EchoGenerateChunkEvent,
  EchoGenerateCompleteEvent,
  EchoUpdatedEvent,
  EchoConfirmedEvent,
  EchoErrorEvent,
  GenerateEchoesRequest,
  GenerateEchoesResponse,
} from './content.js';

// =============================================================================
// NPC Types Tests
// =============================================================================

describe('NPC Types', () => {
  describe('NPC interface', () => {
    it('should accept valid NPC with all fields', () => {
      const npc: NPC = {
        id: 'npc-1',
        name: 'Orik the Guide',
        role: 'quest-giver',
        description: 'A weathered traveler who knows the ancient paths.',
        appearance: 'Tall and lean, with silver-streaked hair and piercing blue eyes.',
        personality: 'Cautious but kind-hearted, speaks in measured tones.',
        motivations: ['Protect the village', 'Atone for past mistakes'],
        connections: ['Elder Mira (sister)', 'The Hollow Grove (sacred site)'],
        sceneAppearances: ['scene-1', 'scene-3'],
      };

      expect(npc.id).toBe('npc-1');
      expect(npc.name).toBe('Orik the Guide');
      expect(npc.role).toBe('quest-giver');
      expect(npc.motivations).toHaveLength(2);
      expect(npc.sceneAppearances).toContain('scene-1');
    });

    it('should accept NPC with minimal required fields', () => {
      const npc: NPC = {
        id: 'npc-2',
        name: 'Mysterious Stranger',
        role: 'neutral',
        description: 'A cloaked figure in the corner of the tavern.',
        appearance: 'Hidden beneath dark robes.',
        personality: 'Withdrawn and enigmatic.',
        motivations: [],
        connections: [],
        sceneAppearances: ['scene-2'],
      };

      expect(npc.role).toBe('neutral');
      expect(npc.motivations).toHaveLength(0);
    });

    it('should accept different NPC roles', () => {
      const roles: NPCRole[] = ['ally', 'neutral', 'quest-giver', 'antagonist', 'bystander'];

      roles.forEach((role) => {
        const npc: NPC = {
          id: `npc-${role}`,
          name: `Test NPC (${role})`,
          role,
          description: 'Test',
          appearance: 'Test',
          personality: 'Test',
          motivations: [],
          connections: [],
          sceneAppearances: [],
        };
        expect(npc.role).toBe(role);
      });
    });
  });

  describe('CompiledNPC interface', () => {
    it('should extend NPC with compilation metadata', () => {
      const compiled: CompiledNPC = {
        id: 'npc-1',
        name: 'Orik the Guide',
        role: 'quest-giver',
        description: 'A weathered traveler.',
        appearance: 'Tall with silver hair.',
        personality: 'Cautious but kind.',
        motivations: ['Protect the village'],
        connections: [],
        sceneAppearances: ['scene-1'],
        isConfirmed: false,
        extractedFrom: [{ sceneId: 'scene-1', context: 'The party meets Orik at the village gate.' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(compiled.isConfirmed).toBe(false);
      expect(compiled.extractedFrom).toHaveLength(1);
      expect(compiled.extractedFrom[0].sceneId).toBe('scene-1');
    });

    it('should track confirmed state', () => {
      const confirmed: CompiledNPC = {
        id: 'npc-1',
        name: 'Orik',
        role: 'ally',
        description: 'Guide',
        appearance: 'Tall',
        personality: 'Kind',
        motivations: [],
        connections: [],
        sceneAppearances: ['scene-1'],
        isConfirmed: true,
        extractedFrom: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      expect(confirmed.isConfirmed).toBe(true);
    });
  });
});

// =============================================================================
// MCP Tool Types Tests
// =============================================================================

describe('CompileNPCs MCP Tool', () => {
  describe('CompileNPCsInput', () => {
    it('should accept valid input with scenes and frame', () => {
      const input: CompileNPCsInput = {
        scenes: [
          {
            sceneId: 'scene-1',
            title: 'The Village Gate',
            extractedNPCs: [{ name: 'Orik', role: 'guide', sceneId: 'scene-1' }],
          },
        ],
        frame: {
          id: 'frame-1',
          name: 'The Hollow Vigil',
          description: 'A dark fantasy adventure',
          themes: ['mystery', 'redemption'],
          typicalAdversaries: ['undead'],
          lore: 'Ancient lore...',
          isCustom: true,
        },
        dialsSummary: {
          partySize: 4,
          partyTier: 2,
          tone: 'dark and mysterious',
          themes: ['mystery'],
        },
      };

      expect(input.scenes).toHaveLength(1);
      expect(input.frame.name).toBe('The Hollow Vigil');
    });
  });

  describe('CompileNPCsOutput', () => {
    it('should accept valid output with compiled NPCs', () => {
      const output: CompileNPCsOutput = {
        assistantMessage: 'I have compiled 2 NPCs from your scenes.',
        npcs: [
          {
            id: 'npc-1',
            name: 'Orik',
            role: 'quest-giver',
            description: 'A guide',
            appearance: 'Tall',
            personality: 'Kind',
            motivations: ['Help the party'],
            connections: [],
            sceneAppearances: ['scene-1'],
          },
        ],
        isComplete: true,
      };

      expect(output.isComplete).toBe(true);
      expect(output.npcs).toHaveLength(1);
    });

    it('should accept output with follow-up question', () => {
      const output: CompileNPCsOutput = {
        assistantMessage: 'I found some NPCs but need clarification.',
        npcs: [],
        isComplete: false,
        followUpQuestion: 'Should I include the unnamed merchant?',
      };

      expect(output.isComplete).toBe(false);
      expect(output.followUpQuestion).toBeDefined();
    });
  });
});

// =============================================================================
// WebSocket Event Types Tests
// =============================================================================

describe('NPC WebSocket Events', () => {
  describe('Client Events', () => {
    it('should accept NPC compile event', () => {
      const event: NPCCompileEvent = {
        type: 'npc:compile',
        payload: {
          sceneIds: ['scene-1', 'scene-2'],
        },
      };

      expect(event.type).toBe('npc:compile');
      expect(event.payload.sceneIds).toHaveLength(2);
    });

    it('should accept NPC refine event', () => {
      const event: NPCRefineEvent = {
        type: 'npc:refine',
        payload: {
          npcId: 'npc-1',
          feedback: 'Make the personality more mysterious',
        },
      };

      expect(event.type).toBe('npc:refine');
      expect(event.payload.npcId).toBe('npc-1');
    });

    it('should accept NPC confirm event', () => {
      const event: NPCConfirmEvent = {
        type: 'npc:confirm',
        payload: {
          npcId: 'npc-1',
        },
      };

      expect(event.type).toBe('npc:confirm');
    });

    it('should form valid client event union', () => {
      const events: NPCClientEvent[] = [
        { type: 'npc:compile', payload: { sceneIds: ['scene-1'] } },
        { type: 'npc:refine', payload: { npcId: 'npc-1', feedback: 'test' } },
        { type: 'npc:confirm', payload: { npcId: 'npc-1' } },
      ];

      expect(events).toHaveLength(3);
    });
  });

  describe('Server Events', () => {
    it('should accept compile start event', () => {
      const event: NPCCompileStartEvent = {
        type: 'npc:compile_start',
        payload: {
          messageId: 'msg-1',
          totalScenes: 4,
        },
      };

      expect(event.type).toBe('npc:compile_start');
      expect(event.payload.totalScenes).toBe(4);
    });

    it('should accept compile chunk event', () => {
      const event: NPCCompileChunkEvent = {
        type: 'npc:compile_chunk',
        payload: {
          messageId: 'msg-1',
          chunk: 'Processing NPC: Orik the Guide...',
        },
      };

      expect(event.type).toBe('npc:compile_chunk');
    });

    it('should accept compile complete event', () => {
      const event: NPCCompileCompleteEvent = {
        type: 'npc:compile_complete',
        payload: {
          messageId: 'msg-1',
          npcs: [
            {
              id: 'npc-1',
              name: 'Orik',
              role: 'ally',
              description: 'Guide',
              appearance: 'Tall',
              personality: 'Kind',
              motivations: [],
              connections: [],
              sceneAppearances: ['scene-1'],
            },
          ],
          isComplete: true,
        },
      };

      expect(event.type).toBe('npc:compile_complete');
      expect(event.payload.npcs).toHaveLength(1);
    });

    it('should accept refined event', () => {
      const event: NPCRefinedEvent = {
        type: 'npc:refined',
        payload: {
          npc: {
            id: 'npc-1',
            name: 'Orik',
            role: 'ally',
            description: 'Updated description',
            appearance: 'Tall',
            personality: 'More mysterious',
            motivations: [],
            connections: [],
            sceneAppearances: ['scene-1'],
          },
        },
      };

      expect(event.type).toBe('npc:refined');
    });

    it('should accept confirmed event', () => {
      const event: NPCConfirmedEvent = {
        type: 'npc:confirmed',
        payload: {
          npcId: 'npc-1',
        },
      };

      expect(event.type).toBe('npc:confirmed');
    });

    it('should accept error event', () => {
      const event: NPCErrorEvent = {
        type: 'npc:error',
        payload: {
          code: 'COMPILE_FAILED',
          message: 'Failed to compile NPCs',
        },
      };

      expect(event.type).toBe('npc:error');
      expect(event.payload.code).toBe('COMPILE_FAILED');
    });

    it('should form valid server event union', () => {
      const events: NPCServerEvent[] = [
        { type: 'npc:compile_start', payload: { messageId: 'msg-1', totalScenes: 3 } },
        { type: 'npc:compile_chunk', payload: { messageId: 'msg-1', chunk: 'test' } },
        {
          type: 'npc:compile_complete',
          payload: { messageId: 'msg-1', npcs: [], isComplete: true },
        },
        {
          type: 'npc:refined',
          payload: {
            npc: {
              id: 'npc-1',
              name: 'Test',
              role: 'ally',
              description: '',
              appearance: '',
              personality: '',
              motivations: [],
              connections: [],
              sceneAppearances: [],
            },
          },
        },
        { type: 'npc:confirmed', payload: { npcId: 'npc-1' } },
        { type: 'npc:error', payload: { code: 'ERROR', message: 'test' } },
      ];

      expect(events).toHaveLength(6);
    });
  });
});

// =============================================================================
// API Types Tests
// =============================================================================

describe('NPC API Types', () => {
  describe('CompileNPCsRequest', () => {
    it('should accept valid request', () => {
      const request: CompileNPCsRequest = {
        sceneIds: ['scene-1', 'scene-2'],
        conversationHistory: [{ role: 'user', content: 'Hello' }],
      };

      expect(request.sceneIds).toHaveLength(2);
    });
  });

  describe('CompileNPCsResponse', () => {
    it('should accept valid response', () => {
      const response: CompileNPCsResponse = {
        messageId: 'msg-1',
        content: 'Here are the compiled NPCs.',
        npcs: [
          {
            id: 'npc-1',
            name: 'Orik',
            role: 'ally',
            description: 'A guide',
            appearance: 'Tall',
            personality: 'Kind',
            motivations: [],
            connections: [],
            sceneAppearances: ['scene-1'],
          },
        ],
        isComplete: true,
      };

      expect(response.messageId).toBe('msg-1');
      expect(response.npcs).toHaveLength(1);
    });
  });
});

// =============================================================================
// Echo Types Tests (Phase 4.3)
// =============================================================================

describe('Echo Types', () => {
  describe('EchoCategory', () => {
    it('should accept all valid echo categories', () => {
      const categories: EchoCategory[] = [
        'complications',
        'rumors',
        'discoveries',
        'intrusions',
        'wonders',
      ];

      expect(categories).toHaveLength(5);
      categories.forEach((cat) => {
        expect(typeof cat).toBe('string');
      });
    });
  });

  describe('Echo interface', () => {
    it('should accept valid echo with all fields', () => {
      const echo: Echo = {
        id: 'echo-1',
        category: 'complications',
        title: 'The Bridge Collapses',
        content: 'The ancient bridge begins to crumble beneath the party\'s feet.',
        tags: ['environmental', 'dramatic'],
        isConfirmed: false,
        createdAt: new Date().toISOString(),
      };

      expect(echo.id).toBe('echo-1');
      expect(echo.category).toBe('complications');
      expect(echo.title).toBe('The Bridge Collapses');
      expect(echo.isConfirmed).toBe(false);
    });

    it('should accept echo without optional tags', () => {
      const echo: Echo = {
        id: 'echo-2',
        category: 'rumors',
        title: 'Whispers in the Tavern',
        content: 'The locals speak of a hidden treasure in the old mine.',
        isConfirmed: true,
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      expect(echo.tags).toBeUndefined();
      expect(echo.isConfirmed).toBe(true);
    });

    it('should accept echoes for each category', () => {
      const categories: EchoCategory[] = ['complications', 'rumors', 'discoveries', 'intrusions', 'wonders'];

      categories.forEach((category) => {
        const echo: Echo = {
          id: `echo-${category}`,
          category,
          title: `Test ${category}`,
          content: `Content for ${category}`,
          isConfirmed: false,
          createdAt: new Date().toISOString(),
        };
        expect(echo.category).toBe(category);
      });
    });
  });
});

// =============================================================================
// Echo MCP Tool Types Tests
// =============================================================================

describe('GenerateEchoes MCP Tool', () => {
  describe('GenerateEchoesInput', () => {
    it('should accept valid input with all context', () => {
      const input: GenerateEchoesInput = {
        frame: {
          id: 'frame-1',
          name: 'The Hollow Vigil',
          description: 'A dark fantasy adventure',
          themes: ['mystery', 'redemption'],
          typicalAdversaries: ['undead'],
          lore: 'Ancient lore...',
          isCustom: true,
        },
        outline: {
          id: 'outline-1',
          title: 'Into the Hollow',
          summary: 'An adventure summary',
          scenes: [],
          isConfirmed: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        npcs: [
          {
            id: 'npc-1',
            name: 'Orik',
            role: 'ally',
            description: 'A guide',
            appearance: 'Tall',
            personality: 'Kind',
            motivations: [],
            connections: [],
            sceneAppearances: ['scene-1'],
          },
        ],
        dialsSummary: {
          partySize: 4,
          partyTier: 2,
          tone: 'dark and mysterious',
          themes: ['mystery', 'redemption'],
        },
        categories: ['complications', 'rumors'],
      };

      expect(input.frame.name).toBe('The Hollow Vigil');
      expect(input.categories).toHaveLength(2);
    });

    it('should accept input requesting all categories', () => {
      const input: GenerateEchoesInput = {
        frame: {
          id: 'frame-1',
          name: 'Test',
          description: 'Test',
          themes: [],
          typicalAdversaries: [],
          lore: '',
          isCustom: true,
        },
        outline: {
          id: 'outline-1',
          title: 'Test',
          summary: 'Test',
          scenes: [],
          isConfirmed: true,
          createdAt: '',
          updatedAt: '',
        },
        npcs: [],
        dialsSummary: {
          partySize: 4,
          partyTier: 1,
          tone: null,
          themes: [],
        },
      };

      // Categories should be optional, defaulting to all
      expect(input.categories).toBeUndefined();
    });
  });

  describe('GenerateEchoesOutput', () => {
    it('should accept valid output with generated echoes', () => {
      const output: GenerateEchoesOutput = {
        assistantMessage: 'I have generated 5 echoes across 2 categories.',
        echoes: [
          {
            id: 'echo-1',
            category: 'complications',
            title: 'The Bridge Collapses',
            content: 'Content here',
            isConfirmed: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'echo-2',
            category: 'rumors',
            title: 'Whispers',
            content: 'Content here',
            isConfirmed: false,
            createdAt: new Date().toISOString(),
          },
        ],
        isComplete: true,
      };

      expect(output.isComplete).toBe(true);
      expect(output.echoes).toHaveLength(2);
    });

    it('should accept output with follow-up question', () => {
      const output: GenerateEchoesOutput = {
        assistantMessage: 'Need clarification.',
        echoes: [],
        isComplete: false,
        followUpQuestion: 'Should I focus on combat-related echoes?',
      };

      expect(output.isComplete).toBe(false);
      expect(output.followUpQuestion).toBeDefined();
    });
  });
});

// =============================================================================
// Echo WebSocket Event Types Tests
// =============================================================================

describe('Echo WebSocket Events', () => {
  describe('Client Events', () => {
    it('should accept echo generate event', () => {
      const event: EchoGenerateEvent = {
        type: 'echo:generate',
        payload: {
          categories: ['complications', 'rumors'],
        },
      };

      expect(event.type).toBe('echo:generate');
      expect(event.payload.categories).toHaveLength(2);
    });

    it('should accept echo edit event', () => {
      const event: EchoEditEvent = {
        type: 'echo:edit',
        payload: {
          echoId: 'echo-1',
          updates: {
            title: 'Updated Title',
            content: 'Updated content',
          },
        },
      };

      expect(event.type).toBe('echo:edit');
      expect(event.payload.echoId).toBe('echo-1');
    });

    it('should accept echo confirm event', () => {
      const event: EchoConfirmEvent = {
        type: 'echo:confirm',
        payload: {
          echoId: 'echo-1',
        },
      };

      expect(event.type).toBe('echo:confirm');
    });

    it('should accept echo regenerate event', () => {
      const event: EchoRegenerateEvent = {
        type: 'echo:regenerate',
        payload: {
          echoId: 'echo-1',
          feedback: 'Make it more dramatic',
        },
      };

      expect(event.type).toBe('echo:regenerate');
      expect(event.payload.feedback).toBe('Make it more dramatic');
    });

    it('should form valid client event union', () => {
      const events: EchoClientEvent[] = [
        { type: 'echo:generate', payload: { categories: ['complications'] } },
        { type: 'echo:edit', payload: { echoId: 'echo-1', updates: { title: 'Test' } } },
        { type: 'echo:confirm', payload: { echoId: 'echo-1' } },
        { type: 'echo:regenerate', payload: { echoId: 'echo-1', feedback: 'test' } },
      ];

      expect(events).toHaveLength(4);
    });
  });

  describe('Server Events', () => {
    it('should accept generate start event', () => {
      const event: EchoGenerateStartEvent = {
        type: 'echo:generate_start',
        payload: {
          messageId: 'msg-1',
          categories: ['complications', 'rumors'],
        },
      };

      expect(event.type).toBe('echo:generate_start');
      expect(event.payload.categories).toHaveLength(2);
    });

    it('should accept generate chunk event', () => {
      const event: EchoGenerateChunkEvent = {
        type: 'echo:generate_chunk',
        payload: {
          messageId: 'msg-1',
          chunk: 'Generating complication: The Bridge...',
        },
      };

      expect(event.type).toBe('echo:generate_chunk');
    });

    it('should accept generate complete event', () => {
      const event: EchoGenerateCompleteEvent = {
        type: 'echo:generate_complete',
        payload: {
          messageId: 'msg-1',
          echoes: [
            {
              id: 'echo-1',
              category: 'complications',
              title: 'Test',
              content: 'Content',
              isConfirmed: false,
              createdAt: new Date().toISOString(),
            },
          ],
          isComplete: true,
        },
      };

      expect(event.type).toBe('echo:generate_complete');
      expect(event.payload.echoes).toHaveLength(1);
    });

    it('should accept echo updated event', () => {
      const event: EchoUpdatedEvent = {
        type: 'echo:updated',
        payload: {
          echo: {
            id: 'echo-1',
            category: 'rumors',
            title: 'Updated',
            content: 'Updated content',
            isConfirmed: false,
            createdAt: new Date().toISOString(),
          },
        },
      };

      expect(event.type).toBe('echo:updated');
    });

    it('should accept echo confirmed event', () => {
      const event: EchoConfirmedEvent = {
        type: 'echo:confirmed',
        payload: {
          echoId: 'echo-1',
        },
      };

      expect(event.type).toBe('echo:confirmed');
    });

    it('should accept echo error event', () => {
      const event: EchoErrorEvent = {
        type: 'echo:error',
        payload: {
          code: 'GENERATION_FAILED',
          message: 'Failed to generate echoes',
        },
      };

      expect(event.type).toBe('echo:error');
      expect(event.payload.code).toBe('GENERATION_FAILED');
    });

    it('should form valid server event union', () => {
      const events: EchoServerEvent[] = [
        { type: 'echo:generate_start', payload: { messageId: 'msg-1', categories: ['complications'] } },
        { type: 'echo:generate_chunk', payload: { messageId: 'msg-1', chunk: 'test' } },
        { type: 'echo:generate_complete', payload: { messageId: 'msg-1', echoes: [], isComplete: true } },
        {
          type: 'echo:updated',
          payload: {
            echo: {
              id: 'echo-1',
              category: 'rumors',
              title: 'Test',
              content: '',
              isConfirmed: false,
              createdAt: '',
            },
          },
        },
        { type: 'echo:confirmed', payload: { echoId: 'echo-1' } },
        { type: 'echo:error', payload: { code: 'ERROR', message: 'test' } },
      ];

      expect(events).toHaveLength(6);
    });
  });
});

// =============================================================================
// Echo API Types Tests
// =============================================================================

describe('Echo API Types', () => {
  describe('GenerateEchoesRequest', () => {
    it('should accept valid request', () => {
      const request: GenerateEchoesRequest = {
        categories: ['complications', 'rumors', 'discoveries'],
        conversationHistory: [{ role: 'user', content: 'Generate echoes' }],
      };

      expect(request.categories).toHaveLength(3);
    });

    it('should accept request without optional categories (defaults to all)', () => {
      const request: GenerateEchoesRequest = {};

      expect(request.categories).toBeUndefined();
    });
  });

  describe('GenerateEchoesResponse', () => {
    it('should accept valid response', () => {
      const response: GenerateEchoesResponse = {
        messageId: 'msg-1',
        content: 'Here are the generated echoes.',
        echoes: [
          {
            id: 'echo-1',
            category: 'wonders',
            title: 'Aurora of the Ancients',
            content: 'A magical aurora appears in the sky.',
            isConfirmed: false,
            createdAt: new Date().toISOString(),
          },
        ],
        isComplete: true,
      };

      expect(response.messageId).toBe('msg-1');
      expect(response.echoes).toHaveLength(1);
      expect(response.echoes[0].category).toBe('wonders');
    });
  });
});
