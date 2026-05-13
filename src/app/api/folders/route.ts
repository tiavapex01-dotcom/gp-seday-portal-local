import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createFolder, listFolders } from "@/services/folder.service";
import { createFolderSchema } from "@/schemas/folder.schema";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const company = searchParams.get("company") || session.user.company;

  if (session.user.role !== "admin" && company !== session.user.company) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  try {
    return NextResponse.json(await listFolders(company));
  } catch (error: unknown) {
    const e = error as { message?: string };
    return NextResponse.json({ error: e.message ?? "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (session.user.role === "employee") return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  try {
    const body      = await req.json();
    const validated = createFolderSchema.parse(body);

    const folder = await createFolder(validated, session.user.id);

    // Manager can only create in their own company — validated after parent lookup
    if (session.user.role === "manager" && folder.company !== session.user.company) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    return NextResponse.json(folder, { status: 201 });
  } catch (error: unknown) {
    const e = error as { name?: string; errors?: { message: string }[]; message?: string };
    if (e.name === "ZodError") return NextResponse.json({ error: e.errors?.[0]?.message }, { status: 400 });
    return NextResponse.json({ error: e.message ?? "Erro interno" }, { status: 400 });
  }
}
