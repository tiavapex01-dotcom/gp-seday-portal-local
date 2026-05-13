import { prisma } from "@/lib/prisma";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";
import crypto from "crypto";
import type { UploadFileInput, ListFilesInput } from "@/schemas/file.schema";

const MAX_SIZE_MB = 50;

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

export function validateFile(file: File): string | null {
  const ext     = getExt(file.name);
  const allowed = ALLOWED[ext];
  if (!allowed)              return `Extensão "${ext}" não é permitida.`;
  if (!allowed.includes(file.type)) return `Tipo do arquivo (${file.type}) não corresponde à extensão ${ext}.`;
  if (file.size / (1024 * 1024) > MAX_SIZE_MB) return `Arquivo excede ${MAX_SIZE_MB} MB.`;
  return null;
}

export async function listFiles(input: ListFilesInput) {
  const { folderId, page, limit } = input;
  const skip = (page - 1) * limit;

  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) throw new Error("Pasta não encontrada");

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

  return {
    data: files,
    folder,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}

export async function uploadFile(
  file: File,
  input: UploadFileInput,
  uploadedById: string
) {
  const folder = await prisma.folder.findUnique({ where: { id: input.folderId } });
  if (!folder) throw new Error("Pasta não encontrada");

  const ext         = getExt(file.name);
  const storedName  = `${crypto.randomUUID()}${ext}`;
  const storagePath = `${folder.company}/${input.folderId}/${storedName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("Supabase upload error:", uploadError.message);
    throw new Error(`Falha ao armazenar o arquivo: ${uploadError.message}`);
  }

  return prisma.file.create({
    data: {
      name:        file.name,
      storedName,
      path:        storagePath,
      mimeType:    file.type,
      size:        file.size,
      company:     folder.company,
      description: input.description ?? null,
      folderId:    input.folderId,
      uploadedById,
    },
  });
}

export async function getFileById(id: string) {
  return prisma.file.findUnique({
    where: { id },
    include: { folder: { select: { company: true } } },
  });
}

export async function deleteFile(id: string) {
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) throw new Error("Arquivo não encontrado");

  const { error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove([file.path]);

  if (error) console.error("Supabase storage remove error:", error.message);

  await prisma.file.delete({ where: { id } });
}

export async function downloadFile(id: string) {
  const file = await getFileById(id);
  if (!file) throw new Error("Arquivo não encontrado");

  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .download(file.path);

  if (error || !data) {
    console.error("Supabase download error:", error?.message);
    throw new Error("Arquivo não encontrado no storage");
  }

  return { file, data };
}
