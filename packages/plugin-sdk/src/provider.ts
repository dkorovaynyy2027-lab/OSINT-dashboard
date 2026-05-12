import type {
  EntityKind,
  ProviderResultEnvelope,
  ProviderStatus,
  RelatedEntity,
  RiskSignal,
} from '@osint/types';
import { CircuitBreaker, type CircuitBreakerOptions } from './circuit-breaker';
import {
  CircuitBreakerOpenError,
  ProviderDisabledError,
  ProviderError,
  ProviderNotFoundError,
  ProviderRateLimitError,
} from './errors';
import { TokenBucket } from './rate-limit';
import { withRetry, type RetryOptions } from './retry';

export interface ProviderMetadata {
  name: string;
  displayName: string;
  description: string;
  supports: EntityKind[];
  requiresApiKey: boolean;
  homepage?: string;
  freeTier: string;
}

export interface ProviderRunResult<T = unknown> {
  data: T | null;
  relatedEntities?: RelatedEntity[];
  riskSignals?: RiskSignal[];
}

export interface ProviderRunContext {
  entityKind: EntityKind;
  value: string;
  apiKey: string | null;
}

export interface ProviderConfig {
  apiKey?: string | null;
  rateLimit?: { capacity: number; refillPerSecond: number };
  circuitBreaker?: Partial<CircuitBreakerOptions>;
  retry?: Partial<RetryOptions>;
}

/**
 * Abstract base for every OSINT provider. Concrete providers implement `query`
 * and `supports`. Lifecycle: rate-limit → circuit-breaker → retry → query.
 */
export abstract class BaseProvider<T = unknown> {
  abstract readonly meta: ProviderMetadata;

  private readonly bucket: TokenBucket;
  private readonly breaker: CircuitBreaker;
  private readonly retryOpts: Partial<RetryOptions>;

  constructor(protected readonly config: ProviderConfig = {}) {
    const rl = config.rateLimit ?? { capacity: 5, refillPerSecond: 1 };
    this.bucket = new TokenBucket(rl.capacity, rl.refillPerSecond);
    this.breaker = new CircuitBreaker(this.constructor.name, {
      failureThreshold: 5,
      cooldownMs: 30_000,
      halfOpenMaxCalls: 1,
      ...config.circuitBreaker,
    });
    this.retryOpts = config.retry ?? {};
  }

  /** Concrete providers must implement this. */
  protected abstract query(ctx: ProviderRunContext): Promise<ProviderRunResult<T>>;

  isEnabled(): boolean {
    if (this.meta.requiresApiKey && !this.config.apiKey) return false;
    return true;
  }

  supports(kind: EntityKind): boolean {
    return this.meta.supports.includes(kind);
  }

  /** Public entry — never throws; always returns an envelope. */
  async run(ctx: Omit<ProviderRunContext, 'apiKey'>): Promise<ProviderResultEnvelope<T>> {
    const started = Date.now();
    const base = {
      provider: this.meta.name,
      fetchedAt: new Date().toISOString(),
      durationMs: 0,
      data: null as T | null,
    };

    if (!this.isEnabled()) {
      return {
        ...base,
        status: 'DISABLED' as ProviderStatus,
        error: 'Provider requires an API key',
        durationMs: Date.now() - started,
      };
    }
    if (!this.supports(ctx.entityKind)) {
      return {
        ...base,
        status: 'DISABLED' as ProviderStatus,
        error: `Provider does not support ${ctx.entityKind}`,
        durationMs: Date.now() - started,
      };
    }

    try {
      await this.bucket.take();
      const result = await this.breaker.execute(() =>
        withRetry(
          () => this.query({ ...ctx, apiKey: this.config.apiKey ?? null }),
          this.retryOpts,
        ),
      );

      return {
        ...base,
        status: result.data === null ? 'NOT_FOUND' : 'OK',
        data: result.data,
        relatedEntities: result.relatedEntities,
        riskSignals: result.riskSignals,
        durationMs: Date.now() - started,
      };
    } catch (err) {
      return mapErrorToEnvelope(base, err, started);
    }
  }
}

function mapErrorToEnvelope<T>(
  base: Omit<ProviderResultEnvelope<T>, 'status' | 'error'>,
  err: unknown,
  started: number,
): ProviderResultEnvelope<T> {
  const durationMs = Date.now() - started;
  if (err instanceof ProviderNotFoundError) {
    return { ...base, status: 'NOT_FOUND', durationMs };
  }
  if (err instanceof ProviderRateLimitError) {
    return { ...base, status: 'RATE_LIMITED', error: err.message, durationMs };
  }
  if (err instanceof ProviderDisabledError) {
    return { ...base, status: 'DISABLED', error: err.message, durationMs };
  }
  if (err instanceof CircuitBreakerOpenError) {
    return { ...base, status: 'ERROR', error: 'Circuit breaker open', durationMs };
  }
  if (err instanceof ProviderError) {
    return { ...base, status: 'ERROR', error: err.message, durationMs };
  }
  return { ...base, status: 'ERROR', error: String(err), durationMs };
}
