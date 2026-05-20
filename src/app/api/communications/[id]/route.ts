/**
 * @context api/communications/[id]/route.ts
 * @what    Delete and patch endpoints for a single communication
 * @purpose Allow manager/admin to delete or toggle pin/publish on a communication
 * @depends communication.service, communication.schema, api helpers
 * @usedby  CommunicationCard (delete, toggle pin)
 * @rules   Manager may only affect communications from their company or created by them
 * @layer   api-route
 */
import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { auth } from "@/auth";
import {
  getCommunicationById,
  deleteCommunication,
  updateCommunication,
} from "@/services/communication.service";
import { updateCommunicationSchema } from "@/schemas/communication.schema";
import { ok, err, unauthorized, forbidden, notFound, fromZodError } from "@/lib/api";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user)               return unauthorized();
  if (session.user.role === "employee") return forbidden();

  try {
    const { id } = await params;
    const comm   = await getCommunicationById(id);
    if (!comm) return notFound("Comunicado");

    if (session.user.role === "manager" && comm.createdById !== session.user.id) {
      return forbidden();
    }

    await deleteCommunication(id);
    return ok({ success: true });
  } catch (error: unknown) {
    return err((error as { message?: string }).message ?? "Erro interno", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user)               return unauthorized();
  if (session.user.role === "employee") return forbidden();

  try {
    const { id } = await params;
    const comm   = await getCommunicationById(id);
    if (!comm) return notFound("Comunicado");

    if (session.user.role === "manager" && comm.createdById !== session.user.id) {
      return forbidden();
    }

    const validated = updateCommunicationSchema.parse(await req.json());
    return ok(await updateCommunication(id, validated));
  } catch (error: unknown) {
    if (error instanceof ZodError) return fromZodError(error);
    return err((error as { message?: string }).message ?? "Erro interno", 500);
  }
}
