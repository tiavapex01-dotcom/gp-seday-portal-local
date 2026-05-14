/**
 * @context permissions.ts
 * @what    Constants and predicates for RBAC throughout the app
 * @purpose Single source of truth for roles, companies, and permission checks
 * @depends Nothing (pure constants/functions)
 * @usedby  API routes, middleware, pages, components
 * @rules   Never add Prisma or Next.js imports here — keep it pure
 * @layer   lib
 */

export const ROLES = {
  ADMIN:    "admin",
  MANAGER:  "manager",
  EMPLOYEE: "employee",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const COMPANIES = ["AVAPEX", "SEDAY", "INNOMACH"] as const;
export const COMPANIES_ALL = [...COMPANIES, "ALL"] as const;

export type Company    = (typeof COMPANIES)[number];
export type CompanyAll = (typeof COMPANIES_ALL)[number];

export const canManage = (role: string) => role !== ROLES.EMPLOYEE;
export const isAdmin   = (role: string) => role === ROLES.ADMIN;
export const isManager = (role: string) => role === ROLES.MANAGER;
