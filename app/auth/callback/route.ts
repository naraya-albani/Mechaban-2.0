import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ROLE_REDIRECT: Record<string, string> = {
  admin: "/admin",
  mechanic: "/mechanic",
  user: "/dashboard",
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) return NextResponse.redirect(`${origin}/error`);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) return NextResponse.redirect(`${origin}/error`);

  // Ambil role dari tabel profiles
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.app_metadata?.role ?? "user";
  const redirectTo = ROLE_REDIRECT[role] ?? "/dashboard";

  return NextResponse.redirect(`${origin}${redirectTo}`);
}
