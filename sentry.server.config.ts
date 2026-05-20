/**
 * @context sentry.server.config.ts
 * @what    Inicialização do Sentry no Node.js runtime (server-side)
 * @purpose Capturar erros de API routes e Server Components
 * @depends @sentry/nextjs
 * @usedby  instrumentation.ts
 * @layer   lib
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0.1,

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
