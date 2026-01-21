/**
 * Tests for echo templates and constants
 */

import { describe, it, expect } from 'vitest';
import {
  ECHO_TEMPLATES,
  ECHOES_PER_CATEGORY,
  VALID_ECHO_CATEGORIES,
  type EchoTemplate,
} from './echo-templates.js';
import type { EchoCategory } from '@dagger-app/shared-types';

describe('Echo Templates', () => {
  describe('ECHOES_PER_CATEGORY', () => {
    it('should be 2', () => {
      expect(ECHOES_PER_CATEGORY).toBe(2);
    });
  });

  describe('VALID_ECHO_CATEGORIES', () => {
    it('should contain all 5 echo categories', () => {
      expect(VALID_ECHO_CATEGORIES).toHaveLength(5);
      expect(VALID_ECHO_CATEGORIES).toContain('complications');
      expect(VALID_ECHO_CATEGORIES).toContain('rumors');
      expect(VALID_ECHO_CATEGORIES).toContain('discoveries');
      expect(VALID_ECHO_CATEGORIES).toContain('intrusions');
      expect(VALID_ECHO_CATEGORIES).toContain('wonders');
    });

    it('should be a readonly array', () => {
      // TypeScript ensures this at compile time, but we verify the values are correct
      const categories: readonly EchoCategory[] = VALID_ECHO_CATEGORIES;
      expect(categories).toBeDefined();
    });
  });

  describe('ECHO_TEMPLATES', () => {
    it('should have templates for all 5 categories', () => {
      const categories = Object.keys(ECHO_TEMPLATES);
      expect(categories).toHaveLength(5);
      expect(categories).toContain('complications');
      expect(categories).toContain('rumors');
      expect(categories).toContain('discoveries');
      expect(categories).toContain('intrusions');
      expect(categories).toContain('wonders');
    });

    it('should have 5 templates per category', () => {
      for (const category of VALID_ECHO_CATEGORIES) {
        expect(ECHO_TEMPLATES[category]).toHaveLength(5);
      }
    });

    it('should have valid template structure', () => {
      for (const category of VALID_ECHO_CATEGORIES) {
        for (const template of ECHO_TEMPLATES[category]) {
          expect(template).toHaveProperty('title');
          expect(template).toHaveProperty('content');
          expect(typeof template.title).toBe('string');
          expect(typeof template.content).toBe('string');
          expect(template.title.length).toBeGreaterThan(0);
          expect(template.content.length).toBeGreaterThan(0);
        }
      }
    });

    describe('complications templates', () => {
      it('should include expected templates', () => {
        const titles = ECHO_TEMPLATES.complications.map((t) => t.title);
        expect(titles).toContain('The Bridge Collapses');
        expect(titles).toContain('Sudden Storm');
        expect(titles).toContain('Resource Shortage');
        expect(titles).toContain('Blocked Path');
        expect(titles).toContain('Time Pressure');
      });
    });

    describe('rumors templates', () => {
      it('should include expected templates', () => {
        const titles = ECHO_TEMPLATES.rumors.map((t) => t.title);
        expect(titles).toContain('Whispers of Treasure');
        expect(titles).toContain("A Stranger's Warning");
        expect(titles).toContain('Political Intrigue');
        expect(titles).toContain('Missing Persons');
        expect(titles).toContain('Ancient Prophecy');
      });
    });

    describe('discoveries templates', () => {
      it('should include expected templates', () => {
        const titles = ECHO_TEMPLATES.discoveries.map((t) => t.title);
        expect(titles).toContain('Hidden Chamber');
        expect(titles).toContain('Ancient Inscription');
        expect(titles).toContain('Unexpected Ally');
        expect(titles).toContain('Lost Artifact');
        expect(titles).toContain('Truth Revealed');
      });
    });

    describe('intrusions templates', () => {
      it('should include expected templates', () => {
        const titles = ECHO_TEMPLATES.intrusions.map((t) => t.title);
        expect(titles).toContain('Uninvited Guest');
        expect(titles).toContain('Ambush');
        expect(titles).toContain('Environmental Hazard');
        expect(titles).toContain('Message Arrives');
        expect(titles).toContain('Old Enemy Returns');
      });
    });

    describe('wonders templates', () => {
      it('should include expected templates', () => {
        const titles = ECHO_TEMPLATES.wonders.map((t) => t.title);
        expect(titles).toContain('Aurora of Magic');
        expect(titles).toContain('Living Architecture');
        expect(titles).toContain('Cosmic Alignment');
        expect(titles).toContain('Spirit Visitation');
        expect(titles).toContain('Natural Wonder');
      });
    });
  });

  describe('EchoTemplate type', () => {
    it('should allow valid template objects', () => {
      const template: EchoTemplate = {
        title: 'Test Title',
        content: 'Test content',
      };
      expect(template.title).toBe('Test Title');
      expect(template.content).toBe('Test content');
    });
  });
});
