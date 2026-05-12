export interface HttpClientOptions {
    baseUrl?: string;
    defaultHeaders?: Record<string, string>;
    timeoutMs?: number;
}
export interface HttpRequestOptions extends RequestInit {
    query?: Record<string, string | number | boolean | undefined | null>;
    timeoutMs?: number;
}
export declare class HttpClient {
    private readonly provider;
    private readonly opts;
    constructor(provider: string, opts?: HttpClientOptions);
    request<T = unknown>(path: string, init?: HttpRequestOptions): Promise<T>;
    private buildUrl;
}
