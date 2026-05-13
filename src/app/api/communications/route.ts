import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createCommunication, listCommunicationsForApi } from "@/services/communication.service";
import { createCommunicationSchema } from "@/schemas/communication.schema";
import { z } from "zod";

const querySchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  pinned: z.enum(["true", "false"]).optional().transform((v) =>
    v === "true" ? true : v === "false" ? false : undefined
  ),
  sector: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const params = Object.fromEntries(new URL(req.url).searchParams);
    const input  = querySchema.parse(params);
    return NextResponse.json(await listCommunicationsForApi(input));
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
    const validated = createCommunicationSchema.parse(await req.json());

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
