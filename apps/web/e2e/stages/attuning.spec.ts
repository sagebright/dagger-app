/**
 * E2E tests for the Attuning stage
 *
 * Tests the second stage where the user tunes the 8 adventure components
 * through conversational chat with the Sage.
 *
 * Covers:
 * - Component panel displays all 8 components
 * - Setting a single component via chat
 * - All-confirmed state enables advancement
 * - Advancing to Binding stage
 */

import { test, expect } from '@playwright/test';
import { injectAuth } from '../helpers/auth';
import { setupMockAPI } from '../helpers/mock-api';
import {
  buildAttuningSSE,
  buildAttuningAllComponentsSSE,
} from '../helpers/sse-builders';

test.describe('Attuning Stage', () => {
  test('should display component summary panel', async ({ page }) => {
    await setupMockAPI(page, 'attuning');
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // The panel should show the Attuning label
    await expect(page.getByText('Attuning')).toBeVisible({ timeout: 10000 });

    // Should show component group labels
    await expect(page.getByText('Session')).toBeVisible();
    await expect(page.getByText('Party')).toBeVisible();
    await expect(page.getByText('Essence')).toBeVisible();
  });

  test('should update component after chat message', async ({ page }) => {
    const controller = await setupMockAPI(page, 'attuning');
    controller.setChatResponse(
      buildAttuningSSE({ componentId: 'span', value: '3-4 hours' })
    );
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Send a message about session length
    const chatInput = page.getByLabel('Chat message input');
    await chatInput.fill('I want a 3-4 hour session');
    await chatInput.press('Enter');

    // The Sage's response should appear
    await expect(page.getByText(/set span/i)).toBeVisible({ timeout: 10000 });
  });

  test('should enable advancement when all components confirmed', async ({
    page,
  }) => {
    const controller = await setupMockAPI(page, 'attuning');
    controller.setChatResponse(buildAttuningAllComponentsSSE());
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Send a message that triggers all components being set
    const chatInput = page.getByLabel('Chat message input');
    await chatInput.fill('Set all defaults');
    await chatInput.press('Enter');

    // The "Continue to Binding" button should become enabled
    const advanceButton = page.getByRole('button', {
      name: /continue to binding/i,
    });
    await expect(advanceButton).toBeEnabled({ timeout: 10000 });
  });

  test('should advance to binding when button is clicked', async ({ page }) => {
    const controller = await setupMockAPI(page, 'attuning');
    controller.setChatResponse(buildAttuningAllComponentsSSE());
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Trigger all components being set
    const chatInput = page.getByLabel('Chat message input');
    await chatInput.fill('Set all defaults');
    await chatInput.press('Enter');

    // Wait for advance button and click
    const advanceButton = page.getByRole('button', {
      name: /continue to binding/i,
    });
    await expect(advanceButton).toBeEnabled({ timeout: 10000 });
    await advanceButton.click();

    // Should show Binding stage content
    await expect(
      page.getByText(/available adventure frames/i)
    ).toBeVisible({ timeout: 10000 });
  });
});
