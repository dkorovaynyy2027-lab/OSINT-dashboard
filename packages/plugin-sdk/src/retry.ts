import { ProviderAuthError, ProviderError, ProviderRateLimitError } from './errors';

export interface RetryOptions {
  retries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  factor: number;
  jitter?: boolean;
}

const DEFAULT_OPTS: RetryOptions = {
  retries: 3,
  baseDelayMs: 300,
  maxDelayMs: 8_000,
  factor: 2,
  jitter: true,
};

export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: Partial<RetryOptions> = {},
): Promise<T> {
  const o = { ...DEFAULT_OPTS, ...opts };
  let lastErr: unknown;

  for (let attempt = 0; attempt <= o.retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      if (err instanceof ProviderAuthError) throw err;
      if (attempt === o.retries) break;

      let delay = Math.min(o.maxDelayMs, o.baseDelayMs * Math.pow(o.factor, attempt));
      if (err instanceof ProviderRateLimitError && err.retryAfterMs) {
        delay = Math.max(delay, err.retryAfterMs);
      }
      if (o.jitter) delay = Math.floor(delay * (0.5 + Math.random() * 0.5));
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  if (lastErr instanceof ProviderError) throw lastErr;
  throw new Error(`Retry exhausted: ${String(lastErr)}`);
}
