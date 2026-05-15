import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAuthClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  // origin for redirect to ?
  const { searchParams, origin } = new URL(request.url);
  console.log(
    "Received auth callback with search params:",
    searchParams.toString(),
  );
  console.log("Origin:", origin);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  // cookies from ?
  const cookieStore = await cookies();
  const supabase = createAuthClient(cookieStore);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  return NextResponse.redirect(origin);
}
