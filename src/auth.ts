import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const rows = await sql`
          SELECT id, email, password FROM users WHERE email = ${credentials.email as string}
        `;

        const user = rows[0];
        if (!user) return null;

        // Only attempt password comparison for users with a real bcrypt hash.
        if (
          !user.password ||
          typeof user.password !== "string" ||
          !user.password.startsWith("$2")
        ) {
          return null;
        }

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password as string
        );
        if (!valid) return null;

        return { id: String(user.id), email: user.email as string };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/" },
});
