import { prisma } from "@/lib/prisma";
import type {
  CreateCommunicationInput,
  UpdateCommunicationInput,
  ListCommunicationsInput,
} from "@/schemas/communication.schema";

export async function listCommunications(
  input: ListCommunicationsInput,
  userCompany: string,
  userSector: string | null
) {
  const { page, limit, sector } = input;
  const skip = (page - 1) * limit;

  const baseWhere = {
    published: true,
    OR: [
      { company: userCompany, sector: null },
      { company: userCompany, sector: userSector ?? undefined },
      { company: "ALL" },
    ],
  };

  const where = sector ? { ...baseWhere, sector } : baseWhere;

  const [communications, total] = await Promise.all([
    prisma.communication.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
      include: { createdBy: { select: { name: true } } },
    }),
    prisma.communication.count({ where }),
  ]);

  return {
    data: communications,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}

export async function createCommunication(
  input: CreateCommunicationInput,
  createdById: string
) {
  return prisma.communication.create({
    data: {
      title:        input.title.trim(),
      content:      input.content.trim(),
      company:      input.company,
      sector:       input.sector,
      pinned:       input.pinned ?? false,
      contactPhone: input.contactPhone?.trim() || null,
      contactEmail: input.contactEmail?.trim() || null,
      createdById,
    },
  });
}

export async function getCommunicationById(id: string) {
  return prisma.communication.findUnique({ where: { id } });
}

export async function updateCommunication(id: string, data: UpdateCommunicationInput) {
  return prisma.communication.update({
    where: { id },
    data: {
      ...(data.pinned    !== undefined && { pinned:    data.pinned }),
      ...(data.published !== undefined && { published: data.published }),
    },
  });
}

export async function deleteCommunication(id: string) {
  return prisma.communication.delete({ where: { id } });
}
