/**
 * E2E full-flow test — complete 6-stage adventure journey
 *
 * Drives the entire Sage Codex workflow from Invoking through Delivering
 * in a single test, using the MockController to swap SSE responses at
 * each stage transition.
 *
 * Stage sequence:
 *   1. Invoking  — spark extraction
 *   2. Attuning  — all 8 components confirmed
 *   3. Binding   — frame gallery + selection
 *   4. Weaving   — scene arcs + name approval
 *   5. Inscribing — 3 waves + scene confirmation
 *   6. Delivering — celebration panel
 */

import { test, expect } from '@playwright/test';
import { injectAuth } from './helpers/auth';
import { setupMockAPI } from './helpers/mock-api';
import {
  MOCK_SPARK,
  MOCK_FRAMES,
  MOCK_SCENE_ARCS,
  MOCK_ADVENTURE_NAME,
} from './helpers/fixtures';
import {
  buildInvokingGreetSSE,
  buildInvokingSSE,
  buildAttuningAllComponentsSSE,
  buildBindingFramesSSE,
  buildBindingSelectSSE,
  buildWeavingSceneArcsSSE,
  buildWeavingNameSSE,
  buildInscribingWaveSSE,
  buildInscribingConfirmSSE,
  buildDeliveringGreetSSE,
} from './helpers/sse-builders';

// =============================================================================
// Helpers
// =============================================================================

/** Send a chat message and wait for it to process */
async function sendMessage(
  page: import('@playwright/test').Page,
  text: string
): Promise<void> {
  const chatInput = page.getByLabel('Chat message input');
  await expect(chatInput).toBeVisible({ timeout: 10000 });
  await chatInput.fill(text);
  await chatInput.press('Enter');
}

/** Click a stage advance button and wait for navigation */
async function clickAdvance(
  page: import('@playwright/test').Page,
  buttonPattern: RegExp
): Promise<void> {
  const button = page.getByRole('button', { name: buttonPattern });
  await expect(button).toBeEnabled({ timeout: 15000 });
  await button.click();
  await page.waitForLoadState('networkidle');
}

// =============================================================================
// Full Journey Test
// =============================================================================

test.describe('Full Adventure Flow', () => {
  test('should complete the entire 6-stage journey', async ({ page }) => {
    const controller = await setupMockAPI(page, 'invoking');

    // =========================================================================
    // Stage 1: Invoking — Spark extraction
    // =========================================================================
    controller.setGreetResponse(buildInvokingGreetSSE());
    controller.setChatResponse(buildInvokingSSE());
    await injectAuth(page);

    await page.goto('/adventure');
    await page.waitForLoadState('networkidle');

    // Verify greeting appears
    await expect(page.getByText(/welcome, storyteller/i)).toBeVisible({
      timeout: 10000,
    });

    // Send vision to extract spark
    await sendMessage(page, 'A lighthouse goes dark on a remote coast');

    // Verify spark appears
    await expect(page.getByText(MOCK_SPARK.name)).toBeVisible({
      timeout: 10000,
    });

    // Advance to Attuning
    await clickAdvance(page, /continue to attuning/i);

    // =========================================================================
    // Stage 2: Attuning — All 8 components confirmed
    // =========================================================================
    controller.resetGreet();
    controller.setChatResponse(buildAttuningAllComponentsSSE());

    // Verify Attuning panel is visible (use .first() since StageDropdown
    // trigger also shows the stage name)
    await expect(page.getByText('Attuning').first()).toBeVisible({ timeout: 10000 });

    // Set all components at once
    await sendMessage(page, 'Use recommended defaults for everything');

    // Advance to Binding
    await clickAdvance(page, /continue to binding/i);

    // =========================================================================
    // Stage 3: Binding — Frame gallery + selection
    // =========================================================================
    controller.resetGreet();
    controller.setGreetResponse(buildBindingFramesSSE());
    controller.setChatResponse(buildBindingSelectSSE());

    // Verify frame gallery appears
    await expect(page.getByText(MOCK_FRAMES[0].name)).toBeVisible({
      timeout: 10000,
    });

    // Select the first frame
    await sendMessage(page, 'I choose The Drowned Lantern');

    // Advance to Weaving
    await clickAdvance(page, /continue to weaving/i);

    // =========================================================================
    // Stage 4: Weaving — Scene arcs + name approval
    // =========================================================================
    controller.resetGreet();
    controller.setGreetResponse(buildWeavingSceneArcsSSE());
    controller.setChatResponse(buildWeavingNameSSE());

    // Verify scene arcs appear
    await expect(page.getByText(MOCK_SCENE_ARCS[0].title)).toBeVisible({
      timeout: 10000,
    });

    // Confirm scenes and get name
    await sendMessage(page, 'Confirm all scenes');

    // Verify adventure name appears
    await expect(page.getByText(MOCK_ADVENTURE_NAME)).toBeVisible({
      timeout: 10000,
    });

    // Advance to Inscribing
    await clickAdvance(page, /continue to inscribing/i);

    // =========================================================================
    // Stage 5: Inscribing — 3 waves + scene confirmation
    // =========================================================================
    controller.resetGreet();
    controller.setGreetResponse(
      buildInscribingWaveSSE({ sceneArcId: 'arc-001', wave: 1 })
    );

    // Verify Wave 1 sections appear
    await expect(page.getByText('Overview')).toBeVisible({ timeout: 10000 });

    // Trigger scene confirmation (last scene)
    controller.setChatResponse(
      buildInscribingConfirmSSE({
        sceneArcId: 'arc-001',
        isLastScene: true,
      })
    );
    await sendMessage(page, 'Confirm this scene');

    // Verify completion message
    await expect(
      page.getByText(/all scenes are inscribed/i)
    ).toBeVisible({ timeout: 10000 });

    // =========================================================================
    // Stage 6: Delivering — Celebration panel
    // =========================================================================
    // Advance to Delivering (the advance button may use a different pattern
    // depending on the stage footer label for inscribing)
    controller.resetGreet();
    controller.setGreetResponse(buildDeliveringGreetSSE());

    // Look for advance button (inscribing footer uses "Continue to Delivering"
    // or similar pattern when all scenes are done)
    const advanceButton = page.getByRole('button', {
      name: /continue to delivering/i,
    });
    const isAdvanceVisible = await advanceButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (isAdvanceVisible) {
      await advanceButton.click();
      await page.waitForLoadState('networkidle');
    }

    // The celebration message should appear (either from greet or from chat)
    await expect(
      page.getByText(/your adventure is complete|bring this tale to life/i)
    ).toBeVisible({ timeout: 15000 });
  });
});
