import { Page } from '@playwright/test';

/** "About us" modal (#videoModal) — contains a Video.js player. */
export class AboutModal {
  constructor(readonly page: Page) {}

  get modal() {
    return this.page.locator('#videoModal');
  }

  get video() {
    return this.page.locator('#example-video');
  }

  get closeButton() {
    return this.page.locator('#videoModal .modal-header .close');
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }
}
