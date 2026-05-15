import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAuthClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createAuthClient(cookieStore);
  await supabase.auth.signOut();

  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`);
}
