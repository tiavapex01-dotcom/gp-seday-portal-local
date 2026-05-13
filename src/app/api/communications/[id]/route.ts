import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getCommunicationById,
  deleteCommunication,
  updateCommunication,
} from "@/services/communication.service";
import { updateCommunicationSchema } from "@/schemas/communication.schema";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role === "employee") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  try {
    const { id } = await params;
    const comm   = await getCommunicationById(id);
    if (!comm) return NextResponse.json({ error: "Comunicado não encontrado" }, { status: 404 });

    if (
      session.user.role === "manager" &&
      comm.createdById !== session.user.id &&
      comm.company     !== session.user.company
    ) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    await deleteCommunication(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const e = error as { message?: string };
    return NextResponse.json({ error: e.message ?? "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role === "employee") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  try {
    const { id } = await params;
    const comm   = await getCommunicationById(id);
    if (!comm) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    if (session.user.role === "manager" && comm.createdById !== session.user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const validated = updateCommunicationSchema.parse(await req.json());
    return NextResponse.json(await updateCommunication(id, validated));
  } catch (error: unknown) {
    const e = error as { name?: string; errors?: { message: string }[]; message?: string };
    if (e.name === "ZodError") return NextResponse.json({ error: e.errors?.[0]?.message }, { status: 400 });
    return NextResponse.json({ error: e.message ?? "Erro interno" }, { status: 500 });
  }
}
