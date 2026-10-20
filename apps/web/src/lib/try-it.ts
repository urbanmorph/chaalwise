import type { GradedStep } from '@chaalwise/core/lesson';
import { mount } from 'svelte';
import TryRound from '../components/TryRound.svelte';

/** Swap a reference entry's drawn question for the live board, loaded only when asked for. */
export function mountTry(target: HTMLElement, entry: string, steps: GradedStep[], measures: string | undefined): void {
  target.replaceChildren();
  mount(TryRound, { target, props: { entry, steps, measures } });
}
