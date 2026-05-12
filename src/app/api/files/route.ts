export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";
import crypto from "crypto";

const MAX_SIZE_MB = 50;

// Validação dupla: extensão → MIME types aceitos
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

function getExt(filename: string) {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx).toLowerCase() : "";
}

function validateFile(file: File): string | null {
  const ext = getExt(file.name);
  const allowed = ALLOWED[ext];
  if (!allowed) return `Extensão "${ext}" não é permitida.`;
  if (!allowed.includes(file.type)) return `Tipo do arquivo (${file.type}) não corresponde à extensão ${ext}.`;
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

  if (
    session.user.role !== "admin" &&
    folder.company !== "ALL" &&
    folder.company !== session.user.company
  ) {
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

// POST /api/files — faz upload para o Supabase Storage (sem fs local)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role === "employee") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const formData   = await req.formData();
  const file       = formData.get("file")        as File | null;
  const folderId   = formData.get("folderId")    as string;
  const description = formData.get("description") as string | null;

  if (!file || !folderId) {
    return NextResponse.json({ error: "Arquivo e pasta são obrigatórios" }, { status: 400 });
  }

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

  const ext        = getExt(file.name);
  const storedName = `${crypto.randomUUID()}${ext}`;
  const storagePath = `${folder.company}/${folderId}/${storedName}`;

  // Envia para o Supabase Storage
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Supabase upload error:", uploadError.message);
    return NextResponse.json({ error: "Falha ao armazenar o arquivo." }, { status: 500 });
  }

  const record = await prisma.file.create({
    data: {
      name:        file.name,
      storedName,
      path:        storagePath, // caminho no bucket do Supabase
      mimeType:    file.type,
      size:        file.size,
      company:     folder.company,
      description: description || null,
      folderId,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
