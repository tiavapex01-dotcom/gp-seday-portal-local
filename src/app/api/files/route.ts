import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listFiles, uploadFile, validateFile } from "@/services/file.service";
import { uploadFileSchema, listFilesSchema } from "@/schemas/file.schema";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const params  = Object.fromEntries(new URL(req.url).searchParams);
    const input   = listFilesSchema.parse(params);
    const result  = await listFiles(input);

    if (
      session.user.role !== "admin" &&
      result.folder.company !== "ALL" &&
      result.folder.company !== session.user.company
    ) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    return NextResponse.json({ data: result.data, meta: result.meta });
  } catch (error: unknown) {
    const e = error as { name?: string; errors?: { message: string }[]; message?: string };
    if (e.name === "ZodError") return NextResponse.json({ error: e.errors?.[0]?.message }, { status: 400 });
    return NextResponse.json({ error: e.message ?? "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role === "employee") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  try {
    const formData    = await req.formData();
    const file        = formData.get("file") as File | null;
    const folderId    = formData.get("folderId") as string | null;
    const description = formData.get("description") as string | null;

    if (!file) return NextResponse.json({ error: "Arquivo é obrigatório" }, { status: 400 });

    const validationError = validateFile(file);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const input   = uploadFileSchema.parse({ folderId, description });
    const record  = await uploadFile(file, input, session.user.id);

    return NextResponse.json(record, { status: 201 });
  } catch (error: unknown) {
    const e = error as { name?: string; errors?: { message: string }[]; message?: string };
    if (e.name === "ZodError") return NextResponse.json({ error: e.errors?.[0]?.message }, { status: 400 });
    return NextResponse.json({ error: e.message ?? "Erro interno" }, { status: 400 });
  }
}
