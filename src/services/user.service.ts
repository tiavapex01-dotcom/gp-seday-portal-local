import { prisma } from "@/lib/prisma";
import { ConflictError, NotFoundError } from "@/lib/errors";
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

export async function createUser(input: CreateUserInput) {
  // Check uniqueness for all three identifiers in parallel
  const [byEmail, byCpf, byPhone] = await Promise.all([
    prisma.user.findUnique({ where: { email: input.email } }),
    input.cpf   ? prisma.user.findUnique({ where: { cpf:   input.cpf   } }) : null,
    input.phone ? prisma.user.findUnique({ where: { phone: input.phone } }) : null,
  ]);

  if (byEmail) throw new ConflictError("E-mail já cadastrado");
  if (byCpf)   throw new ConflictError("CPF já cadastrado");
  if (byPhone)  throw new ConflictError("Celular já cadastrado");

  return prisma.user.create({
    data: {
      name:     input.name,
      email:    input.email,
      password: await bcrypt.hash(input.password, 12),
      role:     input.role,
      company:  input.company,
      sector:   input.sector ?? null,
      cpf:      input.cpf   ?? null,
      phone:    input.phone ?? null,
    },
    select: {
      id: true, name: true, email: true,
      role: true, company: true, sector: true,
    },
  });
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true,
      company: true, sector: true, active: true, createdAt: true,
    },
  });
  if (!user) throw new NotFoundError("Usuário");
  return user;
}

export async function setUserActive(id: string, active: boolean) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("Usuário");
  return prisma.user.update({ where: { id }, data: { active } });
}
