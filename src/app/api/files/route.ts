import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

// ─── Pasta FORA de /public — inacessível diretamente pelo browser ───────────
export const UPLOAD_DIR = path.join(process.cwd(), "private_uploads");

const MAX_SIZE_MB = 50;

// Mapa de extensões permitidas → MIME types aceitos
// A validação dupla (extensão + MIME) evita spoofing de Content-Type
const ALLOWED: Record<string, string[]> = {
  ".pdf":  ["application/pdf"],
  ".doc":  ["application/msword"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".xls":  ["application/vnd.ms-excel"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ".ppt":  ["application/vnd.ms-powerpoint"],
  ".pptx": ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  ".jpg":  ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png":  ["image/png"],
  ".webp": ["image/webp"],
  ".txt":  ["text/plain"],
};

function validateFile(file: File): string | null {
  const ext = path.extname(file.name).toLowerCase();
  const allowed = ALLOWED[ext];
  if (!allowed) return `Extensão "${ext}" não é permitida.`;
  if (!allowed.includes(file.type)) return `O tipo do arquivo (${file.type}) não corresponde à extensão ${ext}.`;
  if (file.size / (1024 * 1024) > MAX_SIZE_MB) return `Arquivo excede ${MAX_SIZE_MB} MB.`;
  return null;
}

// GET /api/files?folderId=xxx&page=1&limit=20
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId");
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const skip  = (page - 1) * limit;

  if (!folderId) {
    return NextResponse.json({ error: "folderId obrigatório" }, { status: 400 });
  }

  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) return NextResponse.json({ error: "Pasta não encontrada" }, { status: 404 });

  if (session.user.role !== "admin" && folder.company !== session.user.company && folder.company !== "ALL") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const [files, total] = await Promise.all([
    prisma.file.findMany({
      where: { folderId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { uploadedBy: { select: { id: true, name: true } } },
    }),
    prisma.file.count({ where: { folderId } }),
  ]);

  return NextResponse.json({
    data: files,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}

// POST /api/files — upload para pasta privada
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
  const folderId    = formData.get("folderId")    as string;
  const description = formData.get("description") as string | null;

  if (!file || !folderId) {
    return NextResponse.json({ error: "Arquivo e pasta são obrigatórios" }, { status: 400 });
  }

  // Validação dupla: extensão + MIME
  const validationError = validateFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) {
    return NextResponse.json({ error: "Pasta não encontrada" }, { status: 404 });
  }

  if (session.user.role === "manager" && folder.company !== session.user.company) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const ext = path.extname(file.name).toLowerCase();
  const storedName = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, storedName);

  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  const record = await prisma.file.create({
    data: {
      name: file.name,
      storedName,
      path: storedName, // guarda apenas o nome, não o caminho público
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
