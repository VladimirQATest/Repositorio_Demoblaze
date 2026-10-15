import { expect, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { OrderModal } from './components/OrderModal';

/** Cart page (cart.html) — cart table, total, Place Order. */
export class CartPage extends BasePage {
  get cartRows() {
    return this.page.locator('#tbodyid tr.success');
  }

  /** Panel heading with the numeric total. */
  get totalAmount() {
    return this.page.locator('#totalp');
  }

  get placeOrderButton() {
    return this.page.locator('button.btn-success[data-target="#orderModal"]');
  }

  get productsHeading() {
    return this.page.getByRole('heading', { name: 'Products' });
  }

  async open(): Promise<void> {
    await this.page.goto('/cart.html');
    await this.page.locator('#tbodyid').waitFor({ state: 'attached' });
  }

  /** Titles of the products currently in the cart (column 2 of the table). */
  async getRowTitles(): Promise<string[]> {
    const titles = await this.page
      .locator('#tbodyid tr.success td:nth-child(2)')
      .allTextContents();
    return titles.map((title) => title.trim());
  }

  /** Numeric total shown in the panel. */
  async totalValue(): Promise<number> {
    const text = (await this.totalAmount.textContent())?.trim() ?? '';
    expect(text, `empty cart total`).not.toBe('');
    return Number(text);
  }

  /**
   * Deletes the first cart row and waits for the table to re-render.
   * Note: deleteItem() calls location.reload() on success, and the
   * site never reaches "networkidle" (video.js polls the HLS stream),
   * so we wait on the DOM instead.
   */
  async deleteFirstItem(expectedRemainingRows: number): Promise<void> {
    const deleteLink = this.page.locator('#tbodyid tr.success a[onclick^="deleteItem"]').first();
    await deleteLink.click();
    await expect(this.cartRows).toHaveCount(expectedRemainingRows);
  }

  async clickPlaceOrder(): Promise<OrderModal> {
    const modal = new OrderModal(this.page);
    await this.placeOrderButton.click();
    await expect(modal.modal).toBeVisible();
    return modal;
  }
}
