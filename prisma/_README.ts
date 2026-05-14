/**
 * @folder  prisma
 * @what    Prisma schema, seed script, and DB maintenance utilities
 * @purpose Define DB models, seed test data, and ad-hoc DB scripts
 * @rules   Never run seed.ts in production against a real database without reviewing it first.
 *          check-duplicates.ts and cleanup-duplicates.ts are one-off maintenance scripts.
 *          After schema changes: npx prisma db push (dev) or create a migration (prod).
 * @layer   prisma
 * @ai      schema.prisma defines User, Folder, File, Communication models.
 *          Folder has self-referential parent/children relation and isRoot flag for top-level sectors.
 *
 * Files:
 *   schema.prisma          — DB model definitions
 *   seed.ts                — Creates root sectors and 3 test users per company
 *   check-duplicates.ts    — Reports root folders with duplicate names (case-insensitive)
 *   cleanup-duplicates.ts  — Deletes known duplicate root folders (safe to re-run: idempotent by ID)
 */
export {};
