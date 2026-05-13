import { z } from "zod/v4";

const ROLES     = ["admin", "manager", "employee"] as const;
const COMPANIES = ["AVAPEX", "SEDAY", "INNOMACH"]  as const;

export const createUserSchema = z.object({
  name:     z.string().min(1, "Nome obrigatório").max(100),
  email:    z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role:     z.enum(ROLES,     { error: "Role inválido" }),
  company:  z.enum(COMPANIES, { error: "Empresa inválida" }),
  sector:   z.string().optional(),
  // Digits-only — formatting is stripped on the client or service layer
  cpf:   z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos").optional(),
  phone: z.string().regex(/^\d{10,11}$/, "Celular deve ter 10 ou 11 dígitos").optional(),
});

export const listUsersSchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type ListUsersInput  = z.infer<typeof listUsersSchema>;
