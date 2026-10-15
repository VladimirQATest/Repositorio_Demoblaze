import { Page } from '@playwright/test';

/** "Sign up" modal (#signInModal) — opened from the nav bar on any page. */
export class SignUpModal {
  constructor(readonly page: Page) {}

  get modal() {
    return this.page.locator('#signInModal');
  }

  get usernameInput() {
    return this.page.locator('#sign-username');
  }

  get passwordInput() {
    return this.page.locator('#sign-password');
  }

  get signUpButton() {
    return this.page.locator('#signInModal .modal-footer button.btn-primary');
  }

  get closeButton() {
    return this.page.locator('#signInModal .modal-header .close');
  }

  async signUp(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.signUpButton.click();
  }
}
