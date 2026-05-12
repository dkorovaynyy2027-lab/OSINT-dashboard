"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = withRetry;
const errors_1 = require("./errors");
const DEFAULT_OPTS = {
    retries: 3,
    baseDelayMs: 300,
    maxDelayMs: 8_000,
    factor: 2,
    jitter: true,
};
async function withRetry(fn, opts = {}) {
    const o = { ...DEFAULT_OPTS, ...opts };
    let lastErr;
    for (let attempt = 0; attempt <= o.retries; attempt++) {
        try {
            return await fn(attempt);
        }
        catch (err) {
            lastErr = err;
            if (err instanceof errors_1.ProviderAuthError)
                throw err;
            if (attempt === o.retries)
                break;
            let delay = Math.min(o.maxDelayMs, o.baseDelayMs * Math.pow(o.factor, attempt));
            if (err instanceof errors_1.ProviderRateLimitError && err.retryAfterMs) {
                delay = Math.max(delay, err.retryAfterMs);
            }
            if (o.jitter)
                delay = Math.floor(delay * (0.5 + Math.random() * 0.5));
            await new Promise((r) => setTimeout(r, delay));
        }
    }
    if (lastErr instanceof errors_1.ProviderError)
        throw lastErr;
    throw new Error(`Retry exhausted: ${String(lastErr)}`);
}
