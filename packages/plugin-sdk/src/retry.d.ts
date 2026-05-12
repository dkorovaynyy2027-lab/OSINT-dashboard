export interface RetryOptions {
    retries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    factor: number;
    jitter?: boolean;
}
export declare function withRetry<T>(fn: (attempt: number) => Promise<T>, opts?: Partial<RetryOptions>): Promise<T>;
