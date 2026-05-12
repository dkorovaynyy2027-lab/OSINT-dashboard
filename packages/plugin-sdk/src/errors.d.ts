export declare class ProviderError extends Error {
    readonly provider: string;
    readonly cause?: unknown | undefined;
    constructor(provider: string, message: string, cause?: unknown | undefined);
}
export declare class ProviderRateLimitError extends ProviderError {
    readonly retryAfterMs?: number | undefined;
    constructor(provider: string, retryAfterMs?: number | undefined);
}
export declare class ProviderAuthError extends ProviderError {
    constructor(provider: string, message?: string);
}
export declare class ProviderNotFoundError extends ProviderError {
    constructor(provider: string, target: string);
}
export declare class ProviderDisabledError extends ProviderError {
    constructor(provider: string, reason: string);
}
export declare class CircuitBreakerOpenError extends ProviderError {
    constructor(provider: string);
}
