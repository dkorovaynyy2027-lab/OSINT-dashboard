"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = void 0;
const errors_1 = require("./errors");
class CircuitBreaker {
    name;
    opts;
    state = 'CLOSED';
    failures = 0;
    openedAt = 0;
    halfOpenInFlight = 0;
    constructor(name, opts = {
        failureThreshold: 5,
        cooldownMs: 30_000,
        halfOpenMaxCalls: 1,
    }) {
        this.name = name;
        this.opts = opts;
    }
    async execute(fn) {
        this.transitionIfReady();
        if (this.state === 'OPEN') {
            throw new errors_1.CircuitBreakerOpenError(this.name);
        }
        if (this.state === 'HALF_OPEN') {
            if (this.halfOpenInFlight >= this.opts.halfOpenMaxCalls) {
                throw new errors_1.CircuitBreakerOpenError(this.name);
            }
            this.halfOpenInFlight++;
        }
        try {
            const result = await fn();
            this.onSuccess();
            return result;
        }
        catch (err) {
            this.onFailure();
            throw err;
        }
        finally {
            if (this.state === 'HALF_OPEN') {
                this.halfOpenInFlight = Math.max(0, this.halfOpenInFlight - 1);
            }
        }
    }
    transitionIfReady() {
        if (this.state === 'OPEN' && Date.now() - this.openedAt >= this.opts.cooldownMs) {
            this.state = 'HALF_OPEN';
            this.halfOpenInFlight = 0;
        }
    }
    onSuccess() {
        this.failures = 0;
        this.state = 'CLOSED';
    }
    onFailure() {
        this.failures++;
        if (this.failures >= this.opts.failureThreshold) {
            this.state = 'OPEN';
            this.openedAt = Date.now();
        }
    }
    getState() {
        this.transitionIfReady();
        return this.state;
    }
}
exports.CircuitBreaker = CircuitBreaker;
