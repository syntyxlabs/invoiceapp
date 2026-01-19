import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')

    // Check page title
    await expect(page.locator('h1')).toContainText('Syntyx Labs Invoices')

    // Check form elements exist
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Check links exist
    await expect(page.getByText('Forgot password?')).toBeVisible()
    await expect(page.getByText('Sign up')).toBeVisible()
  })

  test('signup page renders correctly', async ({ page }) => {
    await page.goto('/signup')

    // Check form elements exist
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Check link to login exists
    await expect(page.getByText('Sign in')).toBeVisible()
  })

  test('forgot password page renders correctly', async ({ page }) => {
    await page.goto('/forgot-password')

    // Check form elements exist
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Check link to login exists
    await expect(page.getByText('Sign in')).toBeVisible()
  })

  test('login form shows validation errors for empty fields', async ({ page }) => {
    await page.goto('/login')

    // Submit empty form
    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('.error-message')).toBeVisible()
  })

  test('login form shows error for invalid email format', async ({ page }) => {
    await page.goto('/login')

    // Fill invalid email
    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="password"]', 'somepassword')
    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('.error-message')).toContainText('valid email')
  })

  test('can navigate between auth pages', async ({ page }) => {
    // Start at login
    await page.goto('/login')

    // Navigate to signup
    await page.click('text=Sign up')
    await expect(page).toHaveURL('/signup')

    // Navigate back to login
    await page.click('text=Sign in')
    await expect(page).toHaveURL('/login')

    // Navigate to forgot password
    await page.click('text=Forgot password?')
    await expect(page).toHaveURL('/forgot-password')
  })

  test('unauthenticated user is redirected from dashboard to login', async ({ page }) => {
    await page.goto('/')

    // Should be redirected to login
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('login page is mobile-friendly', async ({ page }) => {
    await page.goto('/login')

    // Form should be visible and properly sized
    const card = page.locator('[class*="card"]')
    await expect(card).toBeVisible()

    // Input fields should be full width
    const emailInput = page.locator('input[name="email"]')
    const inputBox = await emailInput.boundingBox()
    expect(inputBox?.width).toBeGreaterThan(250)
  })
})
