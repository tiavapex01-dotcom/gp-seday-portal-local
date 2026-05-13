import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createFolder, createRootFolder, listFolders } from "@/services/folder.service";
import { createFolderSchema, createRootFolderSchema } from "@/schemas/folder.schema";

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
    const body = await req.json();

    if (body.isRoot === true) {
      const validated = createRootFolderSchema.parse(body);
      if (session.user.role === "manager" && validated.company !== session.user.company) {
        return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
      }
      const folder = await createRootFolder(validated, session.user.id);
      return NextResponse.json(folder, { status: 201 });
    }

    const validated = createFolderSchema.parse(body);
    const folder    = await createFolder(validated, session.user.id);

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
