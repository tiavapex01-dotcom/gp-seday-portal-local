import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createUser, listUsers } from "@/services/user.service";
import { createUserSchema, listUsersSchema } from "@/schemas/user.schema";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const params = Object.fromEntries(new URL(req.url).searchParams);
    const parsed = listUsersSchema.parse(params);
    return NextResponse.json(await listUsers(parsed));
  } catch (error: unknown) {
    const e = error as { name?: string; errors?: { message: string }[]; message?: string };
    if (e.name === "ZodError") {
      return NextResponse.json({ error: e.errors?.[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message ?? "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validatedData = createUserSchema.parse(body);
    const user = await createUser(validatedData);
    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    const e = error as { name?: string; errors?: { message: string }[]; message?: string };
    if (e.name === "ZodError") {
      return NextResponse.json({ error: e.errors?.[0]?.message ?? "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: e.message ?? "Erro interno" }, { status: 400 });
  }
}
