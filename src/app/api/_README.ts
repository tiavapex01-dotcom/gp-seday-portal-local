/**
 * @folder  src/app/api
 * @what    Next.js App Router API route handlers (thin controllers)
 * @purpose Auth guard → Zod parse → service call → HTTP response
 * @rules   NEVER put Prisma queries here. NEVER inline business logic.
 *          ALWAYS use helpers from lib/api.ts (ok, err, unauthorized, forbidden, notFound...).
 *          ALWAYS import ZodError from "zod" and use fromZodError() for validation errors.
 * @layer   api
 * @ai      Pattern for every handler: const session = await auth(); if (!session?.user) return unauthorized();
 *
 * Routes:
 *   auth/[...nextauth]     — NextAuth handler (GET + POST, auto-managed)
 *   users/                 — GET list, POST create (admin only)
 *   communications/        — GET list, POST create
 *   communications/[id]    — PATCH (pin/publish), DELETE
 *   folders/               — GET list, POST create (subfolder or root sector)
 *   folders/[id]           — PATCH rename, DELETE
 *   files/                 — GET list, POST upload (multipart)
 *   files/[id]             — DELETE
 *   files/download/[id]    — GET authenticated file proxy (never redirect to storage URL)
 */
export {};
