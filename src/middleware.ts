import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth/signout"];
const PUBLIC_ASSETS = ["/apple-icon.png", "/icon.png", "/favicon.ico"];

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

// 拦截网络请求
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // dev 环境放行所有请求，生产环境才进行权限校验
  // if (process.env.NODE_ENV === "development") {
  //   return NextResponse.next();
  // }

  // 放行公共资源和路径
  if (
    PUBLIC_ASSETS.includes(pathname) ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  // 默认放行的 response
  let response = NextResponse.next({ request: req });

  // 控制反转
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          // 缓存一致性：先设置request中的 cookies，这样*后续*的 调用才能正确读取到最新的 cookies
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value),
          );
          // 然后创建一个新的 response，并将要设置的 cookies 添加到 response 中，这样浏览器才能正确更新 cookies
          response = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 静默刷新：Supabase session 在getSession时自动刷新session，如果过期会自动更新cookie(setAll)，所以不需要担心过期问题。这里隐含着 Supabase token endpoint
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (data.claims.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 总是携带可用的 access token，确保后端 API 请求能够正确认证
  return response;
}
