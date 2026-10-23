/**
 * Amounts in lesson text, written the way the reader's locale writes them.
 *
 * Text is written the Indian way: rupee amounts in lakh and crore (₹1.6 lakh),
 * other large numbers grouped in thousands (900,000). A reader in India sees
 * large plain numbers grouped in lakhs (9,00,000); everyone else sees lakh and
 * crore as plain numbers (₹160,000). Amounts stay in rupees: the cases are set
 * in India, and a converted figure would need an exchange rate that goes stale.
 */

const UNITS: Record<string, number> = { lakh: 1e5, crore: 1e7 };
const RUPEES = /₹(\d[\d,]*(?:\.\d+)?)(?: (lakh|crore))?/g;
/** A number grouped with commas, not part of a rupee amount or a decimal. */
const GROUPED = /(?<![₹\d.,])\d{1,3}(?:,\d{2,3})+(?![\d.])/g;
const number = (digits: string) => Number(digits.replaceAll(',', ''));

/** A reader in India, by region, whatever the language: hi, ta-IN and en-IN all are; en and bn-BD are not. */
export function isIndian(locale: string): boolean {
  try {
    return new Intl.Locale(locale).maximize().region === 'IN';
  } catch {
    return false;
  }
}

export const localAmounts = (text: string, locale: string): string =>
  isIndian(locale)
    ? text.replace(GROUPED, (n) => number(n).toLocaleString('en-IN'))
    : text.replace(RUPEES, (all, digits: string, unit?: string) =>
        unit || digits.includes(',')
          ? `₹${Math.round(number(digits) * (unit ? UNITS[unit]! : 1)).toLocaleString('en-US')}`
          : all,
      );

/** The texts a lesson step shows, alone or in a list. */
const TEXTS = ['text', 'prompt', 'explanation', 'hint', 'alongside', 'action', 'options', 'feedback'];
const shown = new WeakMap<object, Record<string, object>>();

/** A step with its amounts in the reader's locale; the same step and locale give the same object, so a shuffle keyed on the step does not run again. */
export function localStep<T extends object>(step: T, locale: string): T {
  const byLocale = shown.get(step) ?? {};
  shown.set(step, byLocale);
  if (!byLocale[locale]) {
    const local = (t: unknown) => (typeof t === 'string' ? localAmounts(t, locale) : t);
    const copy = { ...step } as Record<string, unknown>;
    for (const key of TEXTS)
      if (key in copy) copy[key] = Array.isArray(copy[key]) ? copy[key].map(local) : local(copy[key]);
    byLocale[locale] = copy;
  }
  return byLocale[locale] as T;
}

/** The reader's locale in the browser; the text as written (Indian) while the page is built. */
export const readerLocale = (): string => (typeof navigator === 'undefined' ? 'en-IN' : navigator.language || 'en-IN');
