import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/communications — lista comunicados visíveis para o usuário
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const communications = await prisma.communication.findMany({
    where: {
      published: true,
      OR: [
        { company: session.user.company, sector: null },
        { company: session.user.company, sector: session.user.sector ?? undefined },
        { company: "ALL" },
      ],
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { createdBy: { select: { name: true } } },
  });

  return NextResponse.json(communications);
}

// POST /api/communications — cria novo comunicado
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role === "employee") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const { title, content, company, sector, pinned } = body;

  if (!title?.trim() || !content?.trim() || !company) {
    return NextResponse.json({ error: "Título, conteúdo e empresa são obrigatórios" }, { status: 400 });
  }

  // Manager só pode criar comunicados para sua própria empresa
  if (session.user.role === "manager" && company !== session.user.company) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const communication = await prisma.communication.create({
    data: {
      title: title.trim(),
      content: content.trim(),
      company,
      sector: sector || null,
      pinned: Boolean(pinned),
      createdById: session.user.id,
    },
  });

  return NextResponse.json(communication, { status: 201 });
}
