/**
 * @context user.schema.ts
 * @what    Zod schemas for user creation and listing query params
 * @purpose Validate and transform API input before it reaches user.service
 * @depends zod
 * @usedby  api/users/route.ts
 * @rules   sanitizeDigits strips non-digit chars from cpf/phone at schema level
 * @layer   schema
 */
import { z } from "zod";

const sanitizeDigits = (val: string | undefined | null) =>
  val ? val.replace(/\D/g, "") : null;

export const createUserSchema = z.object({
  name:     z.string().min(1, "Nome é obrigatório"),
  email:    z.string().email("E-mail inválido").transform((s) => s.toLowerCase()),
  cpf:      z.string().optional().nullable().transform(sanitizeDigits),
  phone:    z.string().optional().nullable().transform(sanitizeDigits),
  password: z.string().min(6, "Senha mínima de 6 caracteres"),
  role:     z.enum(["admin", "manager", "employee"]),
  company:  z.enum(["AVAPEX", "SEDAY", "INNOMACH"]),
  sector:   z.string().optional().nullable(),
});

export const listUsersSchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export const updateUserSchema = z.object({
  name:     z.string().min(1, "Nome é obrigatório").optional(),
  email:    z.string().email("E-mail inválido").transform((s) => s.toLowerCase()).optional(),
  cpf:      z.string().optional().nullable().transform(sanitizeDigits),
  phone:    z.string().optional().nullable().transform(sanitizeDigits),
  password: z.string().optional(),
  role:     z.enum(["admin", "manager", "employee"]).optional(),
  company:  z.enum(["AVAPEX", "SEDAY", "INNOMACH"]).optional(),
  sector:   z.string().optional().nullable(),
  active:   z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type ListUsersInput  = z.infer<typeof listUsersSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
