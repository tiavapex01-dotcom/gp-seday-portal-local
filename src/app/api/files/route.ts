import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_SIZE_MB = 50;
const ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
];

// GET /api/files?folderId=xxx — lista arquivos de uma pasta
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId");

  if (!folderId) {
    return NextResponse.json({ error: "folderId obrigatório" }, { status: 400 });
  }

  // Verifica se o usuário tem acesso à empresa da pasta
  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) return NextResponse.json({ error: "Pasta não encontrada" }, { status: 404 });

  if (session.user.role !== "admin" && folder.company !== session.user.company && folder.company !== "ALL") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const files = await prisma.file.findMany({
    where: { folderId },
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { id: true, name: true } } },
  });

  return NextResponse.json(files);
}

// POST /api/files — upload de arquivo para uma pasta específica
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role === "employee") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folderId = formData.get("folderId") as string;
  const description = formData.get("description") as string | null;

  if (!file || !folderId) {
    return NextResponse.json({ error: "Arquivo e pasta são obrigatórios" }, { status: 400 });
  }

  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de arquivo não permitido" }, { status: 400 });
  }

  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_SIZE_MB) {
    return NextResponse.json({ error: `Arquivo excede ${MAX_SIZE_MB}MB` }, { status: 400 });
  }

  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) {
    return NextResponse.json({ error: "Pasta não encontrada" }, { status: 404 });
  }

  // Manager só faz upload na sua empresa
  if (session.user.role === "manager" && folder.company !== session.user.company) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const ext = path.extname(file.name);
  const storedName = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, storedName);

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  const record = await prisma.file.create({
    data: {
      name: file.name,
      storedName,
      path: `/uploads/${storedName}`,
      mimeType: file.type,
      size: file.size,
      company: folder.company,
      description: description || null,
      folderId,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
