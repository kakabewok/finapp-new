import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { seedDefaultCategories } from "@/lib/supabase/seed-categories";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;

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
      // Redirect to the 'next' URL if provided, otherwise to dashboard
      const redirectUrl = next ? `${baseUrl}${next}` : `${baseUrl}/dashboard`;
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Redirect to login page with an error if code exchange failed or no code is present
  return NextResponse.redirect(`${baseUrl}/login?error=auth`);
}

