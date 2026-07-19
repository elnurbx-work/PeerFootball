import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { loginSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { createAuthPrismaAdapter, ensureUsername } from "@/server/services/auth.service";
import { normalizeEmail, verifyPassword } from "@/server/services/auth.service";

const useSecureCookies = process.env.AUTH_URL?.startsWith("https://") ?? process.env.NODE_ENV === "production";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: createAuthPrismaAdapter(),
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: `${useSecureCookies ? "__Secure-" : ""}fanpitch.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies
      }
    }
  },
  pages: {
    signIn: "/auth/login"
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const result = loginSchema.safeParse(credentials);

        if (!result.success) {
          return null;
        }

        const email = normalizeEmail(result.data.email);
        const user = await prisma.user
          .findUnique({
            where: { email },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              username: true,
              emailVerified: true,
              passwordHash: true,
              isBanned: true
            }
          })
          .catch(() => null);

        if (user?.isBanned || !user?.emailVerified || !(await verifyPassword(result.data.password, user.passwordHash))) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          username: user.username
        };
      }
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email_verified === false) {
        return false;
      }

      if (user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: normalizeEmail(user.email) },
          select: { isBanned: true }
        }).catch(() => null);
        if (existing?.isBanned) return false;
      }

      try {
        if (account?.provider === "google" && user.id) {
          await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() }
          });
        }
      } catch {
        // The adapter may not have created the user row yet for a first Google sign-in.
      }

      try {
        await ensureUsername(user);
      } catch {
        // Missing username can be repaired later; it should not block sign-in.
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        const dbUser = await prisma.user
          .findUnique({
            where: { id: user.id },
            select: { id: true, username: true }
          })
          .catch(() => null);

        token.id = dbUser?.id ?? user.id;
        token.username = dbUser?.username ?? user.username ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.username = token.username;
      }

      return session;
    }
  },
  events: {
    async createUser({ user }) {
      await ensureUsername(user);
    }
  }
});
