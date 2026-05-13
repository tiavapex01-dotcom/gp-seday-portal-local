import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      company: string;
      sector: string | null;
    } & DefaultSession["user"];
  }
  interface User {
    role: string;
    company: string;
    sector: string | null;
  }
}

// Sanitizes a raw login identifier to a digit-only string (for CPF/phone lookups)
function sanitizeDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        identifier: { label: "E-mail, CPF ou Celular", type: "text" },
        password:   { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const raw      = (credentials?.identifier as string | undefined)?.trim() ?? "";
        const password = (credentials?.password  as string | undefined) ?? "";

        if (!raw || !password) return null;

        const digits = sanitizeDigits(raw);
        const isEmail = raw.includes("@");

        // Single query — try email, CPF and phone simultaneously
        const user = await prisma.user.findFirst({
          where: isEmail
            ? { email: raw.toLowerCase() }
            : { OR: [{ cpf: digits }, { phone: digits }] },
        });

        if (!user || !user.active) return null;

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

        return {
          id:      user.id,
          name:    user.name,
          email:   user.email,
          role:    user.role,
          company: user.company,
          sector:  user.sector,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id      = user.id;
        token.role    = user.role;
        token.company = user.company;
        token.sector  = user.sector;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id      = token.id      as string;
        session.user.role    = token.role    as string;
        session.user.company = token.company as string;
        session.user.sector  = token.sector  as string | null;
      }
      return session;
    },
  },
});
