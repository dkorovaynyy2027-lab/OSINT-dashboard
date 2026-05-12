"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseProvider = void 0;
const circuit_breaker_1 = require("./circuit-breaker");
const errors_1 = require("./errors");
const rate_limit_1 = require("./rate-limit");
const retry_1 = require("./retry");
/**
 * Abstract base for every OSINT provider. Concrete providers implement `query`
 * and `supports`. Lifecycle: rate-limit → circuit-breaker → retry → query.
 */
class BaseProvider {
    config;
    bucket;
    breaker;
    retryOpts;
    constructor(config = {}) {
        this.config = config;
        const rl = config.rateLimit ?? { capacity: 5, refillPerSecond: 1 };
        this.bucket = new rate_limit_1.TokenBucket(rl.capacity, rl.refillPerSecond);
        this.breaker = new circuit_breaker_1.CircuitBreaker(this.constructor.name, {
            failureThreshold: 5,
            cooldownMs: 30_000,
            halfOpenMaxCalls: 1,
            ...config.circuitBreaker,
        });
        this.retryOpts = config.retry ?? {};
    }
    isEnabled() {
        if (this.meta.requiresApiKey && !this.config.apiKey)
            return false;
        return true;
    }
    supports(kind) {
        return this.meta.supports.includes(kind);
    }
    /** Public entry — never throws; always returns an envelope. */
    async run(ctx) {
        const started = Date.now();
        const base = {
            provider: this.meta.name,
            fetchedAt: new Date().toISOString(),
            durationMs: 0,
            data: null,
        };
        if (!this.isEnabled()) {
            return {
                ...base,
                status: 'DISABLED',
                error: 'Provider requires an API key',
                durationMs: Date.now() - started,
            };
        }
        if (!this.supports(ctx.entityKind)) {
            return {
                ...base,
                status: 'DISABLED',
                error: `Provider does not support ${ctx.entityKind}`,
                durationMs: Date.now() - started,
            };
        }
        try {
            await this.bucket.take();
            const result = await this.breaker.execute(() => (0, retry_1.withRetry)(() => this.query({ ...ctx, apiKey: this.config.apiKey ?? null }), this.retryOpts));
            return {
                ...base,
                status: result.data === null ? 'NOT_FOUND' : 'OK',
                data: result.data,
                relatedEntities: result.relatedEntities,
                riskSignals: result.riskSignals,
                durationMs: Date.now() - started,
            };
        }
        catch (err) {
            return mapErrorToEnvelope(base, err, started);
        }
    }
}
exports.BaseProvider = BaseProvider;
function mapErrorToEnvelope(base, err, started) {
    const durationMs = Date.now() - started;
    if (err instanceof errors_1.ProviderNotFoundError) {
        return { ...base, status: 'NOT_FOUND', durationMs };
    }
    if (err instanceof errors_1.ProviderRateLimitError) {
        return { ...base, status: 'RATE_LIMITED', error: err.message, durationMs };
    }
    if (err instanceof errors_1.ProviderDisabledError) {
        return { ...base, status: 'DISABLED', error: err.message, durationMs };
    }
    if (err instanceof errors_1.CircuitBreakerOpenError) {
        return { ...base, status: 'ERROR', error: 'Circuit breaker open', durationMs };
    }
    if (err instanceof errors_1.ProviderError) {
        return { ...base, status: 'ERROR', error: err.message, durationMs };
    }
    return { ...base, status: 'ERROR', error: String(err), durationMs };
}
