import { expect, Page } from '@playwright/test';
import { AboutModal } from './AboutModal';
import { ContactModal } from './ContactModal';
import { LoginModal } from './LoginModal';
import { SignUpModal } from './SignUpModal';

/**
 * Top navigation bar — present on every page (index.html, prod.html, cart.html).
 * Note: "Log in" and "Log out" links toggle visibility based on auth state.
 */
export class NavBar {
  constructor(readonly page: Page) {}

  get brand() {
    return this.page.locator('a#nava');
  }

  get homeLink() {
    return this.page.locator('a.nav-link[href="index.html"]');
  }

  get contactLink() {
    return this.page.getByRole('link', { name: 'Contact', exact: true });
  }

  get aboutUsLink() {
    return this.page.getByRole('link', { name: 'About us', exact: true });
  }

  /** "Cart" link — a#cartur on index/prod, onclick="showcart()" on cart.html. */
  get cartLink() {
    return this.page.getByRole('link', { name: 'Cart', exact: true });
  }

  get loginLink() {
    return this.page.locator('#login2');
  }

  /** Hidden (display:none) until the user is logged in. */
  get logoutLink() {
    return this.page.locator('#logout2');
  }

  get signUpLink() {
    return this.page.locator('#signin2');
  }

  /** Shows "Welcome <username>" after login. */
  get welcomeUser() {
    return this.page.locator('#nameofuser');
  }

  async openContactModal(): Promise<ContactModal> {
    const modal = new ContactModal(this.page);
    await this.contactLink.click();
    await expect(modal.modal).toBeVisible();
    return modal;
  }

  async openAboutModal(): Promise<AboutModal> {
    const modal = new AboutModal(this.page);
    await this.aboutUsLink.click();
    await expect(modal.modal).toBeVisible();
    return modal;
  }

  async openLoginModal(): Promise<LoginModal> {
    const modal = new LoginModal(this.page);
    await this.loginLink.click();
    await expect(modal.modal).toBeVisible();
    return modal;
  }

  async openSignUpModal(): Promise<SignUpModal> {
    const modal = new SignUpModal(this.page);
    await this.signUpLink.click();
    await expect(modal.modal).toBeVisible();
    return modal;
  }

  async goToCart(): Promise<void> {
    await this.cartLink.click();
  }

  async goToHome(): Promise<void> {
    await this.homeLink.click();
  }
}
