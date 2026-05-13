import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { createUserSchema, listUsersSchema } from "@/schemas/user.schema";
import { createUser, listUsers } from "@/services/user.service";
import {
  ok, created, unauthorized, forbidden, fromZodError, withErrorHandling,
} from "@/lib/api";

export function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session?.user)                    return unauthorized();
    if (session.user.role !== "admin")     return forbidden();

    const parsed = listUsersSchema.safeParse(
      Object.fromEntries(new URL(req.url).searchParams)
    );
    if (!parsed.success) return fromZodError(parsed.error);

    return ok(await listUsers(parsed.data));
  });
}

export function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const session = await auth();
    if (!session?.user)                    return unauthorized();
    if (session.user.role !== "admin")     return forbidden();

    const parsed = createUserSchema.safeParse(await req.json());
    if (!parsed.success) return fromZodError(parsed.error);

    return created(await createUser(parsed.data));
  });
}
