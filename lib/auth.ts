import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // TODO: Add FacebookProvider when FACEBOOK_CLIENT_ID/SECRET are configured
    // TODO: Add AppleProvider when APPLE_CLIENT_ID/SECRET are configured
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user?.hashedPassword) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName ?? user.name,
          image: user.avatarUrl ?? user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }
      // Refresh onboarding flags on sign-in or explicit session update
      if (user || trigger === "update") {
        const userId = (token.id as string | undefined) ?? user?.id;
        if (userId) {
          const dbUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { dateOfBirth: true, hasPickedHandle: true },
          });
          token.ageVerified = !!dbUser?.dateOfBirth;
          token.handleSet = !!dbUser?.hasPickedHandle;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.ageVerified = token.ageVerified as boolean | undefined;
      }
      return session;
    },
  },
};
