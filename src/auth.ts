import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { UserRole } from "@prisma/client";
import type { Adapter, AdapterUser } from "@auth/core/adapters";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      role: UserRole;
      roles: UserRole[];
      locale: string;
    };
  }
}

/**
 * Wrap PrismaAdapter to remap NextAuth's "image" field to our schema's "avatar" field.
 * The PrismaAdapter expects a User model with an "image" column, but our schema uses "avatar".
 */
function createAdapter(): Adapter {
  const base = PrismaAdapter(db);
  return {
    ...base,
    createUser: async (data: AdapterUser) => {
      const { image, ...rest } = data;
      const user = await db.user.create({
        data: {
          ...rest,
          avatar: image ?? null,
        },
      });
      return { ...user, image: user.avatar } as AdapterUser;
    },
    getUser: async (id: string) => {
      const user = await db.user.findUnique({ where: { id } });
      if (!user) return null;
      return { ...user, image: user.avatar } as AdapterUser;
    },
    getUserByEmail: async (email: string) => {
      const user = await db.user.findUnique({ where: { email } });
      if (!user) return null;
      return { ...user, image: user.avatar } as AdapterUser;
    },
    getUserByAccount: async (providerAccountId) => {
      const account = await db.account.findUnique({
        where: { provider_providerAccountId: providerAccountId },
        include: { user: true },
      });
      if (!account?.user) return null;
      return { ...account.user, image: account.user.avatar } as AdapterUser;
    },
    updateUser: async ({ id, ...data }: Partial<AdapterUser> & { id: string }) => {
      const { image, ...rest } = data;
      const updateData: Record<string, unknown> = { ...rest };
      if (image !== undefined) {
        updateData.avatar = image;
        delete updateData.image;
      }
      const user = await db.user.update({
        where: { id },
        data: updateData,
      });
      return { ...user, image: user.avatar } as AdapterUser;
    },
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: createAdapter(),
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { activeRole: true, roles: true, locale: true },
        });
        token.role = dbUser?.activeRole ?? "CLIENT";
        token.roles = dbUser?.roles ?? ["CLIENT", "DEVELOPER"];
        token.locale = dbUser?.locale ?? "en";
      }
      if (trigger === "update" && session?.activeRole) {
        token.role = session.activeRole as UserRole;
        // Re-read roles from DB in case a new role was just enabled
        const dbUser = await db.user.findUnique({
          where: { id: token.sub! },
          select: { roles: true },
        });
        if (dbUser) token.roles = dbUser.roles;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.roles = (token.roles as UserRole[]) ?? [token.role as UserRole];
        session.user.locale = token.locale as string;
      }
      return session;
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.hashedPassword) return null;

        const valid = await bcrypt.compare(password, user.hashedPassword);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        };
      },
    }),
  ],
});
