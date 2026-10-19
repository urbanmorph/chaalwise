import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The palette is checked, not eyeballed (the rf-website rule). A ratio is
 * arithmetic, so a pair that drops under its threshold fails the build, in
 * both themes. The dark palette is written twice (for the system setting and
 * for a forced theme), so the test also fails if the two copies drift.
 */

const CSS = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** The hex tokens declared directly inside the block opened by `selector`. */
function block(selector: string): Record<string, string> {
  const start = CSS.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`no block for ${selector}`);
  const open = CSS.indexOf('{', start);
  const body = CSS.slice(open + 1, CSS.indexOf('}', open));
  return Object.fromEntries(
    [...body.matchAll(/(--[a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2]!.toLowerCase()]),
  );
}

const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

/** [foreground, background, minimum ratio]. 3:1 is for large text and non-text marks. */
const REQUIRED: [string, string, number][] = [
  ['--ink', '--paper', 7],
  ['--ink', '--card', 7],
  ['--ink-2', '--paper', 4.5],
  ['--ink-2', '--card', 4.5],
  ['--ink-2', '--tint', 4.5],
  ['--link', '--paper', 4.5],
  ['--link', '--card', 4.5],
  ['--accent-text', '--paper', 4.5],
  ['--accent-text', '--card', 4.5],
  ['--on-felt', '--felt', 4.5],
  ['--on-primary', '--primary', 4.5],
  // A filled button must stand out from the page as a shape, not only by its text.
  ['--primary', '--paper', 3],
  ['--on-felt-2', '--felt', 4.5],
  ['--accent', '--felt', 3],
  ['--pass', '--card', 4.5],
  ['--warn', '--card', 4.5],
  ['--fail', '--card', 4.5],
  ['--focus', '--paper', 3],
  ['--focus', '--card', 3],
  ['--rule-strong', '--card', 3],
  // Chart marks are non-text: 3:1 on the card and the page.
  ['--chart-1', '--card', 3],
  ['--chart-1', '--paper', 3],
];

const themes = {
  light: block(':root'),
  dark: block(":root[data-theme='dark']"),
};

describe.each(Object.entries(themes))('the %s palette', (_, tokens) => {
  it.each(REQUIRED)('%s on %s clears %s:1', (fg, bg, min) => {
    expect(tokens[fg], `${fg} is not defined`).toBeDefined();
    expect(tokens[bg], `${bg} is not defined`).toBeDefined();
    expect(contrast(tokens[fg]!, tokens[bg]!)).toBeGreaterThanOrEqual(min);
  });
});

describe('theme wiring', () => {
  it('uses the same dark palette for the system setting and for a forced dark theme', () => {
    expect(block(":root:not([data-theme='light'])")).toEqual(themes.dark);
  });

  it('defines every light token in dark too, so nothing falls back to a light colour', () => {
    expect(Object.keys(themes.dark).sort()).toEqual(Object.keys(themes.light).sort());
  });

  it('tells the browser which scheme each theme is, so form controls and scrollbars follow', () => {
    expect(CSS).toMatch(/:root \{[^}]*color-scheme:\s*light dark/);
    expect(CSS).toMatch(/:root\[data-theme='light'\] \{[^}]*color-scheme:\s*light;/);
    expect(CSS).toMatch(/:root\[data-theme='dark'\] \{[^}]*color-scheme:\s*dark;/);
  });
});
