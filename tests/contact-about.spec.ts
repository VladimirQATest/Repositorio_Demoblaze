import { test, expect } from '../fixtures/testFixtures';
import { HomePage } from '../pages/HomePage';
import { NavBar } from '../pages/components/NavBar';
import { installDialogHandler } from '../utils/dialogs';
import { CONTACT_DETAILS } from '../test-data/users';

/** Contact, About us and responsive checks — knowledge base §6 Flows G & H, §9 scenarios 19-21. */
test.describe('Contact and About', () => {
  test('contact form can be filled and sent', async ({ page }) => {
    const dialogs = installDialogHandler(page);
    const nav = new NavBar(page);
    const home = new HomePage(page);
    await home.open();

    const contactModal = await nav.openContactModal();
    await contactModal.send(CONTACT_DETAILS);

    await dialogs.waitForMessage('Thanks for the message!!');
    // send() hides the modal and reloads the page.
    await expect(contactModal.modal).toBeHidden();
  });

  test('about us modal opens with a video player', async ({ page }) => {
    const nav = new NavBar(page);
    const home = new HomePage(page);
    await home.open();

    const aboutModal = await nav.openAboutModal();
    await expect(aboutModal.modal).toBeVisible();
    await expect(aboutModal.video).toBeVisible();

    await aboutModal.close();
    await expect(aboutModal.modal).toBeHidden();
  });

  test('the hero carousel is hidden on small viewports', async ({ page }) => {
    const home = new HomePage(page);
    // Carousel is hidden by CSS at viewport width <= 800px.
    await page.setViewportSize({ width: 700, height: 800 });
    await home.open();

    await expect(home.heroCarousel).toBeHidden();
    // The category sidebar and product grid remain usable.
    await expect(home.categoriesHeader).toBeVisible();
    await expect(home.productCards.first()).toBeVisible();
  });
});
