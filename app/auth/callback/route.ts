import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { seedDefaultCategories } from "@/lib/supabase/seed-categories";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl.clone();
  const code = requestUrl.searchParams.get("code");
  
  const cookieStore = await cookies();
  
  // Try to get next from query params (fallback) or from cookie
  let next = requestUrl.searchParams.get("next");
  if (!next) {
    const nextCookie = cookieStore.get("return_url");
    if (nextCookie?.value) {
      next = decodeURIComponent(nextCookie.value);
    }
  }

  // NextRequest automatically handles forwarded headers if configured, but to be robust against 
  // misconfigured proxies combined with local .env variables in production:
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || (requestUrl.protocol === "http:" ? "http" : "https");
  
  const isLocalhostAppUrl = process.env.NEXT_PUBLIC_APP_URL?.includes("localhost");
  const resolvedOrigin = (isLocalhostAppUrl && host && !host.includes("localhost")) 
    ? `${protocol}://${host}` 
    : (process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin);
  
  const baseUrl = resolvedOrigin;

  if (code) {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await seedDefaultCategories({
          supabase,
          workspaceId: null,
          userId: user.id
        });
      }
      
      const redirectUrl = next ? `${baseUrl}${next}` : `${baseUrl}/dashboard`;
      const response = NextResponse.redirect(redirectUrl);
      
      response.cookies.delete("return_url");
      return response;
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=auth`);
}

