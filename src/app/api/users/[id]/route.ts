/**
 * @context api/users/[id]/route.ts
 * @what    REST endpoints for single-user operations (get + update)
 * @purpose Allow admin to read and edit individual user accounts
 * @depends user.service (updateUser), user.schema (updateUserSchema), api helpers
 * @usedby  /admin/users/[id]/edit page
 * @rules   Admin-only; no DELETE — deactivate via PATCH { active: false }; params is a Promise (Next.js 15)
 * @layer   api-route
 */
import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateUser } from "@/services/user.service";
import { updateUserSchema } from "@/schemas/user.schema";
import { ok, err, forbidden, notFound, fromZodError } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") return forbidden();

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, cpf: true,
      phone: true, role: true, company: true, sector: true, active: true,
    },
  });
  if (!user) return notFound("Usuário");
  return ok(user);
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") return forbidden();

  const { id } = await params;
  try {
    const validated = updateUserSchema.parse(await req.json());
    return ok(await updateUser(id, validated));
  } catch (error: unknown) {
    if (error instanceof ZodError) return fromZodError(error);
    return err((error as { message?: string }).message ?? "Erro interno", 400);
  }
}
