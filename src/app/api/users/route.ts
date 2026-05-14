/**
 * @context api/users/route.ts
 * @what    REST endpoints for user management (list + create)
 * @purpose Admin-only CRUD gateway to user.service
 * @depends user.service, user.schema, api helpers
 * @usedby  Admin panel (/admin/users/new)
 * @rules   Only admin may call; never return password fields
 * @layer   api-route
 */
import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { createUser, listUsers } from "@/services/user.service";
import { createUserSchema, listUsersSchema } from "@/schemas/user.schema";
import { ok, created, err, forbidden, fromZodError } from "@/lib/api";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") return forbidden();

  try {
    const params = Object.fromEntries(new URL(req.url).searchParams);
    const parsed = listUsersSchema.parse(params);
    return ok(await listUsers(parsed));
  } catch (error: unknown) {
    if (error instanceof ZodError) return fromZodError(error);
    return err((error as { message?: string }).message ?? "Erro interno", 500);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") return forbidden();

  try {
    const validated = createUserSchema.parse(await req.json());
    return created(await createUser(validated));
  } catch (error: unknown) {
    if (error instanceof ZodError) return fromZodError(error);
    return err((error as { message?: string }).message ?? "Erro interno", 400);
  }
}
