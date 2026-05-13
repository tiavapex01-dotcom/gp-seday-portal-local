import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { CreateUserInput, ListUsersInput } from "@/schemas/user.schema";

export async function listUsers({ page, limit, search }: ListUsersInput) {
  const skip = (page - 1) * limit;

  const where = search?.trim()
    ? {
        OR: [
          { name:  { contains: search.trim(), mode: "insensitive" as const } },
          { email: { contains: search.trim(), mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true,
        company: true, sector: true, active: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}

export async function createUser(data: CreateUserInput) {
  const { name, email, cpf, phone, password, role, company, sector } = data;

  // Build OR conditions only for fields provided
  const OR_conditions: object[] = [{ email }];
  if (cpf)   OR_conditions.push({ cpf });
  if (phone) OR_conditions.push({ phone });

  const existing = await prisma.user.findFirst({ where: { OR: OR_conditions } });

  if (existing) {
    if (existing.email         === email) throw new Error("E-mail já cadastrado");
    if (cpf   && existing.cpf  === cpf)   throw new Error("CPF já cadastrado");
    if (phone && existing.phone === phone) throw new Error("Celular já cadastrado");
  }

  return prisma.user.create({
    data: {
      name, email, cpf, phone,
      password: await bcrypt.hash(password, 12),
      role, company, sector: sector ?? null,
    },
    select: {
      id: true, name: true, email: true,
      role: true, company: true, sector: true,
    },
  });
}
