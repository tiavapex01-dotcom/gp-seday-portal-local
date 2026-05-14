/**
 * @context api/folders/route.ts
 * @what    REST endpoints for folders (list + create subfolder + create root sector)
 * @purpose Manage the folder tree for files; supports both regular subfolders and root sectors
 * @depends folder.service, folder.schema, api helpers
 * @usedby  FilesPage sidebar, UploadPage folder selector, CreateSectorButton, CreateFolderForm
 * @rules   isRoot:true creation requires manager/admin; manager only creates in their company
 * @layer   api-route
 */
import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { createFolder, createRootFolder, listFolders } from "@/services/folder.service";
import { createFolderSchema, createRootFolderSchema } from "@/schemas/folder.schema";
import { ok, created, err, unauthorized, forbidden, fromZodError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  const { searchParams } = new URL(req.url);
  const company = searchParams.get("company") || session.user.company;

  if (session.user.role !== "admin" && company !== session.user.company) {
    return forbidden();
  }

  try {
    return ok(await listFolders(company));
  } catch (error: unknown) {
    return err((error as { message?: string }).message ?? "Erro interno", 500);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user)               return unauthorized();
  if (session.user.role === "employee") return forbidden();

  try {
    const body = await req.json();

    if (body.isRoot === true) {
      const validated = createRootFolderSchema.parse(body);
      if (session.user.role === "manager" && validated.company !== session.user.company) {
        return forbidden();
      }
      return created(await createRootFolder(validated, session.user.id));
    }

    const validated = createFolderSchema.parse(body);
    const folder    = await createFolder(validated, session.user.id);

    if (session.user.role === "manager" && folder.company !== session.user.company) {
      return forbidden();
    }

    return created(folder);
  } catch (error: unknown) {
    if (error instanceof ZodError) return fromZodError(error);
    return err((error as { message?: string }).message ?? "Erro interno", 400);
  }
}
