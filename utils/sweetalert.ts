import { expect, Page } from '@playwright/test';

/**
 * Helper for the purchase success popup.
 *
 * DemoBlaze uses bootstrap-sweetalert (legacy .swal() API), which renders:
 *   <div class="sweet-alert"> <h2>title</h2> <p>text</p> <button class="confirm">OK</button>
 * The exact confirm-button class can vary between sweetalert versions —
 * verify `.sweet-alert .confirm` at runtime if this changes.
 */
export class PurchaseSuccessDialog {
  constructor(readonly page: Page) {}

  get alert() {
    return this.page.locator('.sweet-alert');
  }

  get title() {
    return this.page.locator('.sweet-alert h2');
  }

  get text() {
    return this.page.locator('.sweet-alert p');
  }

  get confirmButton() {
    return this.page.locator('.sweet-alert .confirm');
  }

  async waitForVisible(): Promise<void> {
    await expect(this.alert).toBeVisible();
  }

  async confirm(): Promise<void> {
    // bootstrap-sweetalert runs a popIn entrance animation; clicking the
    // confirm button while the animation is still running does NOT trigger
    // the confirm callback (verified against the live app). Wait for the
    // animation to settle first.
    await this.page.waitForTimeout(2000);
    await this.confirmButton.click();
  }
}
