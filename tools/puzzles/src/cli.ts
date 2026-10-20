// Builds the puzzle chunks from the Lichess puzzle database. See README.md, "Puzzle pipeline".
import { join } from 'node:path';
import { parseArgs, USAGE } from './args.ts';
import { run } from './pipeline.ts';
import { storeFromEnv } from './store.ts';

/** Exit code when the run stopped early with its progress saved: run again to continue. */
const EXIT_PARTIAL = 75;

const say = (line: string) => process.stdout.write(`${line}\n`);

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    say(USAGE);
    return 0;
  }
  const { store, why } = storeFromEnv(process.env, { dryRun: args.dryRun, localDir: join(args.cacheDir, 'r2-local') });

  // First SIGINT or SIGTERM: stop after the current row and save. A second one: leave at once.
  const stop = new AbortController();
  const onSignal = (sig: NodeJS.Signals) => {
    if (stop.signal.aborted) process.exit(130);
    say(`${sig}: stopping and saving progress (send again to quit at once).`);
    stop.abort(sig);
  };
  process.on('SIGINT', onSignal).on('SIGTERM', onSignal);
  // A backstop for a stalled network, when no rows arrive to check the time limit against.
  const signal = AbortSignal.any([stop.signal, AbortSignal.timeout(args.timeLimitMs + 60_000)]);

  say(`Source ${args.url}`);
  say(`Durable store: ${store.name} (${why}). Cache ${args.cacheDir}.`);
  say(`Time limit ${args.timeLimitMs / 1000}s; checkpoint every ${args.checkpointEveryMs / 1000}s.`);
  const result = await run({ ...args, store, signal });
  return result.status === 'done' ? 0 : EXIT_PARTIAL;
}

main().then(
  (code) => process.exit(code),
  (e: unknown) => {
    process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(1);
  },
);
