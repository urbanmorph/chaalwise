import { describe, expect, it } from 'vitest';
import { parseArgs, parseDuration } from '../src/args.ts';
import { SOURCE_URL } from '../src/config.ts';

describe('parseDuration', () => {
  it('reads seconds, minutes and hours', () => {
    expect(parseDuration('90')).toBe(90_000);
    expect(parseDuration('90s')).toBe(90_000);
    expect(parseDuration('2m')).toBe(120_000);
    expect(parseDuration('5.5h')).toBe(19_800_000);
  });

  it('refuses anything else', () => {
    expect(() => parseDuration('soon')).toThrow(/duration/);
    expect(() => parseDuration('0')).toThrow(/duration/);
  });
});

describe('parseArgs', () => {
  it('defaults to a time limit inside a 6-hour GitHub Actions job and a 10-minute checkpoint', () => {
    const a = parseArgs([]);
    expect(a).toMatchObject({ dryRun: false, url: SOURCE_URL, checkpointEveryMs: 600_000 });
    expect(a.timeLimitMs).toBeLessThan(6 * 3600_000);
    expect(a.cacheDir).toMatch(/tools[/\\]puzzles[/\\]\.cache$/);
  });

  it('reads every option', () => {
    expect(
      parseArgs([
        '--dry-run',
        '--time-limit',
        '2m',
        '--checkpoint-every=30s',
        '--cache-dir',
        '/tmp/x',
        '--url',
        'http://x/y',
      ]),
    ).toEqual({
      dryRun: true,
      timeLimitMs: 120_000,
      checkpointEveryMs: 30_000,
      cacheDir: '/tmp/x',
      url: 'http://x/y',
      help: false,
    });
  });

  it('refuses unknown options', () => {
    expect(() => parseArgs(['--upload-everything'])).toThrow(/--upload-everything/);
  });
});
