/// <reference lib="webworker" />
import { playTurn } from '@chaalwise/teach/play';
import type { CoachRequest } from '../lib/coach';

/** The teaching helpers, off the main thread so the board never waits on them. */
self.onmessage = ({ data }: MessageEvent<CoachRequest>) => {
  try {
    self.postMessage({ id: data.id, result: playTurn(data.fen, data.uci, data.movesLeft) });
  } catch (error) {
    self.postMessage({ id: data.id, error: String(error) });
  }
};
