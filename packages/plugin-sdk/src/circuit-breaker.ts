import { CircuitBreakerOpenError } from './errors';

type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold: number;   // consecutive failures to open
  cooldownMs: number;          // wait before half-open probe
  halfOpenMaxCalls: number;    // probe call budget
}

export class CircuitBreaker {
  private state: State = 'CLOSED';
  private failures = 0;
  private openedAt = 0;
  private halfOpenInFlight = 0;

  constructor(
    private readonly name: string,
    private readonly opts: CircuitBreakerOptions = {
      failureThreshold: 5,
      cooldownMs: 30_000,
      halfOpenMaxCalls: 1,
    },
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.transitionIfReady();
    if (this.state === 'OPEN') {
      throw new CircuitBreakerOpenError(this.name);
    }
    if (this.state === 'HALF_OPEN') {
      if (this.halfOpenInFlight >= this.opts.halfOpenMaxCalls) {
        throw new CircuitBreakerOpenError(this.name);
      }
      this.halfOpenInFlight++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    } finally {
      if (this.state === 'HALF_OPEN') {
        this.halfOpenInFlight = Math.max(0, this.halfOpenInFlight - 1);
      }
    }
  }

  private transitionIfReady() {
    if (this.state === 'OPEN' && Date.now() - this.openedAt >= this.opts.cooldownMs) {
      this.state = 'HALF_OPEN';
      this.halfOpenInFlight = 0;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    if (this.failures >= this.opts.failureThreshold) {
      this.state = 'OPEN';
      this.openedAt = Date.now();
    }
  }

  getState(): State {
    this.transitionIfReady();
    return this.state;
  }
}
