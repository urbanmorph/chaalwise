import { defineProject } from 'vitest/config';

export default defineProject({
  test: { name: 'puzzles', include: ['test/**/*.test.ts'] },
});
