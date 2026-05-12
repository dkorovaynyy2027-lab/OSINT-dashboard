import { ProviderAuthError, ProviderError, ProviderRateLimitError } from './errors';

export interface HttpClientOptions {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
  timeoutMs?: number;
}

export interface HttpRequestOptions extends RequestInit {
  query?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
}

export class HttpClient {
  constructor(
    private readonly provider: string,
    private readonly opts: HttpClientOptions = {},
  ) {}

  async request<T = unknown>(path: string, init: HttpRequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, init.query);
    const timeoutMs = init.timeoutMs ?? this.opts.timeoutMs ?? 15_000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    try {
      res = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: { ...(this.opts.defaultHeaders ?? {}), ...(init.headers ?? {}) },
      });
    } catch (err) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        throw new ProviderError(this.provider, `Request timed out after ${timeoutMs}ms`, err);
      }
      throw new ProviderError(this.provider, `Network error: ${error.message}`, err);
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 401 || res.status === 403) {
      throw new ProviderAuthError(this.provider, `HTTP ${res.status}`);
    }
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get('retry-after'));
      const retryAfterMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : undefined;
      throw new ProviderRateLimitError(this.provider, retryAfterMs);
    }
    if (res.status === 404) {
      // Let the caller decide: return null typed body, since "not found" is not always an error
      return null as unknown as T;
    }
    if (!res.ok) {
      const body = await safeText(res);
      throw new ProviderError(this.provider, `HTTP ${res.status}: ${body.slice(0, 300)}`);
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
  }

  private buildUrl(path: string, query?: HttpRequestOptions['query']): string {
    const base = this.opts.baseUrl ?? '';
    const url = new URL(path.startsWith('http') ? path : `${base}${path}`);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return '';
  }
}
