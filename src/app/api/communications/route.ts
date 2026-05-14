/**
 * @context api/communications/route.ts
 * @what    REST endpoints for communications (list + create)
 * @purpose Paginated listing and creation of published communications
 * @depends communication.service, communication.schema, api helpers
 * @usedby  CommunicationsPage, NewCommunicationPage
 * @rules   GET is public to all authenticated users; POST requires manager/admin
 * @layer   api-route
 */
import { NextRequest } from "next/server";
import { ZodError, z } from "zod";
import { auth } from "@/auth";
import { createCommunication, listCommunicationsForApi } from "@/services/communication.service";
import { createCommunicationSchema } from "@/schemas/communication.schema";
import { ok, created, err, unauthorized, forbidden, fromZodError } from "@/lib/api";

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
  if (!session?.user) return unauthorized();

  try {
    const params = Object.fromEntries(new URL(req.url).searchParams);
    const input  = querySchema.parse(params);
    return ok(await listCommunicationsForApi(input));
  } catch (error: unknown) {
    if (error instanceof ZodError) return fromZodError(error);
    return err((error as { message?: string }).message ?? "Erro interno", 500);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user)               return unauthorized();
  if (session.user.role === "employee") return forbidden();

  try {
    const validated = createCommunicationSchema.parse(await req.json());

    if (session.user.role === "manager" && validated.company !== session.user.company) {
      return forbidden();
    }

    return created(await createCommunication(validated, session.user.id));
  } catch (error: unknown) {
    if (error instanceof ZodError) return fromZodError(error);
    return err((error as { message?: string }).message ?? "Erro interno", 400);
  }
}
