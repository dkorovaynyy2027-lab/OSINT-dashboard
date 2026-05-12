"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsEvent = exports.providerStatus = exports.enrichmentRequestSchema = exports.createInvestigationSchema = exports.createEntitySchema = exports.refreshSchema = exports.registerSchema = exports.loginSchema = exports.roleSchema = exports.Role = exports.entityKindSchema = exports.EntityKind = void 0;
const zod_1 = require("zod");
// ============================================================
// Entity types — what we can search for
// ============================================================
exports.EntityKind = {
    EMAIL: 'EMAIL',
    USERNAME: 'USERNAME',
    DOMAIN: 'DOMAIN',
    IP: 'IP',
    PHONE: 'PHONE',
    CRYPTO_WALLET: 'CRYPTO_WALLET',
    SOCIAL_PROFILE: 'SOCIAL_PROFILE',
    COMPANY: 'COMPANY',
    PERSON: 'PERSON',
    ASN: 'ASN',
    HASH: 'HASH',
    URL: 'URL',
};
exports.entityKindSchema = zod_1.z.enum([
    'EMAIL', 'USERNAME', 'DOMAIN', 'IP', 'PHONE',
    'CRYPTO_WALLET', 'SOCIAL_PROFILE', 'COMPANY', 'PERSON',
    'ASN', 'HASH', 'URL',
]);
// ============================================================
// RBAC
// ============================================================
exports.Role = {
    ADMIN: 'ADMIN',
    ANALYST: 'ANALYST',
    VIEWER: 'VIEWER',
};
exports.roleSchema = zod_1.z.enum(['ADMIN', 'ANALYST', 'VIEWER']);
// ============================================================
// Auth DTOs
// ============================================================
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(256),
    totpCode: zod_1.z.string().regex(/^\d{6}$/).optional(),
});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(12).max(256),
    displayName: zod_1.z.string().min(1).max(80),
});
exports.refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1),
});
// ============================================================
// Entity / Investigation / Finding DTOs
// ============================================================
exports.createEntitySchema = zod_1.z.object({
    kind: exports.entityKindSchema,
    value: zod_1.z.string().min(1).max(512),
    investigationId: zod_1.z.string().uuid().optional(),
    notes: zod_1.z.string().max(4000).optional(),
});
exports.createInvestigationSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().max(4000).optional(),
    tags: zod_1.z.array(zod_1.z.string().min(1).max(40)).max(20).optional(),
});
exports.enrichmentRequestSchema = zod_1.z.object({
    entityId: zod_1.z.string().uuid(),
    providers: zod_1.z.array(zod_1.z.string().min(1)).optional(),
});
// ============================================================
// Provider result envelope (returned by every provider)
// ============================================================
exports.providerStatus = zod_1.z.enum(['OK', 'NOT_FOUND', 'ERROR', 'RATE_LIMITED', 'DISABLED']);
// ============================================================
// WebSocket events
// ============================================================
exports.WsEvent = {
    EnrichmentStarted: 'enrichment.started',
    EnrichmentProgress: 'enrichment.progress',
    EnrichmentResult: 'enrichment.result',
    EnrichmentDone: 'enrichment.done',
    AlertCreated: 'alert.created',
    ActivityCreated: 'activity.created',
};
