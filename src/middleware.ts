/**
 * @context middleware.ts
 * @what    Next.js edge middleware for route protection and role-based redirects
 * @purpose Block unauthenticated access to dashboard routes and admin/manager-only paths
 * @depends auth (from next-auth), NextResponse
 * @usedby  Next.js automatically (runs on every matched request)
 * @rules   API routes are excluded from the matcher — they do their own auth checks
 * @layer   lib
 */
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Rotas que exigem autenticação
const PROTECTED_PATHS = ["/dashboard", "/files", "/communications", "/admin", "/content"];
// Rotas exclusivas para admin
const ADMIN_PATHS = ["/admin"];
// Rotas para admin e manager
const MANAGER_PATHS = ["/admin", "/files/upload", "/communications/new"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!session) return NextResponse.next();

  const role = session.user?.role;

  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (isAdminPath && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
  }

  const isManagerPath = MANAGER_PATHS.some((p) => pathname.startsWith(p));
  if (isManagerPath && role === "employee") {
    return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
