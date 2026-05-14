/**
 * @context api/files/[id]/route.ts
 * @what    Delete endpoint for a single file
 * @purpose Remove a file record from DB and its blob from Supabase Storage
 * @depends file.service, api helpers
 * @usedby  FileCard (delete button)
 * @rules   Manager can only delete files in their own company
 * @layer   api-route
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getFileById, deleteFile } from "@/services/file.service";
import { ok, err, unauthorized, forbidden, notFound } from "@/lib/api";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user)               return unauthorized();
  if (session.user.role === "employee") return forbidden();

  try {
    const { id } = await params;
    const file   = await getFileById(id);

    if (!file) return notFound("Arquivo");

    if (session.user.role === "manager" && file.folder.company !== session.user.company) {
      return forbidden();
    }

    await deleteFile(id);
    return ok({ success: true });
  } catch (error: unknown) {
    return err((error as { message?: string }).message ?? "Erro interno", 500);
  }
}
