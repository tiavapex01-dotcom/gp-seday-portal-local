/**
 * @context folder.service.ts
 * @what    Business logic for folder tree — list, create (subfolder + root sector), rename, delete
 * @purpose Centralise all Folder Prisma queries and duplicate-name checks
 * @depends prisma, folder.schema
 * @usedby  api/folders/route.ts, api/folders/[id]/route.ts, files/page.tsx (direct query)
 * @rules   Duplicate checks are case-insensitive; root folders cannot be renamed or deleted via API
 * @layer   service
 */
import { prisma } from "@/lib/prisma";
import { handlePrismaError } from "@/lib/prisma-errors";
import type { CreateFolderInput, CreateRootFolderInput, RenameFolderInput } from "@/schemas/folder.schema";

export async function listFolders(company: string) {
  return prisma.folder.findMany({
    where: { company },
    orderBy: [{ isRoot: "desc" }, { name: "asc" }],
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { files: true, children: true } },
    },
  });
}

export async function createFolder(input: CreateFolderInput, createdById: string) {
  const parent = await prisma.folder.findUnique({ where: { id: input.parentId } });
  if (!parent) throw new Error("Pasta pai não encontrada");

  const duplicate = await prisma.folder.findFirst({
    where: { name: input.name.trim(), parentId: input.parentId, company: parent.company },
  });
  if (duplicate) throw new Error("Já existe uma pasta com esse nome aqui");

  return prisma.folder.create({
    data: {
      name:        input.name.trim(),
      isRoot:      false,
      company:     parent.company,
      parentId:    input.parentId,
      createdById,
    },
  }).catch(handlePrismaError);
}

export async function createRootFolder(input: CreateRootFolderInput, createdById: string) {
  const duplicate = await prisma.folder.findFirst({
    where: {
      name:    { equals: input.name.trim(), mode: "insensitive" },
      company: input.company,
      isRoot:  true,
    },
  });
  if (duplicate) throw new Error("Já existe um setor com esse nome nesta empresa");

  return prisma.folder.create({
    data: {
      name:       input.name.trim(),
      isRoot:     true,
      company:    input.company,
      parentId:   null,
      createdById,
    },
  }).catch(handlePrismaError);
}

export async function getFolderById(id: string) {
  return prisma.folder.findUnique({
    where: { id },
    include: { _count: { select: { files: true, children: true } } },
  });
}

export async function renameFolder(id: string, input: RenameFolderInput) {
  const folder = await prisma.folder.findUnique({ where: { id } });
  if (!folder) throw new Error("Pasta não encontrada");
  if (folder.isRoot) throw new Error("Pastas de setor não podem ser renomeadas");

  // Check duplicate name at same level after rename
  const duplicate = await prisma.folder.findFirst({
    where: {
      name: input.name.trim(),
      parentId: folder.parentId,
      company: folder.company,
      id: { not: id },
    },
  });
  if (duplicate) throw new Error("Já existe uma pasta com esse nome aqui");

  return prisma.folder.update({
    where: { id },
    data: { name: input.name.trim() },
  });
}

export async function deleteFolder(id: string) {
  return prisma.folder.delete({ where: { id } });
}
