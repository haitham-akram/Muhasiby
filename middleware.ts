import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ req, token }) => {
                // Protect all routes except /login and /api/auth
                const pathname = req.nextUrl.pathname;
                if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
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
    matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)"],
};
