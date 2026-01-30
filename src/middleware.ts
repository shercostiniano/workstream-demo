import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

// Use Edge-compatible auth config for middleware
export const { auth: middleware } = NextAuth(authConfig)

export default middleware

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
