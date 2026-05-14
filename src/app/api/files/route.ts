/**
 * @context api/files/route.ts
 * @what    REST endpoints for files (list + upload)
 * @purpose List files in a folder and handle multipart upload to Supabase Storage
 * @depends file.service, file.schema, api helpers
 * @usedby  FilesPage, UploadPage
 * @rules   Upload goes to Supabase private bucket — never expose storagePath to the client
 * @layer   api-route
 */
import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { listFiles, uploadFile, validateFile } from "@/services/file.service";
import { uploadFileSchema, listFilesSchema } from "@/schemas/file.schema";
import { ok, created, err, unauthorized, forbidden, fromZodError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return unauthorized();

  try {
    const params  = Object.fromEntries(new URL(req.url).searchParams);
    const input   = listFilesSchema.parse(params);
    const result  = await listFiles(input);

    if (
      session.user.role !== "admin" &&
      result.folder.company !== "ALL" &&
      result.folder.company !== session.user.company
    ) {
      return forbidden();
    }

    return ok({ data: result.data, meta: result.meta });
  } catch (error: unknown) {
    if (error instanceof ZodError) return fromZodError(error);
    return err((error as { message?: string }).message ?? "Erro interno", 500);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user)               return unauthorized();
  if (session.user.role === "employee") return forbidden();

  try {
    const formData    = await req.formData();
    const file        = formData.get("file") as File | null;
    const folderId    = formData.get("folderId") as string | null;
    const description = formData.get("description") as string | null;

    if (!file) return err("Arquivo é obrigatório", 400);

    const validationError = validateFile(file);
    if (validationError) return err(validationError, 400);

    const input  = uploadFileSchema.parse({ folderId, description });
    const record = await uploadFile(file, input, session.user.id);

    return created(record);
  } catch (error: unknown) {
    if (error instanceof ZodError) return fromZodError(error);
    return err((error as { message?: string }).message ?? "Erro interno", 400);
  }
}
