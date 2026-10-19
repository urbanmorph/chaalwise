/// <reference lib="webworker" />
import { analyseGame } from '@chaalwise/teach/analyse';
import { playTurn } from '@chaalwise/teach/play';
import type { CoachRequest } from '../lib/coach';

/** The teaching helpers, off the main thread so the board never waits on them. */
self.onmessage = ({ data }: MessageEvent<CoachRequest>) => {
  try {
    const result =
      data.type === 'turn' ? playTurn(data.fen, data.uci, data.movesLeft) : analyseGame(data.fen, data.moves);
    self.postMessage({ id: data.id, result });
  } catch (error) {
    self.postMessage({ id: data.id, error: String(error) });
  }
};
