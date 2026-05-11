import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/folders?company=SEDAY
// Retorna árvore de pastas visíveis para o usuário (pastas raiz + subpastas)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const company = searchParams.get("company") || session.user.company;

  // Admin pode ver qualquer empresa; outros só a sua
  if (session.user.role !== "admin" && company !== session.user.company) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const folders = await prisma.folder.findMany({
    where: { company },
    orderBy: [{ isRoot: "desc" }, { name: "asc" }],
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { files: true, children: true } },
    },
  });

  return NextResponse.json(folders);
}

// POST /api/folders — cria subpasta (nunca pasta raiz via API)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role === "employee") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const { name, parentId } = body as { name: string; parentId: string };

  if (!name?.trim() || !parentId) {
    return NextResponse.json({ error: "Nome e pasta pai são obrigatórios" }, { status: 400 });
  }

  const parent = await prisma.folder.findUnique({ where: { id: parentId } });
  if (!parent) {
    return NextResponse.json({ error: "Pasta pai não encontrada" }, { status: 404 });
  }

  // Manager só cria pastas na sua empresa
  if (session.user.role === "manager" && parent.company !== session.user.company) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  // Impede duplicata de nome no mesmo nível
  const duplicate = await prisma.folder.findFirst({
    where: { name: name.trim(), parentId, company: parent.company },
  });
  if (duplicate) {
    return NextResponse.json({ error: "Já existe uma pasta com esse nome aqui" }, { status: 409 });
  }

  const folder = await prisma.folder.create({
    data: {
      name: name.trim(),
      isRoot: false,
      company: parent.company,
      parentId,
      createdById: session.user.id,
    },
  });

  return NextResponse.json(folder, { status: 201 });
}
