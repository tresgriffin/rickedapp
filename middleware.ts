import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

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
  ],
};
