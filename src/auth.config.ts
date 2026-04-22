import type { NextAuthConfig } from "next-auth"

const PUBLIC_PATHS = new Set<string>(["/login", "/admin/register"])

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const pathname = nextUrl.pathname

            if (
                pathname.startsWith("/api/auth") ||
                pathname.startsWith("/_next") ||
                pathname === "/favicon.ico"
            ) {
                return true
            }

            if (PUBLIC_PATHS.has(pathname)) {
                if (isLoggedIn && pathname === "/login") {
                    return Response.redirect(new URL("/", nextUrl))
                }
                if (isLoggedIn && pathname === "/admin/register") {
                    return Response.redirect(new URL("/", nextUrl))
                }
                return true
            }

            if (!isLoggedIn) {
                return false
            }

            return true
        },
    },
    providers: [],
} satisfies NextAuthConfig
