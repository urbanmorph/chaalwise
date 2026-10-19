import type { PlyReport } from '@chaalwise/teach/analyse';
import type { Turn } from '@chaalwise/teach/play';

export type CoachRequest = { id: number } & (
  { type: 'turn'; fen: string; uci: string; movesLeft: number } | { type: 'analyse'; fen: string; moves: string[] }
);

type Pending = { resolve: (value: never) => void; reject: (error: Error) => void };

let worker: Worker | undefined;
let nextId = 0;
const pending = new Map<number, Pending>();

/** Settle every waiting request with an error and start a fresh worker next time. */
function fail(reason: string) {
  for (const request of pending.values()) request.reject(new Error(reason));
  pending.clear();
  worker?.terminate();
  worker = undefined;
}

/** One shared worker, started on first use. */
function coachWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/coach.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }: MessageEvent<{ id: number; result?: never; error?: string }>) => {
      const request = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) request?.reject(new Error(data.error));
      else request?.resolve(data.result as never);
    };
    // A worker that fails to load (say, an old tab after a deploy) must not leave the board waiting forever.
    worker.onerror = (event) => fail(`The coach could not start: ${event.message}`);
    worker.onmessageerror = () => fail('The coach sent a message that could not be read.');
  }
  return worker;
}

/** Long enough for a slow phone, short enough that a stuck worker is noticed. */
const TIMEOUT = 15_000;

type Distribute<T> = T extends unknown ? Omit<T, 'id'> : never;

function ask<T>(request: Distribute<CoachRequest>): Promise<T> {
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => fail('The coach took too long to answer.'), TIMEOUT);
    const done =
      <A extends unknown[]>(settle: (...args: A) => void) =>
      (...args: A) => {
        clearTimeout(timer);
        settle(...args);
      };
    pending.set(id, { resolve: done(resolve as (value: never) => void), reject: done(reject) });
    coachWorker().postMessage({ ...request, id });
  });
}

/** The learner's move in a play-out, the computer's reply and any nudge, worked out in the background. */
export const playTurnInBackground = (fen: string, uci: string, movesLeft: number) =>
  ask<Turn>({ type: 'turn', fen, uci, movesLeft });

/** The teaching helpers over a whole game, in the background (for post-game review). */
export const analyseInBackground = (fen: string, moves: string[]) => ask<PlyReport[]>({ type: 'analyse', fen, moves });
