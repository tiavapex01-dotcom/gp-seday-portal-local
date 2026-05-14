/**
 * @context folder.schema.ts
 * @what    Zod schemas for subfolder creation, root sector creation, rename, and list params
 * @purpose Validate folder API input; createFolderSchema requires parentId; createRootFolderSchema requires company
 * @depends zod
 * @usedby  api/folders/route.ts, api/folders/[id]/route.ts
 * @rules   Root and subfolder schemas are intentionally separate — never merge them
 * @layer   schema
 */
import { z } from "zod";

export const createFolderSchema = z.object({
  name:     z.string().min(1, "Nome é obrigatório").max(100),
  parentId: z.string().min(1, "Pasta pai é obrigatória"),
});

export const createRootFolderSchema = z.object({
  name:    z.string().min(1, "Nome é obrigatório").max(100),
  company: z.enum(["AVAPEX", "SEDAY", "INNOMACH"]),
  isRoot:  z.literal(true),
});

export const renameFolderSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
});

export const listFoldersSchema = z.object({
  company: z.enum(["AVAPEX", "SEDAY", "INNOMACH", "ALL"]).optional(),
});

export type CreateFolderInput     = z.infer<typeof createFolderSchema>;
export type CreateRootFolderInput = z.infer<typeof createRootFolderSchema>;
export type RenameFolderInput     = z.infer<typeof renameFolderSchema>;
export type ListFoldersInput      = z.infer<typeof listFoldersSchema>;
