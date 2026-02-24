/**
 * E2E tests for the Inscribing stage
 *
 * Tests the fifth stage where the Sage writes scene details in 3 waves:
 *   Wave 1: Overview, Setup, Developments
 *   Wave 2: NPCs Present, Adversaries, Items
 *   Wave 3: Transitions, Portents, GM Notes
 *
 * Covers:
 * - Wave 1 section accordion population
 * - Wave 2 entity cards (NPCs, adversaries, items)
 * - Wave 3 sections (transitions, portents, GM notes)
 * - Scene confirmation
 * - Advancement to Delivering after all scenes inscribed
 */

import { test, expect } from '@playwright/test';
import { injectAuth } from '../helpers/auth';
import { setupMockAPI } from '../helpers/mock-api';
import { MOCK_WAVE1_SECTIONS, MOCK_WAVE2_SECTIONS } from '../helpers/fixtures';
import {
  buildInscribingWaveSSE,
  buildInscribingConfirmSSE,
} from '../helpers/sse-builders';

test.describe('Inscribing Stage', () => {
  test('should display section accordion after Wave 1', async ({ page }) => {
    const controller = await setupMockAPI(page, 'inscribing');
    controller.setGreetResponse(
      buildInscribingWaveSSE({ sceneArcId: 'arc-001', wave: 1 })
    );
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // The scene sections region should be visible
    const accordion = page.getByRole('region', { name: /scene sections/i });
    await expect(accordion).toBeVisible({ timeout: 10000 });

    // Wave 1 sections should appear
    for (const section of MOCK_WAVE1_SECTIONS) {
      await expect(page.getByText(section.label)).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('should display Wave 1 divider label', async ({ page }) => {
    const controller = await setupMockAPI(page, 'inscribing');
    controller.setGreetResponse(
      buildInscribingWaveSSE({ sceneArcId: 'arc-001', wave: 1 })
    );
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Wave divider label should show
    await expect(
      page.getByText(/wave 1.*primary narrative/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should populate entity cards after Wave 2', async ({ page }) => {
    const controller = await setupMockAPI(page, 'inscribing');
    // First load Wave 1, then Wave 2
    controller.setGreetResponse(
      buildInscribingWaveSSE({ sceneArcId: 'arc-001', wave: 1 })
    );
    controller.setChatResponse(
      buildInscribingWaveSSE({ sceneArcId: 'arc-001', wave: 2 })
    );
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Trigger Wave 2
    const chatInput = page.getByLabel('Chat message input');
    await chatInput.fill('Continue with Wave 2');
    await chatInput.press('Enter');

    // Wave 2 section labels should appear
    for (const section of MOCK_WAVE2_SECTIONS) {
      await expect(page.getByText(section.label)).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test('should populate Wave 3 sections', async ({ page }) => {
    const controller = await setupMockAPI(page, 'inscribing');
    controller.setGreetResponse(
      buildInscribingWaveSSE({ sceneArcId: 'arc-001', wave: 1 })
    );
    controller.setChatResponse(
      buildInscribingWaveSSE({ sceneArcId: 'arc-001', wave: 3 })
    );
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Trigger Wave 3
    const chatInput = page.getByLabel('Chat message input');
    await chatInput.fill('Continue with Wave 3');
    await chatInput.press('Enter');

    // Wave 3 divider should appear
    await expect(page.getByText(/wave 3.*synthesis/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test('should confirm scene and enable advancement for last scene', async ({
    page,
  }) => {
    const controller = await setupMockAPI(page, 'inscribing');
    controller.setGreetResponse(
      buildInscribingWaveSSE({ sceneArcId: 'arc-001', wave: 1 })
    );
    controller.setChatResponse(
      buildInscribingConfirmSSE({
        sceneArcId: 'arc-001',
        isLastScene: true,
      })
    );
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Confirm the scene
    const chatInput = page.getByLabel('Chat message input');
    await chatInput.fill('Confirm this scene');
    await chatInput.press('Enter');

    // The Sage should confirm inscription is complete
    await expect(
      page.getByText(/all scenes are inscribed/i)
    ).toBeVisible({ timeout: 10000 });
  });
});
