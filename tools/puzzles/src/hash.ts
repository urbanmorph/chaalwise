import { createHash } from 'node:crypto';

export const sha256 = (body: Uint8Array) => createHash('sha256').update(body).digest('hex');

/** S3 and R2 report a single-part object's MD5 as its ETag, so uploads are compared by MD5. */
export const md5 = (body: Uint8Array) => createHash('md5').update(body).digest('hex');
