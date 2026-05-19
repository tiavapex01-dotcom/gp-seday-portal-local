/**
 * @context api/content/route.ts
 * @what    GET (listar) e POST (criar) conteúdo da Central de Marca
 * @purpose Endpoint principal da Central de Conteúdo
 * @depends content.service, content.schema, auth, api helpers, permissions
 * @usedby  /content page, /admin/content page
 * @rules   GET: qualquer usuário autenticado (filtrado pela empresa, exceto admin)
 *          POST: admin only, multipart/form-data
 * @layer   api-route
 */
import { type NextRequest }                      from "next/server";
import { auth }                                  from "@/auth";
import { ok, created, unauthorized, forbidden, fromZodError, err } from "@/lib/api";
import { ROLES }                                 from "@/lib/permissions";
import { listContentSchema, createContentSchema } from "@/schemas/content.schema";
import {
  listContent,
  createContent,
  validateContentFile,
} from "@/services/content.service";
import { ZodError }                              from "zod/v4";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { searchParams } = req.nextUrl;
  const rawParams = Object.fromEntries(searchParams.entries());

  // Non-admin users can only see their own company's content
  if (session.user.role !== ROLES.ADMIN) {
    rawParams.company = session.user.company;
  }

  try {
    const filters = listContentSchema.parse(rawParams);
    return ok(await listContent(filters));
  } catch (e) {
    if (e instanceof ZodError) return fromZodError(e);
    return err((e as { message?: string }).message ?? "Erro interno", 400);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user)                        return unauthorized();
  if (session.user.role !== ROLES.ADMIN) return forbidden();

  try {
    const formData = await req.formData();
    const file     = formData.get("file") as File | null;
    const metaRaw  = formData.get("metadata") as string | null;

    if (!file)     return err("Campo 'file' é obrigatório", 400);
    if (!metaRaw)  return err("Campo 'metadata' é obrigatório", 400);

    // Validate file type/size
    const fileError = validateFile(file);
    if (fileError) return err(fileError, 422);

    // Parse and validate metadata
    const input = createContentSchema.parse(JSON.parse(metaRaw));

    const content = await createContent(file, input, session.user.id);
    return created(content);
  } catch (e) {
    if (e instanceof ZodError) return fromZodError(e);
    return err((e as { message?: string }).message ?? "Erro interno", 400);
  }
}
