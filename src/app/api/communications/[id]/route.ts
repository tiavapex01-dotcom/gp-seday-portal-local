import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/communications/:id
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

  const communication = await prisma.communication.findUnique({
    where: { id: params.id },
  });

  if (!communication) {
    return NextResponse.json({ error: "Comunicado não encontrado" }, { status: 404 });
  }

  // Manager só exclui comunicados da sua empresa ou que ele mesmo criou
  if (
    session.user.role === "manager" &&
    communication.createdById !== session.user.id &&
    communication.company !== session.user.company
  ) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await prisma.communication.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

// PATCH /api/communications/:id — toggle publicado/pinned
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role === "employee") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const communication = await prisma.communication.findUnique({
    where: { id: params.id },
  });
  if (!communication) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  if (
    session.user.role === "manager" &&
    communication.createdById !== session.user.id
  ) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.communication.update({
    where: { id: params.id },
    data: {
      ...(typeof body.pinned === "boolean" && { pinned: body.pinned }),
      ...(typeof body.published === "boolean" && { published: body.published }),
    },
  });

  return NextResponse.json(updated);
}
