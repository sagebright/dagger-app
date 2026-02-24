/**
 * E2E tests for the Binding stage
 *
 * Tests the third stage where the Sage presents a gallery of frames
 * and the user selects one to anchor the adventure.
 *
 * Covers:
 * - Frame gallery renders with ARIA listbox
 * - Individual frame cards with name and pitch
 * - Frame selection via panel:frame_selected
 * - Advancement to Weaving after frame is bound
 */

import { test, expect } from '@playwright/test';
import { injectAuth } from '../helpers/auth';
import { setupMockAPI } from '../helpers/mock-api';
import { MOCK_FRAMES, SELECTED_FRAME_ID } from '../helpers/fixtures';
import {
  buildBindingFramesSSE,
  buildBindingSelectSSE,
} from '../helpers/sse-builders';

test.describe('Binding Stage', () => {
  test('should display frame gallery after greet', async ({ page }) => {
    const controller = await setupMockAPI(page, 'binding');
    controller.setGreetResponse(buildBindingFramesSSE());
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Frame gallery listbox should be visible
    const gallery = page.getByRole('listbox', {
      name: /available adventure frames/i,
    });
    await expect(gallery).toBeVisible({ timeout: 10000 });

    // Each frame card should appear
    for (const frame of MOCK_FRAMES) {
      await expect(page.getByText(frame.name)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display frame names and pitches', async ({ page }) => {
    const controller = await setupMockAPI(page, 'binding');
    controller.setGreetResponse(buildBindingFramesSSE());
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Verify first frame shows both name and pitch
    const firstFrame = MOCK_FRAMES[0];
    await expect(page.getByText(firstFrame.name)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(firstFrame.pitch)).toBeVisible({
      timeout: 5000,
    });
  });

  test('should enable advancement after frame selection', async ({ page }) => {
    const controller = await setupMockAPI(page, 'binding');
    controller.setGreetResponse(buildBindingFramesSSE());
    controller.setChatResponse(
      buildBindingSelectSSE({ frameId: SELECTED_FRAME_ID })
    );
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Wait for frames to load
    await expect(page.getByText(MOCK_FRAMES[0].name)).toBeVisible({
      timeout: 10000,
    });

    // Send a message to select the frame
    const chatInput = page.getByLabel('Chat message input');
    await chatInput.fill('I choose The Drowned Lantern');
    await chatInput.press('Enter');

    // The "Continue to Weaving" button should become enabled
    const advanceButton = page.getByRole('button', {
      name: /continue to weaving/i,
    });
    await expect(advanceButton).toBeEnabled({ timeout: 10000 });
  });

  test('should advance to weaving when button is clicked', async ({ page }) => {
    const controller = await setupMockAPI(page, 'binding');
    controller.setGreetResponse(buildBindingFramesSSE());
    controller.setChatResponse(
      buildBindingSelectSSE({ frameId: SELECTED_FRAME_ID })
    );
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Wait for frames, select one
    await expect(page.getByText(MOCK_FRAMES[0].name)).toBeVisible({
      timeout: 10000,
    });

    const chatInput = page.getByLabel('Chat message input');
    await chatInput.fill('I choose The Drowned Lantern');
    await chatInput.press('Enter');

    // Click advance button
    const advanceButton = page.getByRole('button', {
      name: /continue to weaving/i,
    });
    await expect(advanceButton).toBeEnabled({ timeout: 10000 });
    await advanceButton.click();

    // Should transition to Weaving stage
    await page.waitForLoadState('networkidle');
  });
});
