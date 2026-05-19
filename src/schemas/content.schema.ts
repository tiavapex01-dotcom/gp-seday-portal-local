/**
 * @context schemas/content.schema.ts
 * @what    Schemas Zod para validação da Central de Conteúdo
 * @purpose Validar inputs de criação, atualização e listagem de conteúdo de marca
 * @depends zod, permissions (COMPANIES)
 * @usedby  api/content/route.ts, api/content/[id]/route.ts, api/content/categories/route.ts
 * @rules   MIME/size validation is done in content.service — schema handles metadata only
 * @layer   schema
 */
import { z } from "zod";
import { COMPANIES } from "@/lib/permissions";

export const CONTENT_TYPES = [
  "image",
  "video",
  "document",
  "template",
  "signature",
  "social",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

// ── Content CRUD ──────────────────────────────────────────────────────────────
export const createContentSchema = z.object({
  title:       z.string().min(2, "Título obrigatório (mínimo 2 caracteres)"),
  description: z.string().optional(),
  type:        z.enum(CONTENT_TYPES),
  company:     z.enum(COMPANIES),
  categoryId:  z.string().min(1, "Categoria obrigatória"),
  tags:        z.array(z.string()).default([]),
  featured:    z.boolean().default(false),
  published:   z.boolean().default(true),
});

export const updateContentSchema = createContentSchema.partial();

// ── Category ──────────────────────────────────────────────────────────────────
export const createCategorySchema = z.object({
  name:        z.string().min(2, "Nome obrigatório"),
  slug:        z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
  description: z.string().optional(),
  icon:        z.string().optional(),
  order:       z.number().int().default(0),
  company:     z.enum(COMPANIES),
});

// ── Listing filters ───────────────────────────────────────────────────────────
export const listContentSchema = z.object({
  company:    z.enum(COMPANIES).optional(),
  type:       z.enum(CONTENT_TYPES).optional(),
  categoryId: z.string().optional(),
  search:     z.string().optional(),
  featured:   z.coerce.boolean().optional(),
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateContentInput  = z.infer<typeof createContentSchema>;
export type UpdateContentInput  = z.infer<typeof updateContentSchema>;
export type ListContentInput    = z.infer<typeof listContentSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
