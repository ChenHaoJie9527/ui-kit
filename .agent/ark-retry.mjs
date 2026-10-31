export function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function isRetryableArkError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /ECONNRESET|ETIMEDOUT|EPIPE|socket hang up|connection timed out|terminated|other side closed|Ark API error (?:429|5\d\d)|Ark returned empty content/i.test(
    message,
  );
}

export function getArkRetryDelay(attempt) {
  return Math.min(30_000, 2_000 * 2 ** (attempt - 1));
}
