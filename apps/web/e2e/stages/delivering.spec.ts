/**
 * E2E tests for the Delivering stage
 *
 * Tests the final stage where the Sage presents the completed adventure
 * in a celebration panel.
 *
 * Covers:
 * - Celebration panel display
 * - Adventure title shown
 * - Spark callback section
 * - Send-off narrative text
 * - Download button visibility
 */

import { test, expect } from '@playwright/test';
import { injectAuth } from '../helpers/auth';
import { setupMockAPI } from '../helpers/mock-api';
import { MOCK_ADVENTURE_NAME, MOCK_SPARK } from '../helpers/fixtures';
import { buildDeliveringGreetSSE } from '../helpers/sse-builders';

test.describe('Delivering Stage', () => {
  test('should display celebration greeting', async ({ page }) => {
    const controller = await setupMockAPI(page, 'delivering');
    controller.setGreetResponse(buildDeliveringGreetSSE());
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // The Sage's celebration message should appear
    await expect(
      page.getByText(/your adventure is complete/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display adventure title', async ({ page }) => {
    await setupMockAPI(page, 'delivering');
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Adventure title should appear in the celebration panel
    // (from adventure state in session response; scoped to panel to avoid
    // ambiguity with the Header banner)
    await expect(
      page.getByLabel('Adventure panel').getByText(MOCK_ADVENTURE_NAME)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display spark callback section', async ({ page }) => {
    await setupMockAPI(page, 'delivering');
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // The "Your Spark" section label should be visible
    await expect(page.getByText('Your Spark')).toBeVisible({
      timeout: 10000,
    });

    // The spark vision text should appear in the callback
    await expect(page.getByText(MOCK_SPARK.vision)).toBeVisible({
      timeout: 5000,
    });
  });

  test('should display narrative send-off', async ({ page }) => {
    await setupMockAPI(page, 'delivering');
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // The send-off text should appear
    await expect(
      page.getByText(/your adventure has been delivered/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display download button', async ({ page }) => {
    await setupMockAPI(page, 'delivering');
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // The download button should be visible
    const downloadButton = page.getByRole('button', {
      name: /bring this tale to life/i,
    });
    await expect(downloadButton).toBeVisible({ timeout: 10000 });
  });
});
