import { z } from 'zod';
export declare const EntityKind: {
    readonly EMAIL: "EMAIL";
    readonly USERNAME: "USERNAME";
    readonly DOMAIN: "DOMAIN";
    readonly IP: "IP";
    readonly PHONE: "PHONE";
    readonly CRYPTO_WALLET: "CRYPTO_WALLET";
    readonly SOCIAL_PROFILE: "SOCIAL_PROFILE";
    readonly COMPANY: "COMPANY";
    readonly PERSON: "PERSON";
    readonly ASN: "ASN";
    readonly HASH: "HASH";
    readonly URL: "URL";
};
export type EntityKind = (typeof EntityKind)[keyof typeof EntityKind];
export declare const entityKindSchema: z.ZodEnum<["EMAIL", "USERNAME", "DOMAIN", "IP", "PHONE", "CRYPTO_WALLET", "SOCIAL_PROFILE", "COMPANY", "PERSON", "ASN", "HASH", "URL"]>;
export declare const Role: {
    readonly ADMIN: "ADMIN";
    readonly ANALYST: "ANALYST";
    readonly VIEWER: "VIEWER";
};
export type Role = (typeof Role)[keyof typeof Role];
export declare const roleSchema: z.ZodEnum<["ADMIN", "ANALYST", "VIEWER"]>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    totpCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    totpCode?: string | undefined;
}, {
    email: string;
    password: string;
    totpCode?: string | undefined;
}>;
export type LoginDto = z.infer<typeof loginSchema>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    displayName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    displayName: string;
}, {
    email: string;
    password: string;
    displayName: string;
}>;
export type RegisterDto = z.infer<typeof registerSchema>;
export declare const refreshSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export type RefreshDto = z.infer<typeof refreshSchema>;
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    accessTtl: number;
    refreshTtl: number;
}
export interface SessionUser {
    id: string;
    email: string;
    displayName: string;
    role: Role;
    twoFactorEnabled: boolean;
}
export declare const createEntitySchema: z.ZodObject<{
    kind: z.ZodEnum<["EMAIL", "USERNAME", "DOMAIN", "IP", "PHONE", "CRYPTO_WALLET", "SOCIAL_PROFILE", "COMPANY", "PERSON", "ASN", "HASH", "URL"]>;
    value: z.ZodString;
    investigationId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value: string;
    kind: "EMAIL" | "USERNAME" | "DOMAIN" | "IP" | "PHONE" | "CRYPTO_WALLET" | "SOCIAL_PROFILE" | "COMPANY" | "PERSON" | "ASN" | "HASH" | "URL";
    investigationId?: string | undefined;
    notes?: string | undefined;
}, {
    value: string;
    kind: "EMAIL" | "USERNAME" | "DOMAIN" | "IP" | "PHONE" | "CRYPTO_WALLET" | "SOCIAL_PROFILE" | "COMPANY" | "PERSON" | "ASN" | "HASH" | "URL";
    investigationId?: string | undefined;
    notes?: string | undefined;
}>;
export type CreateEntityDto = z.infer<typeof createEntitySchema>;
export declare const createInvestigationSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    tags?: string[] | undefined;
    description?: string | undefined;
}, {
    title: string;
    tags?: string[] | undefined;
    description?: string | undefined;
}>;
export type CreateInvestigationDto = z.infer<typeof createInvestigationSchema>;
export declare const enrichmentRequestSchema: z.ZodObject<{
    entityId: z.ZodString;
    providers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    entityId: string;
    providers?: string[] | undefined;
}, {
    entityId: string;
    providers?: string[] | undefined;
}>;
export type EnrichmentRequestDto = z.infer<typeof enrichmentRequestSchema>;
export declare const providerStatus: z.ZodEnum<["OK", "NOT_FOUND", "ERROR", "RATE_LIMITED", "DISABLED"]>;
export type ProviderStatus = z.infer<typeof providerStatus>;
export interface ProviderResultEnvelope<T = unknown> {
    provider: string;
    status: ProviderStatus;
    durationMs: number;
    fetchedAt: string;
    data: T | null;
    error?: string;
    relatedEntities?: RelatedEntity[];
    riskSignals?: RiskSignal[];
}
export interface RelatedEntity {
    kind: EntityKind;
    value: string;
    relation: string;
    confidence: number;
}
export interface RiskSignal {
    type: string;
    severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    score: number;
}
export declare const WsEvent: {
    readonly EnrichmentStarted: "enrichment.started";
    readonly EnrichmentProgress: "enrichment.progress";
    readonly EnrichmentResult: "enrichment.result";
    readonly EnrichmentDone: "enrichment.done";
    readonly AlertCreated: "alert.created";
    readonly ActivityCreated: "activity.created";
};
export type WsEvent = (typeof WsEvent)[keyof typeof WsEvent];
export interface WsEnrichmentResultPayload {
    entityId: string;
    jobId: string;
    result: ProviderResultEnvelope;
}
export interface WsEnrichmentDonePayload {
    entityId: string;
    jobId: string;
    totalProviders: number;
    successCount: number;
    errorCount: number;
}
