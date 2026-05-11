import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";

// GET /api/files/download/:id — autenticado, sem acesso ao sistema de arquivos
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const resolvedParams = await params;

  const file = await prisma.file.findUnique({
    where: { id: resolvedParams.id },
    include: { folder: { select: { company: true } } },
  });

  if (!file) {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }

  if (
    session.user.role !== "admin" &&
    file.folder.company !== "ALL" &&
    file.folder.company !== session.user.company
  ) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .download(file.path);

  if (error || !data) {
    console.error("Supabase download error:", error?.message);
    return NextResponse.json({ error: "Arquivo não encontrado no storage" }, { status: 404 });
  }

  const safeFileName = encodeURIComponent(file.name);

  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type":        file.mimeType,
      "Content-Length":      String(file.size),
      "Content-Disposition": file.mimeType.startsWith("image/") || file.mimeType === "application/pdf"
        ? `inline; filename*=UTF-8''${safeFileName}`
        : `attachment; filename*=UTF-8''${safeFileName}`,
      "Cache-Control":       "no-store",
    },
  });
}
