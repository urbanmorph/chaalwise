// Deploys apps/web/dist with the UrbanMorph Cloudflare account from .env, never
// the ambient Wrangler login. Usage: node scripts/deploy.mjs [--dry-run] [--tombstone]
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const KEYS = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN'];

// Read .env ourselves: process.loadEnvFile would let a token already in the shell win.
const file = existsSync('.env') ? parseEnv(readFileSync('.env', 'utf8')) : {};
const missing = KEYS.filter((k) => !file[k]?.trim());
if (missing.length) {
  console.error(
    `Not deploying: ${missing.join(' and ')} must be set in .env (UrbanMorph account).`,
  );
  process.exit(1);
}

// A tombstone removes the offline cache for every learner: never deploy one by accident.
// The normal worker starts with its precache list; the tombstone does not.
const args = process.argv.slice(2);
const worker = readFileSync('apps/web/dist/sw.js', 'utf8');
if (!worker.startsWith('self.__PRECACHE__=') && !args.includes('--tombstone')) {
  console.error('Not deploying: the build is a tombstone. Pass --tombstone if that is intended.');
  process.exit(1);
}

const env = { ...process.env };
for (const k of KEYS) env[k] = file[k].trim();
const result = spawnSync(
  'pnpm',
  ['exec', 'wrangler', 'deploy', ...args.filter((a) => a !== '--tombstone')],
  {
    cwd: 'apps/web',
    env,
    stdio: 'inherit',
  },
);
process.exit(result.status ?? 1);
