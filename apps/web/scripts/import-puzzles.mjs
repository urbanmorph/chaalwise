// Copies the puzzle pipeline's chunks (tools/puzzles) into the site, named by theme and band.
// Vite gives each file a content hash when it is built. Usage: node scripts/import-puzzles.mjs <pipeline out/puzzles dir>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const from = process.argv[2];
if (!from) throw new Error('Give the pipeline output folder, such as tools/puzzles/.cache/out/puzzles');
const to = new URL('../src/data/puzzles/', import.meta.url).pathname;
const manifest = JSON.parse(readFileSync(join(from, 'manifest.json'), 'utf8'));
for (const chunk of manifest.chunks) {
  const name = `${chunk.theme}-${chunk.min}-${chunk.max}.json`;
  writeFileSync(join(to, name), readFileSync(join(from, chunk.file)));
  chunk.file = name;
}
writeFileSync(join(to, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Copied ${manifest.chunks.length} chunks to ${to}`);
