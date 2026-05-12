import type { EntityKind, ProviderResultEnvelope, RelatedEntity, RiskSignal } from '@osint/types';
import { type CircuitBreakerOptions } from './circuit-breaker';
import { type RetryOptions } from './retry';
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
    rateLimit?: {
        capacity: number;
        refillPerSecond: number;
    };
    circuitBreaker?: Partial<CircuitBreakerOptions>;
    retry?: Partial<RetryOptions>;
}
/**
 * Abstract base for every OSINT provider. Concrete providers implement `query`
 * and `supports`. Lifecycle: rate-limit → circuit-breaker → retry → query.
 */
export declare abstract class BaseProvider<T = unknown> {
    protected readonly config: ProviderConfig;
    abstract readonly meta: ProviderMetadata;
    private readonly bucket;
    private readonly breaker;
    private readonly retryOpts;
    constructor(config?: ProviderConfig);
    /** Concrete providers must implement this. */
    protected abstract query(ctx: ProviderRunContext): Promise<ProviderRunResult<T>>;
    isEnabled(): boolean;
    supports(kind: EntityKind): boolean;
    /** Public entry — never throws; always returns an envelope. */
    run(ctx: Omit<ProviderRunContext, 'apiKey'>): Promise<ProviderResultEnvelope<T>>;
}
