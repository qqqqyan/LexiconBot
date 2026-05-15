import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { type ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ROLE_KEY!;

export const supabaseServer = createClient(supabaseUrl, supabaseKey);

// Per-request auth client — reads/writes session from Next.js cookies
export function createAuthClient(cookieStore: ReadonlyRequestCookies) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              (cookieStore as any).set(name, value, options),
            );
          } catch {
            // Read-only context — session writes handled by middleware
          }
        },
      },
    },
  );
}
