/**
 * @context api/folders/[id]/route.ts
 * @what    Delete and rename endpoints for a single folder
 * @purpose Allow manager/admin to delete empty subfolders or rename them
 * @depends folder.service, folder.schema, api helpers
 * @usedby  FolderTree (delete), future rename UI
 * @rules   Root folders (sectors) cannot be deleted; folder must be empty to delete
 * @layer   api-route
 */
import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { getFolderById, renameFolder, deleteFolder } from "@/services/folder.service";
import { renameFolderSchema } from "@/schemas/folder.schema";
import { ok, err, unauthorized, forbidden, notFound, conflict, fromZodError } from "@/lib/api";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user)               return unauthorized();
  if (session.user.role === "employee") return forbidden();

  try {
    const { id } = await params;
    const folder = await getFolderById(id);

    if (!folder)     return notFound("Pasta");
    if (folder.isRoot) return forbidden("Pastas de setor não podem ser excluídas");
    if (folder._count.files > 0 || folder._count.children > 0) {
      return conflict("A pasta precisa estar vazia para ser excluída");
    }
    if (session.user.role === "manager" && folder.createdById !== session.user.id) {
      return forbidden();
    }

    await deleteFolder(id);
    return ok({ success: true });
  } catch (error: unknown) {
    return err((error as { message?: string }).message ?? "Erro interno", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user)               return unauthorized();
  if (session.user.role === "employee") return forbidden();

  try {
    const { id } = await params;
    const folder = await getFolderById(id);

    if (!folder) return notFound("Pasta");
    if (session.user.role === "manager" && folder.createdById !== session.user.id) {
      return forbidden();
    }

    const validated = renameFolderSchema.parse(await req.json());
    return ok(await renameFolder(id, validated));
  } catch (error: unknown) {
    if (error instanceof ZodError) return fromZodError(error);
    return err((error as { message?: string }).message ?? "Erro interno", 400);
  }
}
