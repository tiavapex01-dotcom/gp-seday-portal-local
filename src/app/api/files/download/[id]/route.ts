import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { downloadFile } from "@/services/file.service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const { id }         = await params;
    const { file, data } = await downloadFile(id);

    if (
      session.user.role !== "admin" &&
      file.folder.company !== "ALL" &&
      file.folder.company !== session.user.company
    ) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
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
  } catch (error: unknown) {
    const e = error as { message?: string };
    return NextResponse.json({ error: e.message ?? "Erro interno" }, { status: 500 });
  }
}
