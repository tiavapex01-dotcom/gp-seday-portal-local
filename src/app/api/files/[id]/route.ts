import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

// DELETE /api/files/:id — remove arquivo do disco e do banco
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role === "employee") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const file = await prisma.file.findUnique({ where: { id: params.id } });
  if (!file) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  // Admin pode deletar qualquer arquivo; manager só da sua empresa
  if (session.user.role === "manager" && file.company !== session.user.company) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const filePath = path.join(process.cwd(), "public", file.path);
  try {
    await unlink(filePath);
  } catch {
    // Arquivo físico pode já ter sido removido manualmente — continua
  }

  await prisma.file.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
