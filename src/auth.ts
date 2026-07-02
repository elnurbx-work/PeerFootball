import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { createAuthPrismaAdapter, ensureUsername } from "@/server/services/auth.service";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: createAuthPrismaAdapter(),
  session: { strategy: "database" },
  pages: {
    signIn: "/auth/login"
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET
    })
  ],
  callbacks: {
    async signIn({ user }) {
      await ensureUsername(user);
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.username = user.username;
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
