import { z } from "zod";

export const uploadFileSchema = z.object({
  folderId:    z.string().min(1, "Pasta é obrigatória"),
  description: z.string().optional().nullable(),
});

export const listFilesSchema = z.object({
  folderId: z.string().min(1, "folderId é obrigatório"),
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type ListFilesInput  = z.infer<typeof listFilesSchema>;
