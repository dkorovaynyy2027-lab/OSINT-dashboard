"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenBucket = void 0;
/**
 * Token-bucket rate limiter. Sync `tryRemove` returns false when empty;
 * async `take` returns a promise that resolves once a token is available.
 */
class TokenBucket {
    capacity;
    refillPerSecond;
    tokens;
    lastRefill;
    constructor(capacity, refillPerSecond) {
        this.capacity = capacity;
        this.refillPerSecond = refillPerSecond;
        this.tokens = capacity;
        this.lastRefill = Date.now();
    }
    refill() {
        const now = Date.now();
        const elapsedSec = (now - this.lastRefill) / 1000;
        if (elapsedSec <= 0)
            return;
        this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillPerSecond);
        this.lastRefill = now;
    }
    tryRemove(count = 1) {
        this.refill();
        if (this.tokens >= count) {
            this.tokens -= count;
            return true;
        }
        return false;
    }
    async take(count = 1) {
        while (!this.tryRemove(count)) {
            const deficit = count - this.tokens;
            const waitMs = Math.max(50, Math.ceil((deficit / this.refillPerSecond) * 1000));
            await new Promise((r) => setTimeout(r, waitMs));
        }
    }
    available() {
        this.refill();
        return this.tokens;
    }
}
exports.TokenBucket = TokenBucket;
