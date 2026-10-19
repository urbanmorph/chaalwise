import { defineProject } from 'vitest/config';

export default defineProject({
  test: { name: 'teach', include: ['test/**/*.test.ts'] },
});
