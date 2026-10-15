import { Page } from '@playwright/test';

export interface ContactDetails {
  email: string;
  name: string;
  message: string;
}

/** "New message" contact modal (#exampleModal) — opened from the nav bar. */
export class ContactModal {
  constructor(readonly page: Page) {}

  get modal() {
    return this.page.locator('#exampleModal');
  }

  get emailInput() {
    return this.page.locator('#recipient-email');
  }

  get nameInput() {
    return this.page.locator('#recipient-name');
  }

  get messageInput() {
    return this.page.locator('#message-text');
  }

  get sendButton() {
    return this.page.locator('#exampleModal .modal-footer button.btn-primary');
  }

  get closeButton() {
    return this.page.locator('#exampleModal .modal-header .close');
  }

  async send(details: ContactDetails): Promise<void> {
    await this.emailInput.fill(details.email);
    await this.nameInput.fill(details.name);
    await this.messageInput.fill(details.message);
    await this.sendButton.click();
  }
}
