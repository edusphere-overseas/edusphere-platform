import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { portalConfigured, supabaseKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Keeps portal sign-ins fresh (Supabase sessions are short-lived and renewed here,
 * where cookies can be written) and sends signed-out visitors to the sign-in page.
 * Every page and action still checks access itself; this is not the only guard.
 */
export async function proxy(request: NextRequest) {
  if (!portalConfigured) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  if (!signedIn && (pathname === "/portal" || pathname.startsWith("/portal/") || pathname === "/welcome")) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = "";
    url.searchParams.set("next", pathname + search);
    return redirectWith(response, url);
  }
  if (signedIn && (pathname === "/sign-in" || pathname === "/sign-up")) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal";
    url.search = "";
    return redirectWith(response, url);
  }
  return response;
}

/** Redirect while keeping any refreshed session cookies. */
function redirectWith(response: NextResponse, url: URL) {
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  redirect.headers.set("Cache-Control", "private, no-store");
  return redirect;
}

export const config = {
  matcher: ["/portal/:path*", "/welcome", "/sign-in", "/sign-up", "/reset-password", "/auth/:path*"],
};
