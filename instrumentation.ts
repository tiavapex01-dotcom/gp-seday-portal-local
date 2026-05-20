/**
 * @context instrumentation.ts
 * @what    Hook de instrumentação do Next.js para Sentry server/edge
 * @purpose Importar configs do Sentry no runtime correto (Node.js ou Edge)
 * @depends sentry.server.config, sentry.edge.config
 * @usedby  Next.js (carregado automaticamente ao iniciar o servidor)
 * @layer   lib
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
