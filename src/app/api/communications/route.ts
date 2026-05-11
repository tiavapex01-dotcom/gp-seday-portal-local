import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/communications?page=1&limit=20&sector=RH
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page     = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit    = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const skip     = (page - 1) * limit;
  const sector   = searchParams.get("sector");

  const baseWhere = {
    published: true,
    OR: [
      { company: session.user.company, sector: null },
      { company: session.user.company, sector: session.user.sector ?? undefined },
      { company: "ALL" },
    ],
  };

  // Filtro adicional por setor, se fornecido
  const where = sector
    ? { ...baseWhere, sector }
    : baseWhere;

  const [communications, total] = await Promise.all([
    prisma.communication.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
      include: { createdBy: { select: { name: true } } },
    }),
    prisma.communication.count({ where }),
  ]);

  return NextResponse.json({
    data: communications,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

// POST /api/communications
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role === "employee") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const { title, content, company, sector, pinned, contactPhone, contactEmail } = body;

  if (!title?.trim() || !content?.trim() || !company || !sector) {
    return NextResponse.json(
      { error: "Título, conteúdo, empresa e setor são obrigatórios" },
      { status: 400 }
    );
  }

  // Validação básica de e-mail de contato se fornecido
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json({ error: "E-mail de contato inválido" }, { status: 400 });
  }

  if (session.user.role === "manager" && company !== session.user.company) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const communication = await prisma.communication.create({
    data: {
      title:        title.trim(),
      content:      content.trim(),
      company,
      sector,
      pinned:       Boolean(pinned),
      contactPhone: contactPhone?.trim() || null,
      contactEmail: contactEmail?.trim() || null,
      createdById:  session.user.id,
    },
  });

  return NextResponse.json(communication, { status: 201 });
}
