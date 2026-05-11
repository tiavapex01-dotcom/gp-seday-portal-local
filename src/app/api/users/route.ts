import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const VALID_ROLES = ["admin", "manager", "employee"];
const VALID_COMPANIES = ["AVAPEX", "SEDAY", "INNOMACH"];

// GET /api/users — lista todos os usuários (somente admin)
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      company: true,
      sector: true,
      active: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

// POST /api/users — cria novo usuário (somente admin)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, password, role, company, sector } = body;

  if (!name || !email || !password || !role || !company) {
    return NextResponse.json({ error: "Todos os campos obrigatórios devem ser preenchidos" }, { status: 400 });
  }
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Role inválido" }, { status: 400 });
  }
  if (!VALID_COMPANIES.includes(company)) {
    return NextResponse.json({ error: "Empresa inválida" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, password: hashed, role, company, sector: sector || null },
    select: { id: true, name: true, email: true, role: true, company: true, sector: true },
  });

  return NextResponse.json(user, { status: 201 });
}
