/**
 * @context api/content/stats/route.ts
 * @what    GET métricas da Central de Conteúdo (admin only)
 * @purpose Fornecer dados para o painel admin: totais, downloads, top items
 * @depends content.service, auth, api helpers
 * @usedby  /admin/content page (cards de estatísticas)
 * @rules   Somente admin
 * @layer   api-route
 */
import { type NextRequest } from "next/server";
import { auth }             from "@/auth";
import { ok, unauthorized, forbidden, err } from "@/lib/api";
import { ROLES }            from "@/lib/permissions";
import { getContentStats }  from "@/services/content.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user)                        return unauthorized();
  if (session.user.role !== ROLES.ADMIN) return forbidden();

  const company = req.nextUrl.searchParams.get("company") ?? undefined;

  try {
    return ok(await getContentStats(company));
  } catch (e) {
    return err((e as { message?: string }).message ?? "Erro interno", 500);
  }
}
