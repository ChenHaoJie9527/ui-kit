import assert from "node:assert/strict";
import test from "node:test";
import {
  getArkRetryDelay,
  isRetryableArkError,
  positiveInteger,
} from "../ark-retry.mjs";

test("recognizes transient Ark and network failures", () => {
  for (const message of [
    "connect ETIMEDOUT 101.126.13.31:443",
    "read ECONNRESET",
    "Ark connection timed out after 45000ms.",
    "Ark API error 429: rate limited",
    "Ark API error 503: unavailable",
    "Ark returned empty content.",
  ]) {
    assert.equal(isRetryableArkError(new Error(message)), true, message);
  }

  assert.equal(
    isRetryableArkError(new Error("Ark API error 400: bad request")),
    false,
  );
});

test("backs off exponentially up to thirty seconds", () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6].map(getArkRetryDelay),
    [2_000, 4_000, 8_000, 16_000, 30_000, 30_000],
  );
});

test("uses positive integer environment overrides only", () => {
  assert.equal(positiveInteger("5", 2), 5);
  assert.equal(positiveInteger("0", 2), 2);
  assert.equal(positiveInteger("-1", 2), 2);
  assert.equal(positiveInteger("invalid", 2), 2);
});
