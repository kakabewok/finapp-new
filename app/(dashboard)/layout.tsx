import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const currentUser = {
    email: user?.email ?? "",
    full_name: user?.user_metadata?.full_name ?? null,
    avatar_url: user?.user_metadata?.avatar_url ?? null,
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Mobile Top Navbar — only visible below lg */}
      <MobileNav currentUser={currentUser} />

      {/* Desktop Sidebar — always visible at lg+ */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <Sidebar currentUser={currentUser} />
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Desktop Header — hidden on mobile since we have the top navbar */}
        <div className="hidden lg:block">
          <Header currentUser={currentUser} />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
