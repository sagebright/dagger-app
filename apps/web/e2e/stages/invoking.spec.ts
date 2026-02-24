/**
 * E2E tests for the Invoking stage
 *
 * Tests the first stage of the Unfolding where the user shares
 * their adventure vision and the Sage distills it into a Spark.
 *
 * Covers:
 * - Greeting message on first visit
 * - Spark extraction via set_spark tool
 * - Spark panel population with name and vision
 * - Stage advancement button becomes enabled after ui:ready
 * - Advancing to Attuning stage
 */

import { test, expect } from '@playwright/test';
import { injectAuth } from '../helpers/auth';
import { setupMockAPI } from '../helpers/mock-api';
import { MOCK_SPARK } from '../helpers/fixtures';
import {
  buildInvokingSSE,
  buildInvokingGreetSSE,
} from '../helpers/sse-builders';

test.describe('Invoking Stage', () => {
  test('should display greeting on first visit', async ({ page }) => {
    const controller = await setupMockAPI(page, 'invoking');
    controller.setGreetResponse(buildInvokingGreetSSE());
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // The Sage's greeting should appear in the chat area
    await expect(page.getByText(/welcome, storyteller/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test('should populate spark panel after user message', async ({ page }) => {
    const controller = await setupMockAPI(page, 'invoking');
    controller.setChatResponse(buildInvokingSSE({ spark: MOCK_SPARK }));
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Send a message describing the adventure vision
    const chatInput = page.getByLabel('Chat message input');
    await chatInput.fill('A lighthouse goes dark on a remote coast');
    await chatInput.press('Enter');

    // Wait for the spark to appear in the right panel
    await expect(page.getByText(MOCK_SPARK.name)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(MOCK_SPARK.vision)).toBeVisible({
      timeout: 10000,
    });
  });

  test('should enable advancement after spark is set', async ({ page }) => {
    const controller = await setupMockAPI(page, 'invoking');
    controller.setChatResponse(buildInvokingSSE());
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Send a message to trigger spark extraction
    const chatInput = page.getByLabel('Chat message input');
    await chatInput.fill('Dark fantasy coastal mystery');
    await chatInput.press('Enter');

    // The "Continue to Attuning" button should become enabled
    const advanceButton = page.getByRole('button', {
      name: /continue to attuning/i,
    });
    await expect(advanceButton).toBeEnabled({ timeout: 10000 });
  });

  test('should advance to attuning when button is clicked', async ({ page }) => {
    const controller = await setupMockAPI(page, 'invoking');
    controller.setChatResponse(buildInvokingSSE());
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Trigger spark extraction
    const chatInput = page.getByLabel('Chat message input');
    await chatInput.fill('Dark fantasy coastal mystery');
    await chatInput.press('Enter');

    // Wait for advance button to be enabled, then click
    const advanceButton = page.getByRole('button', {
      name: /continue to attuning/i,
    });
    await expect(advanceButton).toBeEnabled({ timeout: 10000 });
    await advanceButton.click();

    // Stage should advance — session PATCH will update the controller stage
    // Verify Attuning content by checking for component group labels
    await expect(page.getByText('Session')).toBeVisible({ timeout: 10000 });
  });
});
