// backend/src/utils/mongoErrors.ts

/**
 * True for a MongoDB duplicate-key error (code 11000). Pass `field` to make sure it was
 * that index that collided, so e.g. a duplicate _id from two concurrent upserts isn't
 * reported as "username taken".
 */
export const isDuplicateKeyError = (err: unknown, field?: string): boolean => {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { code?: unknown; keyPattern?: unknown; message?: unknown };
  if (e.code !== 11000) return false;
  if (!field) return true;
  if (typeof e.keyPattern === "object" && e.keyPattern !== null) return field in e.keyPattern;
  return typeof e.message === "string" && e.message.includes(field);
};
