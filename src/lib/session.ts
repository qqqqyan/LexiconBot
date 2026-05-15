"use server";

import { cookies } from "next/headers";
import { createAuthClient } from "@/lib/supabase";
import { AppError } from "@/lib/errors";
import { DOMAIN_ERRORS } from "@/lib/constants/domain-errors";

export async function getSessionUserId(): Promise<string> {
  const cookieStore = await cookies();
  const supabase = createAuthClient(cookieStore);
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data) {
    throw new AppError("Unauthorized", DOMAIN_ERRORS.AUTH_UNAUTHORIZED);
  }

  return data.claims.sub;
}
