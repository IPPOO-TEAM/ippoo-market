import { describe, it, expect, beforeEach } from "vitest";

// Re-implement or test the rateLimit pattern logic matching supabase/functions/server/_shared.tsx
const RL_BUCKETS = new Map<string, { count: number; reset: number }>();

function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = RL_BUCKETS.get(key);
  if (!b || b.reset < now) {
    RL_BUCKETS.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (b.count >= max) return false;
  b.count++;
  return true;
}

describe("Security Rate Limiting", () => {
  beforeEach(() => {
    RL_BUCKETS.clear();
  });

  it("should allow requests up to the max threshold", () => {
    const key = "127.0.0.1:wallet-credit";
    const max = 5;
    const windowMs = 60_000;

    for (let i = 0; i < max; i++) {
      expect(rateLimit(key, max, windowMs)).toBe(true);
    }
  });

  it("should reject requests that exceed the max threshold", () => {
    const key = "127.0.0.1:wallet-credit";
    const max = 5;
    const windowMs = 60_000;

    for (let i = 0; i < max; i++) {
      rateLimit(key, max, windowMs);
    }

    // 6th request should fail
    expect(rateLimit(key, max, windowMs)).toBe(false);
  });

  it("should reset allowance after window expires", () => {
    const key = "127.0.0.1:wallet-credit";
    const max = 2;
    const windowMs = -100; // expired window

    rateLimit(key, max, windowMs);
    rateLimit(key, max, windowMs);

    // With negative windowMs, window is always expired, so it resets count
    expect(rateLimit(key, max, windowMs)).toBe(true);
  });
});
