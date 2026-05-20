/**
 * @context communication.schema.ts
 * @what    Zod schemas for communication create, update, and list query params
 * @purpose Validate API input for the communications feature
 * @depends zod
 * @usedby  api/communications/route.ts, api/communications/[id]/route.ts
 * @rules   updateCommunicationSchema only allows pinned/published — no content edits via PATCH
 * @layer   schema
 */
import { z } from "zod";

export const createCommunicationSchema = z.object({
  title:        z.string().min(1, "Título é obrigatório").max(200).trim(),
  content:      z.string().min(1, "Conteúdo é obrigatório").max(10000).trim(),
  company:      z.enum(["AVAPEX", "SEDAY", "INNOMACH", "ALL"]),
  sector:       z.string().min(1, "Setor é obrigatório").max(100).trim(),
  pinned:       z.boolean().optional().default(false),
  contactPhone: z.string().max(30).optional().nullable(),
  contactEmail: z.string().email("E-mail de contato inválido").max(255).optional().nullable()
    .or(z.literal("").transform(() => null)),
});

export const updateCommunicationSchema = z.object({
  pinned:    z.boolean().optional(),
  published: z.boolean().optional(),
}).refine((d) => d.pinned !== undefined || d.published !== undefined, {
  message: "Informe pinned ou published",
});

export const listCommunicationsSchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  sector: z.string().optional(),
});

export type CreateCommunicationInput = z.infer<typeof createCommunicationSchema>;
export type UpdateCommunicationInput = z.infer<typeof updateCommunicationSchema>;
export type ListCommunicationsInput  = z.infer<typeof listCommunicationsSchema>;
