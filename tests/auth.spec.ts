import { test, expect } from '../fixtures/testFixtures';
import { HomePage } from '../pages/HomePage';
import { NavBar } from '../pages/components/NavBar';
import { installDialogHandler } from '../utils/dialogs';
import { DEFAULT_PASSWORD } from '../fixtures/testFixtures';

/** Authentication flows — knowledge base §6 Flows D & E, §9 scenarios 6-12. */
test.describe('Authentication', () => {
  test('sign up a new user shows the success alert', async ({
    page,
    uniqueUsername,
  }) => {
    const dialogs = installDialogHandler(page);
    const nav = new NavBar(page);
    const home = new HomePage(page);
    await home.open();

    const signUpModal = await nav.openSignUpModal();
    await signUpModal.signUp(uniqueUsername, DEFAULT_PASSWORD);

    await dialogs.waitForMessage('Sign up successful.');
  });

  test('sign up an existing user shows "This user already exist."', async ({
    page,
    api,
    uniqueUsername,
  }) => {
    await api.signUp(uniqueUsername, DEFAULT_PASSWORD);

    const dialogs = installDialogHandler(page);
    const nav = new NavBar(page);
    const home = new HomePage(page);
    await home.open();

    const signUpModal = await nav.openSignUpModal();
    await signUpModal.signUp(uniqueUsername, DEFAULT_PASSWORD);

    await dialogs.waitForMessage('This user already exist.');
    await expect(signUpModal.modal).toBeVisible();
  });

  test('sign up with empty fields shows the validation alert', async ({ page }) => {
    const dialogs = installDialogHandler(page);
    const nav = new NavBar(page);
    const home = new HomePage(page);
    await home.open();

    const signUpModal = await nav.openSignUpModal();
    await signUpModal.signUp('', '');

    await dialogs.waitForMessage('Please fill out Username and Password.');
  });

  test('login with valid credentials shows the welcome user', async ({
    page,
    api,
    uniqueUsername,
  }) => {
    await api.signUp(uniqueUsername, DEFAULT_PASSWORD);

    const nav = new NavBar(page);
    const home = new HomePage(page);
    await home.open();

    const loginModal = await nav.openLoginModal();
    await loginModal.login(uniqueUsername, DEFAULT_PASSWORD);

    // Successful login reloads the page; retry until the new nav state appears.
    await expect(nav.welcomeUser).toBeVisible();
    await expect(nav.welcomeUser).toHaveText(`Welcome ${uniqueUsername}`);
    await expect(nav.loginLink).toBeHidden();
    await expect(nav.signUpLink).toBeHidden();
    await expect(nav.logoutLink).toBeVisible();
  });

  test('login with a wrong password shows "Wrong password."', async ({
    page,
    api,
    uniqueUsername,
  }) => {
    await api.signUp(uniqueUsername, DEFAULT_PASSWORD);

    const dialogs = installDialogHandler(page);
    const nav = new NavBar(page);
    const home = new HomePage(page);
    await home.open();

    const loginModal = await nav.openLoginModal();
    await loginModal.login(uniqueUsername, 'WrongPass1!');

    await dialogs.waitForMessage('Wrong password.');
    await expect(loginModal.modal).toBeVisible();
  });

  test('login with a non-existent user shows "User does not exist."', async ({
    page,
  }) => {
    const dialogs = installDialogHandler(page);
    const nav = new NavBar(page);
    const home = new HomePage(page);
    await home.open();

    const loginModal = await nav.openLoginModal();
    await loginModal.login(`ghost_${Date.now()}`, DEFAULT_PASSWORD);

    await dialogs.waitForMessage('User does not exist.');
    await expect(loginModal.modal).toBeVisible();
  });

  test('login with empty fields shows the validation alert', async ({ page }) => {
    const dialogs = installDialogHandler(page);
    const nav = new NavBar(page);
    const home = new HomePage(page);
    await home.open();

    const loginModal = await nav.openLoginModal();
    await loginModal.login('', '');

    await dialogs.waitForMessage('Please fill out Username and Password.');
  });

  test('logout returns the navigation to the anonymous state', async ({
    page,
    api,
    uniqueUsername,
  }) => {
    await api.signUp(uniqueUsername, DEFAULT_PASSWORD);

    const nav = new NavBar(page);
    const home = new HomePage(page);
    await home.open();

    const loginModal = await nav.openLoginModal();
    await loginModal.login(uniqueUsername, DEFAULT_PASSWORD);
    await expect(nav.welcomeUser).toBeVisible();

    await nav.logoutLink.click();

    // Logout redirects to index.html and clears the token cookie.
    await expect(nav.loginLink).toBeVisible();
    await expect(nav.signUpLink).toBeVisible();
    await expect(nav.welcomeUser).toBeHidden();
    await expect(nav.logoutLink).toBeHidden();
  });
});
