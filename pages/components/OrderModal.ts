import { Page } from '@playwright/test';

export interface OrderDetails {
  name: string;
  country: string;
  city: string;
  card: string;
  month: string;
  year: string;
}

/** "Place order" modal (#orderModal) — only present on cart.html. */
export class OrderModal {
  constructor(readonly page: Page) {}

  get modal() {
    return this.page.locator('#orderModal');
  }

  /** Read-only label: "Total: <n>" (filled when the modal opens). */
  get totalLabel() {
    return this.page.locator('#totalm');
  }

  get nameInput() {
    return this.page.locator('#orderModal #name');
  }

  get countryInput() {
    return this.page.locator('#orderModal #country');
  }

  get cityInput() {
    return this.page.locator('#orderModal #city');
  }

  get cardInput() {
    return this.page.locator('#orderModal #card');
  }

  get monthInput() {
    return this.page.locator('#orderModal #month');
  }

  get yearInput() {
    return this.page.locator('#orderModal #year');
  }

  get purchaseButton() {
    return this.page.locator('#orderModal .modal-footer button.btn-primary');
  }

  get closeButton() {
    return this.page.locator('#orderModal .modal-header .close');
  }

  async placeOrder(details: OrderDetails): Promise<void> {
    await this.nameInput.fill(details.name);
    await this.countryInput.fill(details.country);
    await this.cityInput.fill(details.city);
    await this.cardInput.fill(details.card);
    await this.monthInput.fill(details.month);
    await this.yearInput.fill(details.year);
    await this.purchaseButton.click();
  }
}
