import { describe, expect, it } from 'vitest';
import { isIndian, localAmounts, localStep } from '../src/lib/money';

describe('amounts in the reader’s locale', () => {
  it('knows an Indian reader by region, whatever the language', () => {
    for (const l of ['en-IN', 'hi', 'hi-IN', 'ta-IN', 'bn-IN']) expect(isIndian(l)).toBe(true);
    for (const l of ['en', 'en-US', 'en-GB', 'de-DE', 'bn-BD', 'not a locale']) expect(isIndian(l)).toBe(false);
  });

  it('leaves the text as written for a reader in India, lakh and all', () => {
    const text = 'Eight weeks would need ₹1.6 lakh, more than the ₹1 lakh bonus. Nine weeks would need ₹80,000.';
    expect(localAmounts(text, 'en-IN')).toBe(text);
  });

  it('groups large plain numbers the Indian way in India', () => {
    expect(localAmounts('A job offer of 900,000 a year, or 1,000,000 next week; a printer at 8,000.', 'en-IN')).toBe(
      'A job offer of 9,00,000 a year, or 10,00,000 next week; a printer at 8,000.',
    );
  });

  it('writes lakh and crore as plain numbers elsewhere, still in rupees', () => {
    expect(localAmounts('Eight weeks would need ₹1.6 lakh, more than the ₹1 lakh bonus.', 'en-US')).toBe(
      'Eight weeks would need ₹160,000, more than the ₹100,000 bonus.',
    );
    expect(localAmounts('A ₹2 crore deal and ₹14 lakh a year.', 'en-GB')).toBe(
      'A ₹20,000,000 deal and ₹1,400,000 a year.',
    );
    expect(localAmounts('Beans at ₹820 a kilo, ₹4,000 a month.', 'en-US')).toBe(
      'Beans at ₹820 a kilo, ₹4,000 a month.',
    );
  });

  it('touches nothing else: points, decimals, years and small numbers', () => {
    const text = 'In 1902, 300 points down; 0.25 × 40 − 0.75 × 10 = 2.5; 1 in 3 of 600.';
    expect(localAmounts(text, 'en-IN')).toBe(text);
    expect(localAmounts(text, 'en-US')).toBe(text);
  });

  it('localises every text a step shows, and gives the same object for the same step and locale', () => {
    const step = {
      kind: 'choice',
      id: 'q',
      prompt: 'Your budget is ₹18 lakh.',
      options: ['₹14 lakh', '₹16 lakh'],
      feedback: ['', 'Too high for ₹1 lakh less.'],
      answer: 0,
      explanation: 'Settle ₹17 lakh first.',
      hint: 'Think of ₹1 lakh.',
      alongside: 'A salary of ₹16 lakh.',
    } as const;
    const shown = localStep(step, 'en-US') as typeof step;
    expect(shown.prompt).toBe('Your budget is ₹1,800,000.');
    expect(shown.options).toEqual(['₹1,400,000', '₹1,600,000']);
    expect(shown.feedback).toEqual(['', 'Too high for ₹100,000 less.']);
    expect([shown.explanation, shown.hint, shown.alongside]).toEqual([
      'Settle ₹1,700,000 first.',
      'Think of ₹100,000.',
      'A salary of ₹1,600,000.',
    ]);
    expect(shown.answer).toBe(0);
    expect(localStep(step, 'en-US')).toBe(shown);
    expect(localStep(step, 'en-IN')).toEqual(step);
  });
});
