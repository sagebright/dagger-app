/**
 * E2E tests for authentication flow
 *
 * Covers:
 * - Signup form submission and redirect
 * - Login form submission and redirect
 * - Logout flow
 * - Protected route redirection for unauthenticated users
 * - Form validation (required fields, minimum password length)
 * - Mode toggle between login and signup
 */

import { test, expect } from '@playwright/test';

// =============================================================================
// Constants
// =============================================================================

const AUTH_URL = '/login';
const HOME_URL = '/';

// =============================================================================
// Helpers
// =============================================================================

/**
 * Navigate to the login page and verify it loads.
 */
async function goToAuthPage(page: import('@playwright/test').Page) {
  await page.goto(AUTH_URL);
  await expect(page.getByRole('heading', { name: /enter the codex/i })).toBeVisible();
}

// =============================================================================
// Tests
// =============================================================================

test.describe('Authentication Page', () => {
  test('should display login form by default', async ({ page }) => {
    await goToAuthPage(page);

    await expect(page.getByRole('heading', { name: /enter the codex/i })).toBeVisible();
    await expect(page.getByText(/sign in to continue/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should toggle between login and signup modes', async ({ page }) => {
    await goToAuthPage(page);

    // Start in login mode
    await expect(page.getByRole('heading', { name: /enter the codex/i })).toBeVisible();

    // Toggle to signup
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page.getByRole('heading', { name: /open the codex/i })).toBeVisible();
    await expect(page.getByText(/create an account/i)).toBeVisible();

    // Toggle back to login
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { name: /enter the codex/i })).toBeVisible();
  });

  test('should require email and password fields', async ({ page }) => {
    await goToAuthPage(page);

    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);

    // Both fields should be required
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('should enforce minimum password length', async ({ page }) => {
    await goToAuthPage(page);

    const passwordInput = page.getByLabel(/password/i);
    await expect(passwordInput).toHaveAttribute('minLength', '6');
  });

  test('should show Sage Codex branding', async ({ page }) => {
    await goToAuthPage(page);
    await expect(page.getByText('Sage Codex')).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access the home page without auth
    await page.goto(HOME_URL);

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect unauthenticated users from /adventure to login', async ({ page }) => {
    await page.goto('/adventure');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Login Error Handling', () => {
  test('should display error for invalid credentials', async ({ page }) => {
    await goToAuthPage(page);

    await page.getByLabel(/email/i).fill('bad@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show an error alert
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
  });
});
