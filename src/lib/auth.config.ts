import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

// Edge-compatible auth config (no database imports)
// Used by middleware for JWT verification
export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // Authorization is handled in the full auth.ts with database access
      authorize: () => null,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const publicRoutes = ["/login", "/register"]
      const isPublicRoute = publicRoutes.includes(nextUrl.pathname)
      const isAuthApiRoute = nextUrl.pathname.startsWith("/api/auth")

      if (isPublicRoute || isAuthApiRoute) {
        return true
      }

      return isLoggedIn
    },
  },
}
