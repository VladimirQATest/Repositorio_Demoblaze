import { Page } from '@playwright/test';

/** Base class for all page objects. */
export abstract class BasePage {
  constructor(readonly page: Page) {}
}
