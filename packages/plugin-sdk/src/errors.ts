export class ProviderError extends Error {
  constructor(
    public readonly provider: string,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(`[${provider}] ${message}`);
    this.name = 'ProviderError';
  }
}

export class ProviderRateLimitError extends ProviderError {
  constructor(provider: string, public readonly retryAfterMs?: number) {
    super(provider, `Rate limited${retryAfterMs ? ` (retry after ${retryAfterMs}ms)` : ''}`);
    this.name = 'ProviderRateLimitError';
  }
}

export class ProviderAuthError extends ProviderError {
  constructor(provider: string, message = 'Authentication failed') {
    super(provider, message);
    this.name = 'ProviderAuthError';
  }
}

export class ProviderNotFoundError extends ProviderError {
  constructor(provider: string, target: string) {
    super(provider, `No data for "${target}"`);
    this.name = 'ProviderNotFoundError';
  }
}

export class ProviderDisabledError extends ProviderError {
  constructor(provider: string, reason: string) {
    super(provider, `Disabled: ${reason}`);
    this.name = 'ProviderDisabledError';
  }
}

export class CircuitBreakerOpenError extends ProviderError {
  constructor(provider: string) {
    super(provider, 'Circuit breaker open');
    this.name = 'CircuitBreakerOpenError';
  }
}
