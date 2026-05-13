import { z } from "zod";

export const createCommunicationSchema = z.object({
  title:        z.string().min(1, "Título é obrigatório").max(200),
  content:      z.string().min(1, "Conteúdo é obrigatório"),
  company:      z.enum(["AVAPEX", "SEDAY", "INNOMACH", "ALL"]),
  sector:       z.string().min(1, "Setor é obrigatório"),
  pinned:       z.boolean().optional().default(false),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email("E-mail de contato inválido").optional().nullable()
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
