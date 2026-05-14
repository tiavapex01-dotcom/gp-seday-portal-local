/**
 * @context communication.service.ts
 * @what    Business logic for communications — CRUD and listing functions
 * @purpose Centralise all Communication Prisma queries
 * @depends prisma, communication.schema
 * @usedby  api/communications/route.ts, api/communications/[id]/route.ts, dashboard/page.tsx, communications/page.tsx
 * @rules   getAllCommunications has NO company filter — all users see all published comms
 * @layer   service
 */
import { prisma } from "@/lib/prisma";
import type {
  CreateCommunicationInput,
  UpdateCommunicationInput,
} from "@/schemas/communication.schema";

const BASE_INCLUDE = { createdBy: { select: { name: true } } } as const;

// All published communications — no company/sector filter
export async function getAllCommunications() {
  return prisma.communication.findMany({
    where:   { published: true },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: BASE_INCLUDE,
  });
}

export async function getPinnedCommunications(limit?: number) {
  return prisma.communication.findMany({
    where:   { published: true, pinned: true },
    orderBy: { createdAt: "desc" },
    ...(limit ? { take: limit } : {}),
    include: BASE_INCLUDE,
  });
}

export async function getRecentCommunications(limit = 10) {
  return prisma.communication.findMany({
    where:   { published: true },
    orderBy: { createdAt: "desc" },
    take:    limit,
    include: BASE_INCLUDE,
  });
}

export async function listCommunicationsForApi(opts: {
  pinned?: boolean;
  page:    number;
  limit:   number;
  sector?: string;
}) {
  const { pinned, page, limit, sector } = opts;
  const skip = (page - 1) * limit;

  const where = {
    published: true,
    ...(pinned  !== undefined && { pinned }),
    ...(sector                && { sector }),
  };

  const [data, total] = await Promise.all([
    prisma.communication.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      skip,
      take:    limit,
      include: BASE_INCLUDE,
    }),
    prisma.communication.count({ where }),
  ]);

  return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
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
