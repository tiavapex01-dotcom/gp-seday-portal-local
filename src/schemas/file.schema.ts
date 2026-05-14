/**
 * @context file.schema.ts
 * @what    Zod schemas for file upload (folderId + description) and list params
 * @purpose Validate file API input; actual file type/size validation is in file.service.validateFile
 * @depends zod
 * @usedby  api/files/route.ts
 * @rules   MIME/extension validation is in file.service — schema only handles text fields
 * @layer   schema
 */
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
