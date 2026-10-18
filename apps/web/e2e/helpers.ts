import { expect, type Page } from '@playwright/test';

export const deploy = async (page: Page, build: 'A' | 'B' | 'T') => {
  const res = await page.request.get(`/__deploy/${build}`);
  expect(res.ok()).toBe(true);
};

/** Wait until the offline worker controls the page and has finished precaching. */
export async function waitForOffline(page: Page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }),
      );
    }
  });
}

const continueButton = (page: Page) => page.getByRole('button', { name: /^(Continue|Finish)$/ });
const next = (page: Page) => continueButton(page).click();

/** After an answer, focus is on Continue, so keyboard users never lose their place. */
const answered = async (page: Page) => {
  await expect(page.getByText('You found it!')).toBeVisible();
  await expect(continueButton(page)).toBeFocused();
  await next(page);
};

const choose = async (page: Page, option: string) => {
  await page.getByRole('button', { name: option, exact: true }).click();
  await answered(page);
};

const typeMove = async (page: Page, move: string) => {
  await page.getByLabel('Or type your move').fill(move);
  await page.getByRole('button', { name: 'Play' }).click();
  await answered(page);
};

/** Plays a lesson through, answering every step correctly first time. */
export async function completeLesson(page: Page, slug: 'board' | 'hanging') {
  await page.goto(`/chess/${slug}/`);
  if (slug === 'board') {
    await choose(page, 'h1, a light square');
    await choose(page, 'd1');
    await typeMove(page, 'e4');
  } else {
    await next(page);
    await typeMove(page, 'Qxd5');
    await typeMove(page, 'dxe5');
    await choose(page, 'Checks, captures and threats');
  }
  await expect(page.getByTestId('lesson-done')).toContainText('Saved on this device');
}

export const lessonsFinished = async (page: Page) => {
  await page.goto('/progress/');
  return page.getByTestId('lessons-finished');
};
