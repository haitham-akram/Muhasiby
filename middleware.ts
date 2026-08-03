import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ req, token }) => {
                // Protect all routes except /login, /api/auth, and PWA assets
                const pathname = req.nextUrl.pathname;
                if (pathname.startsWith("/login") || pathname.startsWith("/api/auth") || 
                    pathname === "/manifest.webmanifest" || pathname === "/sw.js" ||
                    pathname.startsWith("/icons/")) {
                    return true; // Always allow these routes
                }
                return !!token; // Require a token for everything else
            },
        },
        pages: {
            signIn: "/login",
        },
    }
);

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api/auth|manifest|sw.js|icons).*)"],
};
