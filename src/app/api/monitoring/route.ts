/**
 * @context api/monitoring/route.ts
 * @what    GET endpoint que retorna métricas de storage, banco e APIs
 * @purpose Fornecer dados para a página /admin/monitoring
 * @depends monitoring.service, api helpers, auth
 * @usedby  admin/monitoring/page.tsx (Server Component fetch)
 * @rules   Somente admin. Dados do banco — nunca expor credenciais ou service keys.
 * @layer   api-route
 */
import { auth } from "@/auth";
import { ok, unauthorized, forbidden, internalError } from "@/lib/api";
import {
  getStorageMetrics,
  getDatabaseMetrics,
  getApiMetrics,
} from "@/services/monitoring.service";

export async function GET() {
  const session = await auth();
  if (!session?.user)                         return unauthorized();
  if (session.user.role !== "admin") return forbidden();

  try {
    const [storage, database, apis] = await Promise.all([
      getStorageMetrics(),
      getDatabaseMetrics(),
      getApiMetrics(),
    ]);

    return ok({
      storage,
      database,
      apis,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    return internalError((error as { message?: string }).message ?? undefined);
  }
}
