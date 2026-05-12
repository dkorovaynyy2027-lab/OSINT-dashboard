/**
 * Token-bucket rate limiter. Sync `tryRemove` returns false when empty;
 * async `take` returns a promise that resolves once a token is available.
 */
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly capacity: number,
    private readonly refillPerSecond: number,
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSec = (now - this.lastRefill) / 1000;
    if (elapsedSec <= 0) return;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillPerSecond);
    this.lastRefill = now;
  }

  tryRemove(count = 1): boolean {
    this.refill();
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }

  async take(count = 1): Promise<void> {
    while (!this.tryRemove(count)) {
      const deficit = count - this.tokens;
      const waitMs = Math.max(50, Math.ceil((deficit / this.refillPerSecond) * 1000));
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  available(): number {
    this.refill();
    return this.tokens;
  }
}
