/**
 * @context user.service.ts
 * @what    Business logic for user listing and creation
 * @purpose Centralise all user Prisma calls and uniqueness validation
 * @depends prisma, bcryptjs, user.schema
 * @usedby  api/users/route.ts
 * @rules   Never return password hash; hash cost is 12; email/cpf/phone uniqueness checked together
 * @layer   service
 */
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { handlePrismaError } from "@/lib/prisma-errors";
import type { CreateUserInput, ListUsersInput, UpdateUserInput } from "@/schemas/user.schema";

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
  }).catch(handlePrismaError);
}

export async function updateUser(id: string, data: UpdateUserInput) {
  const checks: object[] = [];
  if (data.email) checks.push({ email: data.email });
  if (data.cpf)   checks.push({ cpf: data.cpf });
  if (data.phone) checks.push({ phone: data.phone });

  if (checks.length > 0) {
    const conflict = await prisma.user.findFirst({
      where: { id: { not: id }, OR: checks },
    });
    if (conflict) {
      if (data.email && conflict.email === data.email) throw new Error("E-mail já cadastrado para outro usuário");
      if (data.cpf   && conflict.cpf   === data.cpf)   throw new Error("CPF já cadastrado para outro usuário");
      if (data.phone && conflict.phone === data.phone) throw new Error("Telefone já cadastrado para outro usuário");
    }
  }

  if (data.password && data.password.trim().length > 0 && data.password.trim().length < 6) {
    throw new Error("Senha deve ter no mínimo 6 caracteres");
  }

  const passwordHash =
    data.password && data.password.trim().length >= 6
      ? await bcrypt.hash(data.password, 12)
      : undefined;

  return prisma.user.update({
    where: { id },
    data: {
      ...(data.name    !== undefined && { name: data.name }),
      ...(data.email   !== undefined && { email: data.email }),
      ...(data.cpf     !== undefined && { cpf: data.cpf }),
      ...(data.phone   !== undefined && { phone: data.phone }),
      ...(data.role    !== undefined && { role: data.role }),
      ...(data.company !== undefined && { company: data.company }),
      ...(data.sector  !== undefined && { sector: data.sector }),
      ...(data.active  !== undefined && { active: data.active }),
      ...(passwordHash !== undefined && { password: passwordHash }),
    },
    select: {
      id: true, name: true, email: true, cpf: true,
      phone: true, role: true, company: true, sector: true, active: true,
    },
  }).catch(handlePrismaError);
}
