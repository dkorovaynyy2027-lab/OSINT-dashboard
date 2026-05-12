"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = void 0;
const errors_1 = require("./errors");
class HttpClient {
    provider;
    opts;
    constructor(provider, opts = {}) {
        this.provider = provider;
        this.opts = opts;
    }
    async request(path, init = {}) {
        const url = this.buildUrl(path, init.query);
        const timeoutMs = init.timeoutMs ?? this.opts.timeoutMs ?? 15_000;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        let res;
        try {
            res = await fetch(url, {
                ...init,
                signal: controller.signal,
                headers: { ...(this.opts.defaultHeaders ?? {}), ...(init.headers ?? {}) },
            });
        }
        catch (err) {
            const error = err;
            if (error.name === 'AbortError') {
                throw new errors_1.ProviderError(this.provider, `Request timed out after ${timeoutMs}ms`, err);
            }
            throw new errors_1.ProviderError(this.provider, `Network error: ${error.message}`, err);
        }
        finally {
            clearTimeout(timer);
        }
        if (res.status === 401 || res.status === 403) {
            throw new errors_1.ProviderAuthError(this.provider, `HTTP ${res.status}`);
        }
        if (res.status === 429) {
            const retryAfter = Number(res.headers.get('retry-after'));
            const retryAfterMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : undefined;
            throw new errors_1.ProviderRateLimitError(this.provider, retryAfterMs);
        }
        if (res.status === 404) {
            // Let the caller decide: return null typed body, since "not found" is not always an error
            return null;
        }
        if (!res.ok) {
            const body = await safeText(res);
            throw new errors_1.ProviderError(this.provider, `HTTP ${res.status}: ${body.slice(0, 300)}`);
        }
        const contentType = res.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
            return (await res.json());
        }
        return (await res.text());
    }
    buildUrl(path, query) {
        const base = this.opts.baseUrl ?? '';
        const url = new URL(path.startsWith('http') ? path : `${base}${path}`);
        if (query) {
            for (const [k, v] of Object.entries(query)) {
                if (v === undefined || v === null)
                    continue;
                url.searchParams.set(k, String(v));
            }
        }
        return url.toString();
    }
}
exports.HttpClient = HttpClient;
async function safeText(res) {
    try {
        return await res.text();
    }
    catch {
        return '';
    }
}
