/**
 * @folder  src/app/(auth)
 * @what    Authentication pages (login) — outside the dashboard layout
 * @purpose Unauthenticated public routes; redirect to /dashboard on success
 * @rules   No session check needed here (middleware handles redirect if already logged in).
 *          useSearchParams() MUST be inside a <Suspense> boundary (Next.js 15+ requirement).
 * @layer   app/(auth)
 * @ai      login/page.tsx wraps LoginContent in <Suspense> because of useSearchParams.
 */
export {};
