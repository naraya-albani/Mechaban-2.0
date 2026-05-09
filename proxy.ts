import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROLE_ROUTES: Record<string, string> = {
  admin: "/admin",
  mechanic: "/mechanic",
  user: "/dashboard",
};

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Ambil role dari app_metadata (bukan user_metadata)
  const role = user.app_metadata?.role ?? "user";
  const allowedPrefix = ROLE_ROUTES[role];

  if (!allowedPrefix) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // Cek apakah akses ke route yang bukan haknya
  const isWrongRoute = Object.values(ROLE_ROUTES).some(
    (prefix) => pathname.startsWith(prefix) && prefix !== allowedPrefix,
  );

  if (isWrongRoute) {
    return NextResponse.redirect(new URL(allowedPrefix, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/mechanic/:path*"],
};
