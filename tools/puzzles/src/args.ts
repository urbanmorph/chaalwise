import { fileURLToPath } from 'node:url';
import { parseArgs as parse } from 'node:util';
import { SOURCE_URL } from './config.ts';

export const USAGE = `Usage: pnpm --filter @chaalwise/puzzles puzzles [options]

  --dry-run               Keep everything local, even if R2_* variables are set
  --time-limit <d>        Stop cleanly after this long (default 5h; a GitHub Actions job allows 6h)
  --checkpoint-every <d>  Save progress locally and durably this often (default 10m)
  --cache-dir <path>      Working directory (default tools/puzzles/.cache)
  --url <url>             Source file (default the Lichess puzzle database)

Durations: 90, 90s, 2m, 5h. Uploads to R2 only when R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
R2_SECRET_ACCESS_KEY and R2_BUCKET are all set.`;

export function parseDuration(text: string): number {
  const m = /^(\d+(?:\.\d+)?)(s|m|h)?$/.exec(text.trim());
  const ms = m ? Number(m[1]) * { s: 1000, m: 60_000, h: 3600_000 }[(m[2] ?? 's') as 's' | 'm' | 'h'] : NaN;
  if (!(ms > 0)) throw new Error(`Not a duration: "${text}" (try 90s, 2m or 5h)`);
  return ms;
}

export function parseArgs(argv: string[]) {
  const { values } = parse({
    args: argv,
    strict: true,
    options: {
      'dry-run': { type: 'boolean', default: false },
      'time-limit': { type: 'string', default: '5h' },
      'checkpoint-every': { type: 'string', default: '10m' },
      'cache-dir': { type: 'string', default: fileURLToPath(new URL('../.cache', import.meta.url)) },
      url: { type: 'string', default: SOURCE_URL },
      help: { type: 'boolean', default: false },
    },
  });
  return {
    dryRun: values['dry-run'],
    timeLimitMs: parseDuration(values['time-limit']),
    checkpointEveryMs: parseDuration(values['checkpoint-every']),
    cacheDir: values['cache-dir'],
    url: values.url,
    help: values.help,
  };
}
