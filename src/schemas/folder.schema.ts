import { z } from "zod";

export const createFolderSchema = z.object({
  name:     z.string().min(1, "Nome é obrigatório").max(100),
  parentId: z.string().min(1, "Pasta pai é obrigatória"),
});

export const renameFolderSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
});

export const listFoldersSchema = z.object({
  company: z.enum(["AVAPEX", "SEDAY", "INNOMACH", "ALL"]).optional(),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type RenameFolderInput = z.infer<typeof renameFolderSchema>;
export type ListFoldersInput  = z.infer<typeof listFoldersSchema>;
