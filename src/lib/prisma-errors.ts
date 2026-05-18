/**
 * @context prisma-errors.ts
 * @what    Prisma error translator — converts known PrismaClientKnownRequestError codes to user-friendly messages
 * @purpose Avoid exposing raw Prisma internals; catch race-condition constraint violations missed by pre-checks
 * @depends @prisma/client
 * @usedby  services/*.ts — wrap Prisma calls in try/catch and pass to handlePrismaError
 * @rules   Always re-throws; never swallows. Returns `never` so TypeScript knows the function always throws.
 * @layer   lib
 */
import { Prisma } from "@prisma/client";

export function handlePrismaError(e: unknown): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    const field = (e.meta?.target as string[] | undefined)?.join(", ") ?? "campo";
    switch (e.code) {
      case "P2002": throw new Error(`${field} já está em uso`);
      case "P2025": throw new Error("Registro não encontrado");
      case "P2003": throw new Error("Referência de chave estrangeira inválida");
      default:      throw new Error(`Erro no banco de dados: ${e.code}`);
    }
  }
  throw e;
}
