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
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        const rawIdentifier = credentials.identifier as string;
        const isEmail = rawIdentifier.includes("@");
        const digitsOnly = rawIdentifier.replace(/\D/g, "");

        const user = await prisma.user.findFirst({
          where: isEmail
            ? { email: rawIdentifier.toLowerCase() }
            : { OR: [{ cpf: digitsOnly }, { phone: digitsOnly }] },
        });

        if (!user || !user.active) return null;

        const passwordMatch = await bcrypt.compare(credentials.password as string, user.password);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company,
          sector: user.sector,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.company = user.company;
        token.sector = user.sector;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.company = token.company as string;
        session.user.sector = token.sector as string | null;
      }
      return session;
    },
  },
});
