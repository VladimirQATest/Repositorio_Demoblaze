import { expect, Page } from '@playwright/test';

export interface DialogHandler {
  /** Every alert()/confirm() message captured so far, in order. */
  messages: string[];
  /**
   * Waits until an alert with the exact expected message was shown (and accepted).
   * Accepts a single message or a list of accepted variants (the app uses
   * slightly different messages for the same action, e.g. "Product added."
   * for logged-in users vs "Product added" for anonymous users).
   */
  waitForMessage(message: string | string[], timeout?: number): Promise<void>;
  /** Most recent alert message (empty string if none). */
  lastMessage(): string;
}

/**
 * Installs a global dialog handler on the page.
 *
 * IMPORTANT: DemoBlaze gives almost all feedback through JavaScript `alert()`
 * dialogs. An unhandled dialog blocks page JS, so any test that triggers an
 * action which alerts MUST install this handler first (or the test hangs).
 */
export function installDialogHandler(page: Page): DialogHandler {
  const messages: string[] = [];

  page.on('dialog', async (dialog) => {
    messages.push(dialog.message());
    // Guard against races with Playwright's own dialog handling
    // (e.g. a dialog shown while the test is timing out).
    try {
      await dialog.accept();
    } catch {
      /* already handled */
    }
  });

  return {
    messages,
    async waitForMessage(message: string | string[], timeout = 10_000) {
      const expected = Array.isArray(message) ? message : [message];
      await expect
        .poll(() => expected.some((m) => messages.includes(m)), {
          message: `waiting for alert "${expected.join('" or "')}"`,
          timeout,
        })
        .toBe(true);
    },
    lastMessage(): string {
      return messages[messages.length - 1] ?? '';
    },
  };
}
