/**
 * @context sentry.edge.config.ts
 * @what    Inicialização do Sentry no Edge runtime (middleware, edge routes)
 * @purpose Capturar erros no Edge runtime do Next.js
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
