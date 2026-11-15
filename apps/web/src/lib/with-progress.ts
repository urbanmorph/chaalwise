import { openProgress, type ProgressStore } from '@chaalwise/core/progress';

/** Open the progress kept on this device, use it, and close it again, even if the use fails. */
export async function withProgress<T>(use: (progress: ProgressStore) => Promise<T>): Promise<T> {
  const progress = await openProgress();
  try {
    return await use(progress);
  } finally {
    progress.close();
  }
}
