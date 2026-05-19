/**
 * @context api/content/[id]/route.ts
 * @what    GET (busca), PATCH (atualiza metadados), DELETE (remove) por id
 * @purpose CRUD individual de conteúdo da Central de Marca
 * @depends content.service, auth, api helpers, permissions
 * @usedby  /admin/content page (editar/excluir), /content page (detalhe)
 * @rules   GET: autenticado, verifica empresa (não-admin só vê a própria)
 *          PATCH/DELETE: admin only
 * @layer   api-route
 */
import { type NextRequest } from "next/server";
import { auth }             from "@/auth";
import {
  ok, unauthorized, forbidden, notFound,
  fromZodError, err,
}                           from "@/lib/api";
import { ROLES }            from "@/lib/permissions";
import { updateContentSchema } from "@/schemas/content.schema";
import {
  getContentById,
  updateContent,
  deleteContent,
}                           from "@/services/content.service";
import { ZodError }         from "zod/v4";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { id } = await params;
  const content = await getContentById(id);
  if (!content) return notFound("Conteúdo");

  // Non-admin: can only see own company
  if (session.user.role !== ROLES.ADMIN && content.company !== session.user.company) {
    return forbidden();
  }

  return ok(content);
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user)                        return unauthorized();
  if (session.user.role !== ROLES.ADMIN) return forbidden();

  const { id } = await params;
  const content = await getContentById(id);
  if (!content) return notFound("Conteúdo");

  try {
    const body  = await req.json();
    const input = updateContentSchema.parse(body);
    return ok(await updateContent(id, input));
  } catch (e) {
    if (e instanceof ZodError) return fromZodError(e);
    return err((e as { message?: string }).message ?? "Erro interno", 400);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user)                        return unauthorized();
  if (session.user.role !== ROLES.ADMIN) return forbidden();

  const { id } = await params;
  const content = await getContentById(id);
  if (!content) return notFound("Conteúdo");

  try {
    await deleteContent(id);
    return ok({ deleted: true });
  } catch (e) {
    return err((e as { message?: string }).message ?? "Erro interno", 400);
  }
}
