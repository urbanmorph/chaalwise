import { defineProject } from 'vitest/config';

export default defineProject({
  test: { name: 'poker', include: ['test/**/*.test.ts'] },
});
