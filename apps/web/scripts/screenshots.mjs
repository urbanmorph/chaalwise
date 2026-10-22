// Takes the screenshots the install dialog shows (manifest.webmanifest): the home page on a phone and on a desktop.
// Usage: node scripts/screenshots.mjs [site]   (default https://chaalwise.com; then commit the files in public/screenshots/)
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const site = process.argv[2] ?? 'https://chaalwise.com';
const SHOTS = [
  { file: 'home-narrow.webp', width: 412, height: 915, scale: 2 },
  { file: 'home-wide.webp', width: 1280, height: 800, scale: 1 },
];

const browser = await chromium.launch();
for (const shot of SHOTS) {
  const page = await browser.newPage({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: shot.scale,
    colorScheme: 'light',
  });
  await page.goto(site, { waitUntil: 'networkidle' });
  const png = (await page.screenshot()).toString('base64');
  // Playwright writes PNG or JPEG only; the browser's own encoder makes the much smaller WebP.
  const webp = await page.evaluate(async (src) => {
    const image = new Image();
    image.src = src;
    await image.decode();
    const canvas = Object.assign(document.createElement('canvas'), { width: image.width, height: image.height });
    canvas.getContext('2d').drawImage(image, 0, 0);
    return canvas.toDataURL('image/webp', 0.85).split(',')[1];
  }, `data:image/png;base64,${png}`);
  const out = Buffer.from(webp, 'base64');
  writeFileSync(fileURLToPath(new URL(`../public/screenshots/${shot.file}`, import.meta.url)), out);
  await page.close();
  console.log(
    `${shot.file} ${shot.width * shot.scale}x${shot.height * shot.scale} ${(out.length / 1000).toFixed(0)} KB`,
  );
}
await browser.close();
