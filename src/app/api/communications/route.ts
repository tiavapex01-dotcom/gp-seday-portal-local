import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createCommunication, listCommunications } from "@/services/communication.service";
import { createCommunicationSchema, listCommunicationsSchema } from "@/schemas/communication.schema";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const params = Object.fromEntries(new URL(req.url).searchParams);
    const input  = listCommunicationsSchema.parse(params);
    return NextResponse.json(
      await listCommunications(input, session.user.company, session.user.sector)
    );
  } catch (error: unknown) {
    const e = error as { name?: string; errors?: { message: string }[]; message?: string };
    if (e.name === "ZodError") return NextResponse.json({ error: e.errors?.[0]?.message }, { status: 400 });
    return NextResponse.json({ error: e.message ?? "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role === "employee") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  try {
    const body      = await req.json();
    const validated = createCommunicationSchema.parse(body);

    if (session.user.role === "manager" && validated.company !== session.user.company) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    return NextResponse.json(
      await createCommunication(validated, session.user.id),
      { status: 201 }
    );
  } catch (error: unknown) {
    const e = error as { name?: string; errors?: { message: string }[]; message?: string };
    if (e.name === "ZodError") return NextResponse.json({ error: e.errors?.[0]?.message }, { status: 400 });
    return NextResponse.json({ error: e.message ?? "Erro interno" }, { status: 400 });
  }
}
