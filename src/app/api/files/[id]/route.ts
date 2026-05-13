import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFileById, deleteFile } from "@/services/file.service";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role === "employee") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  try {
    const { id } = await params;
    const file   = await getFileById(id);

    if (!file) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    if (session.user.role === "manager" && file.folder.company !== session.user.company) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    await deleteFile(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const e = error as { message?: string };
    return NextResponse.json({ error: e.message ?? "Erro interno" }, { status: 500 });
  }
}
