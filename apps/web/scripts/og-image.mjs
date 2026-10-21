/**
 * Draws the share card link previews show (public/og.png, 1200 by 630): the
 * headline, the mark and the home page's knight fork, on the felt. Run after a
 * build, since it takes the diagram from dist/index.html:
 *
 *   pnpm build && node scripts/og-image.mjs && pnpm build
 */
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const diagram = read('../dist/index.html').match(/<svg class="diagram"[\s\S]*?<\/svg>/)?.[0];
if (!diagram) throw new Error('No diagram in dist/index.html: run `pnpm build` first.');
const mark = read('../public/favicon.svg').replace('<svg ', '<svg class="mark" ');

const html = `<!doctype html>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1200px; height: 630px; padding: 72px 80px;
    display: grid; grid-template-columns: 1fr 400px; gap: 64px; align-items: center;
    background: #164a39; color: #fff;
    font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }
  .brand { display: flex; align-items: center; gap: 16px; font-size: 44px; font-weight: 700; line-height: 1; letter-spacing: -0.02em; }
  .brand span { color: #e8a13c; }
  .mark { width: 56px; height: 56px; border-radius: 12px; box-shadow: 0 0 0 2px rgb(255 255 255 / 0.25); }
  h1 { margin-top: 56px; font-size: 92px; line-height: 0.98; letter-spacing: -0.04em; font-weight: 800; }
  p { margin-top: 28px; font-size: 30px; line-height: 1.35; color: #d3e0d8; }
  .url { margin-top: 40px; font-size: 26px; font-weight: 700; color: #e8a13c; }
  .board svg { display: block; width: 400px; height: 400px; border-radius: 10px; box-shadow: 0 18px 48px rgb(0 0 0 / 0.35); }
  .light { fill: #e7ecde; } .dark { fill: #7e9c86; }
  .arrow { fill: none; stroke: #164a39; stroke-width: 0.15; stroke-linejoin: round; stroke-linecap: round; }
  .head { fill: #164a39; } .ring { fill: none; stroke: #e8a13c; stroke-width: 0.08; }
</style>
<div>
  <div class="brand">${mark}<div>chaal<span>wise</span></div></div>
  <h1>Think a move ahead.</h1>
  <p>Free, short lessons in strategy, shown in chess and poker, for work and study.</p>
  <div class="url">chaalwise.com</div>
</div>
<div class="board">${diagram}</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: new URL('../public/og.png', import.meta.url).pathname });
await browser.close();
console.log('Wrote public/og.png');
