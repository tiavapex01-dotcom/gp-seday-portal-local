/**
 * @folder  src/lib
 * @what    Shared infrastructure modules: Prisma, Supabase, API helpers, auth config, error types
 * @purpose Low-level utilities consumed by services and API routes
 * @rules   NO React or JSX here. NO Prisma queries here (use services). Modules must be importable server-side.
 * @layer   lib
 * @ai      Read each file's @context before editing. api.ts helpers must be used by ALL routes.
 *
 * Files:
 *   prisma.ts      — PrismaClient singleton
 *   supabase.ts    — Supabase service-role client (server-only)
 *   api.ts         — HTTP response helpers (ok, err, unauthorized, forbidden, notFound...)
 *   errors.ts      — AppError hierarchy (UnauthorizedError, ForbiddenError, NotFoundError...)
 *   pagination.ts  — parsePagination / buildMeta helpers
 *   permissions.ts — ROLES, COMPANIES constants and predicates (canManage, isAdmin...)
 *   utils.ts       — Pure formatting functions (formatFileSize, formatDate, sanitizeDigits...)
 */
export {};
