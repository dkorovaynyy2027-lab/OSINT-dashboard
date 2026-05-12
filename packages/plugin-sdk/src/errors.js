"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreakerOpenError = exports.ProviderDisabledError = exports.ProviderNotFoundError = exports.ProviderAuthError = exports.ProviderRateLimitError = exports.ProviderError = void 0;
class ProviderError extends Error {
    provider;
    cause;
    constructor(provider, message, cause) {
        super(`[${provider}] ${message}`);
        this.provider = provider;
        this.cause = cause;
        this.name = 'ProviderError';
    }
}
exports.ProviderError = ProviderError;
class ProviderRateLimitError extends ProviderError {
    retryAfterMs;
    constructor(provider, retryAfterMs) {
        super(provider, `Rate limited${retryAfterMs ? ` (retry after ${retryAfterMs}ms)` : ''}`);
        this.retryAfterMs = retryAfterMs;
        this.name = 'ProviderRateLimitError';
    }
}
exports.ProviderRateLimitError = ProviderRateLimitError;
class ProviderAuthError extends ProviderError {
    constructor(provider, message = 'Authentication failed') {
        super(provider, message);
        this.name = 'ProviderAuthError';
    }
}
exports.ProviderAuthError = ProviderAuthError;
class ProviderNotFoundError extends ProviderError {
    constructor(provider, target) {
        super(provider, `No data for "${target}"`);
        this.name = 'ProviderNotFoundError';
    }
}
exports.ProviderNotFoundError = ProviderNotFoundError;
class ProviderDisabledError extends ProviderError {
    constructor(provider, reason) {
        super(provider, `Disabled: ${reason}`);
        this.name = 'ProviderDisabledError';
    }
}
exports.ProviderDisabledError = ProviderDisabledError;
class CircuitBreakerOpenError extends ProviderError {
    constructor(provider) {
        super(provider, 'Circuit breaker open');
        this.name = 'CircuitBreakerOpenError';
    }
}
exports.CircuitBreakerOpenError = CircuitBreakerOpenError;
