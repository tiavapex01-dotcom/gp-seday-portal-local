export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const VALID_ROLES     = ["admin", "manager", "employee"];
const VALID_COMPANIES = ["AVAPEX", "SEDAY", "INNOMACH"];

// GET /api/users?page=1&limit=20&search=nome
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const skip   = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { name:  { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true,
        company: true, sector: true, active: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    data: users,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

// POST /api/users
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
  if (password.length < 6) {
    return NextResponse.json({ error: "Senha deve ter no mínimo 6 caracteres" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role,
      company,
      sector: sector || null,
    },
    select: { id: true, name: true, email: true, role: true, company: true, sector: true },
  });

  return NextResponse.json(user, { status: 201 });
}
