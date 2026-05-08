import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Routes exempt from onboarding gates (the gates themselves + auth flows)
const ONBOARDING_EXEMPT = [
  "/verify-age",
  "/onboarding",
  "/welcome",
  "/reset-password",
];

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    if (!token) return; // withAuth handles unauthenticated

    const isExempt = ONBOARDING_EXEMPT.some((p) => pathname.startsWith(p));
    if (isExempt) return;

    // Gate 1: age verification — must complete /verify-age before anything else
    if (!token.ageVerified) {
      return NextResponse.redirect(new URL("/verify-age", req.url));
    }

    // Gate 2: handle picker — must complete /onboarding/handle before reaching the app
    if (!token.handleSet) {
      return NextResponse.redirect(new URL("/onboarding/handle", req.url));
    }
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

export const config = {
  matcher: [
    "/home/:path*",
    "/profile/:path*",
    "/search/:path*",
    "/whiskey/:path*",
    "/review/:path*",
    "/post/:path*",
    "/recipe/:path*",
    "/welcome/:path*",
    "/welcome",
    "/rick/:path*",
    "/rick",
    "/more",
    "/preferences/:path*",
    "/settings/:path*",
    "/reset-password",
    "/verify-age",
    "/onboarding/:path*",
  ],
};
