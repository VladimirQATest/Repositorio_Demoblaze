import { test as baseTest, expect, Page } from '@playwright/test';
import { DemoBlazeAPI } from '../utils/api';

/** Default password used for dynamically created test users. */
export const DEFAULT_PASSWORD = 'TestPass123!';

export interface AuthenticatedContext {
  page: Page;
  username: string;
  password: string;
}

type DemoBlazeFixtures = {
  /** Typed client for https://api.demoblaze.com (setup/teardown + assertions). */
  api: DemoBlazeAPI;
  /** Unique username for this test run (avoids "This user already exist."). */
  uniqueUsername: string;
  /**
   * A fresh browser context with a logged-in session (tokenp_ cookie).
   * The user is created via the API before the test and the context is
   * closed afterwards.
   */
  authenticatedPage: AuthenticatedContext;
};

export const test = baseTest.extend<DemoBlazeFixtures>({
  api: async ({ request }, use) => {
    await use(new DemoBlazeAPI(request));
  },

  uniqueUsername: async ({}, use) => {
    const username = `qa_user_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    await use(username);
  },

  authenticatedPage: async ({ browser, api, uniqueUsername }, use) => {
    const username = uniqueUsername;
    const password = DEFAULT_PASSWORD;

    // Create the user and obtain an auth token through the API (fast, no UI).
    await api.signUp(username, password);
    const token = await api.login(username, password);

    const context = await browser.newContext();
    await context.addCookies([
      { name: 'tokenp_', value: token, domain: 'demoblaze.com', path: '/' },
    ]);
    const page = await context.newPage();

    try {
      await use({ page, username, password });
    } finally {
      await context.close();
    }
  },
});

export { expect };
