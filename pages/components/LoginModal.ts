import { Page } from '@playwright/test';

/** "Log in" modal (#logInModal) — opened from the nav bar on any page. */
export class LoginModal {
  constructor(readonly page: Page) {}

  get modal() {
    return this.page.locator('#logInModal');
  }

  get usernameInput() {
    return this.page.locator('#loginusername');
  }

  get passwordInput() {
    return this.page.locator('#loginpassword');
  }

  get loginButton() {
    return this.page.locator('#logInModal .modal-footer button.btn-primary');
  }

  get closeButton() {
    return this.page.locator('#logInModal .modal-header .close');
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
