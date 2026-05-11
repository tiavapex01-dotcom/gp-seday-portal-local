import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createReadStream, existsSync } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { UPLOAD_DIR } from "../../route";

// GET /api/files/download/:id
// Rota autenticada — lê o arquivo da pasta privada e o envia ao browser
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const file = await prisma.file.findUnique({
    where: { id: params.id },
    include: { folder: { select: { company: true } } },
  });

  if (!file) {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }

  // Verifica permissão: usuário deve ser da mesma empresa ou admin
  if (
    session.user.role !== "admin" &&
    file.folder.company !== "ALL" &&
    file.folder.company !== session.user.company
  ) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const filePath = path.join(UPLOAD_DIR, file.path);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Arquivo não encontrado no servidor" }, { status: 404 });
  }

  // Previne path traversal: confirma que o caminho resolvido está dentro de UPLOAD_DIR
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(path.resolve(UPLOAD_DIR))) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { size } = await stat(filePath);

  // Converte ReadStream do Node em ReadableStream web para o NextResponse
  const nodeStream = createReadStream(filePath);
  const webStream = new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => controller.enqueue(chunk));
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });

  const safeFileName = encodeURIComponent(file.name);

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(size),
      // inline para PDFs e imagens; attachment para o resto
      "Content-Disposition": file.mimeType.startsWith("image/") || file.mimeType === "application/pdf"
        ? `inline; filename*=UTF-8''${safeFileName}`
        : `attachment; filename*=UTF-8''${safeFileName}`,
      // Sem cache no browser — documento corporativo privado
      "Cache-Control": "no-store",
    },
  });
}
