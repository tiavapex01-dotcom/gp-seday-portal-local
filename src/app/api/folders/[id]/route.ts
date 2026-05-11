import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/folders/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role === "employee") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const resolvedParams = await params;

  const folder = await prisma.folder.findUnique({
    where: { id: resolvedParams.id },
    include: {
      _count: { select: { files: true, children: true } },
    },
  });

  if (!folder) {
    return NextResponse.json({ error: "Pasta não encontrada" }, { status: 404 });
  }
  if (folder.isRoot) {
    return NextResponse.json({ error: "Pastas de setor não podem ser excluídas" }, { status: 403 });
  }
  if (folder._count.files > 0 || folder._count.children > 0) {
    return NextResponse.json(
      { error: "A pasta precisa estar vazia (sem arquivos e sem subpastas) para ser excluída" },
      { status: 409 }
    );
  }

  if (
    session.user.role === "manager" &&
    folder.createdById !== session.user.id
  ) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await prisma.folder.delete({ where: { id: resolvedParams.id } });
  return NextResponse.json({ success: true });
}

// PATCH /api/folders/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role === "employee") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const resolvedParams = await params;

  const folder = await prisma.folder.findUnique({ where: { id: resolvedParams.id } });
  if (!folder) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
  if (folder.isRoot) return NextResponse.json({ error: "Pastas de setor não podem ser renomeadas" }, { status: 403 });

  if (session.user.role === "manager" && folder.createdById !== session.user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome inválido" }, { status: 400 });

  const updated = await prisma.folder.update({
    where: { id: resolvedParams.id },
    data: { name: name.trim() },
  });

  return NextResponse.json(updated);
}