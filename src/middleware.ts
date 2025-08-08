import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Custom logic can be added here if needed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

// Protect specific routes
export const config = {
  matcher: [
    // Protect dashboard (root)
    "/((?!login|about|api/auth|api/webhooks|_next/static|_next/image|favicon.ico).*)",
    // Protect research detail pages
    "/research/:path*",
  ],
};