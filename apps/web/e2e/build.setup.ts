import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';

/**
 * Three real builds: version A, version B (a later deploy), and T (the
 * tombstone). Tests switch between them to simulate deploys.
 */
export const BUILDS = new URL('./.builds/', import.meta.url).pathname;

export default function buildAll() {
  rmSync(BUILDS, { recursive: true, force: true });
  const builds = [
    ['A', {}],
    ['B', {}],
    ['T', { SW_TOMBSTONE: '1' }],
  ] as const;
  for (const [name, env] of builds) {
    execFileSync('pnpm', ['exec', 'astro', 'build', '--outDir', `${BUILDS}${name}`], {
      cwd: new URL('..', import.meta.url).pathname,
      env: { ...process.env, ...env, BUILD_ID: name },
      stdio: 'inherit',
    });
  }
}
