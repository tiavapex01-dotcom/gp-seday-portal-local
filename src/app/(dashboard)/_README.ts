/**
 * @folder  src/app/(dashboard)
 * @what    Protected dashboard pages — all require an active session
 * @purpose Main app UI: dashboard, communications, files, admin
 * @rules   All pages call auth() at the top and return null if no session (middleware also guards).
 *          Server Components fetch data directly via Prisma/services — no API calls from pages.
 *          Client Components needing interactivity call fetch() to API routes.
 * @layer   app/(dashboard)
 * @ai      layout.tsx passes session.user to <Sidebar>. Pages are async Server Components.
 *
 * Pages:
 *   dashboard/          — Summary cards + pinned/recent communications
 *   communications/     — Full list of pinned + all communications
 *   communications/new  — Create communication form (client, manager/admin)
 *   files/              — Folder tree sidebar + file grid (server + client components)
 *   files/upload/       — Upload form (client)
 *   admin/              — User list table (server)
 *   admin/users/new     — Create user form (client, admin only)
 */
export {};
