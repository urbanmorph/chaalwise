// Renders the PNG app icons from public/favicon.svg, so they never drift from it.
// Usage: node scripts/icons.mjs   (then commit the PNGs in public/)
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pub = (file) => fileURLToPath(new URL(`../public/${file}`, import.meta.url));
const svg = readFileSync(pub('favicon.svg'), 'utf8');
// Full-bleed for icons the platform rounds itself (iOS, Android's maskable): square corners, same artwork.
const square = svg.replace(/ rx="\d+"/, '');

const ICONS = [
  { file: 'icon-192.png', size: 192, svg },
  { file: 'icon-512.png', size: 512, svg },
  { file: 'icon-maskable-512.png', size: 512, svg: square },
  { file: 'apple-touch-icon.png', size: 180, svg: square },
];

const browser = await chromium.launch();
for (const icon of ICONS) {
  const page = await browser.newPage({ viewport: { width: icon.size, height: icon.size } });
  await page.setContent(
    `<body style="margin:0">${icon.svg.replace('<svg ', `<svg width="${icon.size}" height="${icon.size}" `)}</body>`,
  );
  await page.locator('svg').screenshot({ path: pub(icon.file), omitBackground: true });
  await page.close();
  console.log(`${icon.file} ${icon.size}x${icon.size}`);
}
await browser.close();
