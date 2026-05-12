type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
export interface CircuitBreakerOptions {
    failureThreshold: number;
    cooldownMs: number;
    halfOpenMaxCalls: number;
}
export declare class CircuitBreaker {
    private readonly name;
    private readonly opts;
    private state;
    private failures;
    private openedAt;
    private halfOpenInFlight;
    constructor(name: string, opts?: CircuitBreakerOptions);
    execute<T>(fn: () => Promise<T>): Promise<T>;
    private transitionIfReady;
    private onSuccess;
    private onFailure;
    getState(): State;
}
export {};
