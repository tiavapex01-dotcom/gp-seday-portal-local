/**
 * @context sentry.client.config.ts
 * @what    Inicialização do Sentry no browser
 * @purpose Capturar erros JS e sessões de replay no cliente
 * @depends @sentry/nextjs
 * @usedby  next.config.ts (withSentryConfig)
 * @layer   lib
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate:         0.1,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText:   true,
      blockAllMedia: true,
    }),
  ],

  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
