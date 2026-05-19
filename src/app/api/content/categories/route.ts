/**
 * @context api/content/categories/route.ts
 * @what    GET (listar) e POST (criar) categorias da Central de Conteúdo
 * @purpose Endpoint para gerenciar categorias de conteúdo de marca
 * @depends content.service, content.schema, auth, api helpers
 * @usedby  /admin/content/upload page (select dinâmico), /content page
 * @rules   GET: qualquer autenticado. POST: admin only.
 * @layer   api-route
 */
import { type NextRequest } from "next/server";
import { auth }             from "@/auth";
import {
  ok, created, unauthorized, forbidden, fromZodError, err,
}                           from "@/lib/api";
import { ROLES }            from "@/lib/permissions";
import { createCategorySchema } from "@/schemas/content.schema";
import { listCategories, createCategory } from "@/services/content.service";
import { ZodError }         from "zod/v4";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const company = req.nextUrl.searchParams.get("company") ?? session.user.company;

  try {
    const categories = await listCategories(company);
    return ok(categories);
  } catch (e) {
    return err((e as { message?: string }).message ?? "Erro interno", 400);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user)                        return unauthorized();
  if (session.user.role !== ROLES.ADMIN) return forbidden();

  try {
    const body  = await req.json();
    const input = createCategorySchema.parse(body);
    return created(await createCategory(input));
  } catch (e) {
    if (e instanceof ZodError) return fromZodError(e);
    return err((e as { message?: string }).message ?? "Erro interno", 400);
  }
}
