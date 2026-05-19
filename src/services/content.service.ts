/**
 * @context services/content.service.ts
 * @what    Lógica de negócio da Central de Conteúdo de marca
 * @purpose Upload, listagem, download rastreado e gestão de conteúdo corporativo
 * @depends prisma, supabase (CONTENT_BUCKET), schemas/content.schema, prisma-errors
 * @usedby  api/content/route.ts, api/content/[id]/route.ts, api/content/[id]/download/route.ts
 *          api/content/categories/route.ts, api/content/stats/route.ts
 * @rules   Bucket 'content' é PRIVADO — downloads sempre via proxy
 *          Sem geração de thumbnail no servidor (Vercel edge não suporta sharp)
 * @layer   service
 */
import { prisma }                            from "@/lib/prisma";
import { supabaseAdmin, CONTENT_BUCKET }     from "@/lib/supabase";
import { handlePrismaError }                 from "@/lib/prisma-errors";
import crypto                                from "crypto";
import type {
  CreateContentInput,
  UpdateContentInput,
  ListContentInput,
  CreateCategoryInput,
} from "@/schemas/content.schema";

// ── File validation ───────────────────────────────────────────────────────────
const MAX_SIZE_MB = 500;

const ALLOWED_MIME: Record<string, string[]> = {
  // images
  ".jpg":  ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png":  ["image/png"],
  ".webp": ["image/webp"],
  ".gif":  ["image/gif"],
  ".svg":  ["image/svg+xml"],
  // videos
  ".mp4":  ["video/mp4"],
  ".mov":  ["video/quicktime"],
  ".avi":  ["video/x-msvideo"],
  ".webm": ["video/webm"],
  // documents / templates
  ".pdf":  ["application/pdf"],
  ".doc":  ["application/msword"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".xls":  ["application/vnd.ms-excel"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ".ppt":  ["application/vnd.ms-powerpoint"],
  ".pptx": ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  // signatures
  ".html": ["text/html"],
  // design files treated as octet-stream
  ".ai":   ["application/postscript", "application/illustrator", "application/octet-stream"],
  ".psd":  ["image/vnd.adobe.photoshop", "application/octet-stream"],
};

function getExt(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx).toLowerCase() : "";
}

export function validateContentFile(file: File): string | null {
  const ext     = getExt(file.name);
  const allowed = ALLOWED_MIME[ext];
  if (!allowed) return `Extensão "${ext}" não é permitida na Central de Conteúdo.`;
  if (!allowed.includes(file.type))
    return `Tipo do arquivo (${file.type}) não corresponde à extensão ${ext}.`;
  if (file.size / (1024 * 1024) > MAX_SIZE_MB)
    return `Arquivo excede ${MAX_SIZE_MB} MB.`;
  return null;
}

// ── Categories ────────────────────────────────────────────────────────────────
export async function listCategories(company?: string) {
  return prisma.contentCategory.findMany({
    where:   company ? { company: { in: [company, "ALL"] } } : undefined,
    orderBy: { order: "asc" },
    include: { _count: { select: { contents: { where: { published: true } } } } },
  });
}

export async function createCategory(input: CreateCategoryInput) {
  return prisma.contentCategory
    .create({ data: input })
    .catch(handlePrismaError);
}

// ── Content listing ───────────────────────────────────────────────────────────
export async function listContent(filters: ListContentInput) {
  const { company, type, categoryId, search, featured, page, limit } = filters;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { published: true };
  if (company)    where.company    = company;
  if (type)       where.type       = type;
  if (categoryId) where.categoryId = categoryId;
  if (featured !== undefined) where.featured = featured;
  if (search) {
    where.OR = [
      { title:       { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.content.findMany({
      where,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
      include: {
        category:   { select: { id: true, name: true, icon: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.content.count({ where }),
  ]);

  return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
}

// ── Single content ────────────────────────────────────────────────────────────
export async function getContentById(id: string) {
  return prisma.content.findUnique({
    where:   { id },
    include: {
      category:   { select: { id: true, name: true, icon: true, company: true } },
      uploadedBy: { select: { id: true, name: true } },
    },
  });
}

// ── Create ────────────────────────────────────────────────────────────────────
export async function createContent(
  file: File,
  input: CreateContentInput,
  uploadedById: string
) {
  const ext         = getExt(file.name);
  const storedName  = `${crypto.randomUUID()}${ext}`;
  const storagePath = `${input.company}/${input.categoryId}/${storedName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabaseAdmin.storage
    .from(CONTENT_BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("Supabase content upload error:", uploadError.message);
    throw new Error(`Falha ao armazenar o arquivo: ${uploadError.message}`);
  }

  return prisma.content
    .create({
      data: {
        title:       input.title.trim(),
        description: input.description?.trim() ?? null,
        type:        input.type,
        company:     input.company,
        tags:        input.tags,
        featured:    input.featured,
        published:   input.published,
        categoryId:  input.categoryId,
        storedName,
        path:        storagePath,
        mimeType:    file.type,
        size:        file.size,
        uploadedById,
      },
    })
    .catch(handlePrismaError);
}

// ── Update ────────────────────────────────────────────────────────────────────
export async function updateContent(id: string, input: UpdateContentInput) {
  const data: Record<string, unknown> = {};
  if (input.title       !== undefined) data.title       = input.title.trim();
  if (input.description !== undefined) data.description = input.description?.trim() ?? null;
  if (input.type        !== undefined) data.type        = input.type;
  if (input.company     !== undefined) data.company     = input.company;
  if (input.categoryId  !== undefined) data.categoryId  = input.categoryId;
  if (input.tags        !== undefined) data.tags        = input.tags;
  if (input.featured    !== undefined) data.featured    = input.featured;
  if (input.published   !== undefined) data.published   = input.published;

  return prisma.content
    .update({ where: { id }, data })
    .catch(handlePrismaError);
}

// ── Delete ────────────────────────────────────────────────────────────────────
export async function deleteContent(id: string) {
  const content = await prisma.content.findUnique({ where: { id } });
  if (!content) throw new Error("Conteúdo não encontrado");

  const { error } = await supabaseAdmin.storage
    .from(CONTENT_BUCKET)
    .remove([content.path]);

  if (error) console.error("Supabase content storage remove error:", error.message);

  await prisma.content.delete({ where: { id } });
}

// ── Download proxy ────────────────────────────────────────────────────────────
export async function downloadContent(id: string) {
  const content = await getContentById(id);
  if (!content) throw new Error("Conteúdo não encontrado");

  const { data, error } = await supabaseAdmin.storage
    .from(CONTENT_BUCKET)
    .download(content.path);

  if (error || !data) {
    console.error("Supabase content download error:", error?.message);
    throw new Error("Arquivo não encontrado no storage");
  }

  return { content, data };
}

// ── Increment download counter ────────────────────────────────────────────────
export async function incrementDownload(id: string) {
  return prisma.content.update({
    where: { id },
    data:  { downloadCount: { increment: 1 } },
  });
}

// ── Stats (admin) ─────────────────────────────────────────────────────────────
export async function getContentStats(company?: string) {
  const where: Record<string, unknown> = {};
  if (company) where.company = company;

  const [byType, byCompany, totalDownloads, topDownloaded, totalItems] = await Promise.all([
    prisma.content.groupBy({
      by:      ["type"],
      where,
      _count:  { id: true },
      _sum:    { size: true },
    }),
    prisma.content.groupBy({
      by:    ["company"],
      _count: { id: true },
      _sum:   { size: true },
    }),
    prisma.content.aggregate({
      where,
      _sum: { downloadCount: true },
    }),
    prisma.content.findMany({
      where,
      orderBy: { downloadCount: "desc" },
      take:    5,
      select: {
        id: true, title: true, type: true, company: true,
        downloadCount: true, mimeType: true,
      },
    }),
    prisma.content.count({ where }),
  ]);

  return {
    totalItems,
    byType,
    byCompany,
    totalDownloads:  totalDownloads._sum.downloadCount ?? 0,
    topDownloaded,
  };
}
