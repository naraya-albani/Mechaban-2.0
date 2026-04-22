import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/auth/login",
});

export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*"],
};
