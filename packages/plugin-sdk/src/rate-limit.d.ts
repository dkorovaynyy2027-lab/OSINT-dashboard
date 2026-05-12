/**
 * Token-bucket rate limiter. Sync `tryRemove` returns false when empty;
 * async `take` returns a promise that resolves once a token is available.
 */
export declare class TokenBucket {
    private readonly capacity;
    private readonly refillPerSecond;
    private tokens;
    private lastRefill;
    constructor(capacity: number, refillPerSecond: number);
    private refill;
    tryRemove(count?: number): boolean;
    take(count?: number): Promise<void>;
    available(): number;
}
