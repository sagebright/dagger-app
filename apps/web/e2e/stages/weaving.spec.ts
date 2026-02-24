/**
 * E2E tests for the Weaving stage
 *
 * Tests the fourth stage where the Sage drafts scene arcs and
 * the user confirms them sequentially.
 *
 * Covers:
 * - Scene arcs appear in the panel
 * - Scene tabs render with ARIA tablist
 * - Sequential scene confirmation flow
 * - Adventure name suggestion
 * - Advancement to Inscribing after all scenes confirmed
 */

import { test, expect } from '@playwright/test';
import { injectAuth } from '../helpers/auth';
import { setupMockAPI } from '../helpers/mock-api';
import { MOCK_SCENE_ARCS, MOCK_ADVENTURE_NAME } from '../helpers/fixtures';
import {
  buildWeavingSceneArcsSSE,
  buildWeavingNameSSE,
} from '../helpers/sse-builders';

test.describe('Weaving Stage', () => {
  test('should display scene arcs after greet', async ({ page }) => {
    const controller = await setupMockAPI(page, 'weaving');
    controller.setGreetResponse(buildWeavingSceneArcsSSE());
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Scene tabs should be visible
    const tablist = page.getByRole('tablist', { name: /scene tabs/i });
    await expect(tablist).toBeVisible({ timeout: 10000 });

    // First scene arc title should be displayed
    await expect(
      page.getByText(MOCK_SCENE_ARCS[0].title)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should render scene tabs for all arcs', async ({ page }) => {
    const controller = await setupMockAPI(page, 'weaving');
    controller.setGreetResponse(buildWeavingSceneArcsSSE());
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Each scene should have a tab
    for (const arc of MOCK_SCENE_ARCS) {
      const tab = page.getByRole('tab', {
        name: `Scene ${arc.sceneNumber}`,
      });
      await expect(tab).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display scene arc description in tabpanel', async ({ page }) => {
    const controller = await setupMockAPI(page, 'weaving');
    controller.setGreetResponse(buildWeavingSceneArcsSSE());
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // The first scene's description should appear
    const descriptionText = MOCK_SCENE_ARCS[0].description.slice(0, 40);
    await expect(page.getByText(descriptionText)).toBeVisible({
      timeout: 10000,
    });
  });

  test('should suggest adventure name via panel:name', async ({ page }) => {
    const controller = await setupMockAPI(page, 'weaving');
    controller.setGreetResponse(buildWeavingSceneArcsSSE());
    controller.setChatResponse(buildWeavingNameSSE());
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Confirm scenes via chat
    const chatInput = page.getByLabel('Chat message input');
    await chatInput.fill('These look great, confirm all scenes');
    await chatInput.press('Enter');

    // The adventure name should appear
    await expect(page.getByText(MOCK_ADVENTURE_NAME)).toBeVisible({
      timeout: 10000,
    });
  });

  test('should enable advancement after name approval', async ({ page }) => {
    const controller = await setupMockAPI(page, 'weaving');
    controller.setGreetResponse(buildWeavingSceneArcsSSE());
    controller.setChatResponse(buildWeavingNameSSE());
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Trigger name suggestion
    const chatInput = page.getByLabel('Chat message input');
    await chatInput.fill('Confirm all scenes');
    await chatInput.press('Enter');

    // Advance button should become enabled
    const advanceButton = page.getByRole('button', {
      name: /continue to inscribing/i,
    });
    await expect(advanceButton).toBeEnabled({ timeout: 10000 });
  });
});
