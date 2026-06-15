import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ArrowRight,
  PieChart,
  Tags,
  Smartphone,
  LineChart,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Keep landing page visible even if logged in
  // if (user) {
  //   redirect("/dashboard");
  // }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-50 font-sans selection:bg-primary/20 selection:text-primary">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg tracking-tight">SiBoros</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Button asChild size="sm" className="rounded-2xl px-5">
                <Link href="/dashboard">Buka Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors rounded-xl px-6 py-2 bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-900">
                  Masuk
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {/* Hero Section */}
        <section className="pt-24 pb-16 md:pt-32 md:pb-24 px-4 text-center relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-100 via-white to-white dark:from-zinc-900 dark:via-black dark:to-black"></div>
          <div className="container mx-auto max-w-4xl flex flex-col items-center">

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 text-balance leading-tight">
              {/* Catat keuanganmu,<br className="hidden sm:block" /> kuasai masa depanmu. */}
              Ubah Kebiasaan <span className="text-primary">Borosmu</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 text-balance">
              Mulai catat pengeluaran dan kendalikan cashflow kamu sekarang.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 w-full sm:w-auto">
              {user ? (
                <Button asChild size="lg" className="rounded-2xl w-full sm:w-auto text-base h-12 px-8">
                  <Link href="/dashboard">
                    Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="rounded-2xl w-full sm:w-auto text-base h-12 px-8">
                    <Link href="/login">
                      Yuk, Mulai Catat! <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Dashboard Mockup Placeholder */}
          <div className="mt-16 md:mt-24 container mx-auto max-w-5xl px-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            <div className="relative rounded-md md:rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shadow-sm overflow-hidden aspect-[16/9] md:aspect-[21/9] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-100/50 to-transparent dark:from-zinc-900/50"></div>
              <div className="text-center z-10 opacity-60">
                <PieChart className="w-16 h-16 mx-auto mb-4 text-zinc-400" />
                <p className="text-lg font-medium text-zinc-500">Dashboard Preview (Soon)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-32 bg-zinc-50 dark:bg-zinc-900/20 border-y border-zinc-200 dark:border-zinc-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">All-in-One Financial Tracker</h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto text-balance">
                Rekap pengeluaran sampai bikin budget bulanan jadi instan dan responsif.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <FeatureCard
                icon={<Zap className="w-6 h-6 text-yellow-500" />}
                title="Catat Sat-set"
                description="Input pengeluaran cuma butuh hitungan detik. Tinggal foto struk, AI bakal otomatis nyatetin buat kamu."
              />
              <FeatureCard
                icon={<PieChart className="w-6 h-6 text-blue-500" />}
                title="Budgeting Santai"
                description="Atur batas jajan per kategori biar gak boncos. Malas set up? Tinggal copy aja dari budget bulan lalu!"
              />
              <FeatureCard
                icon={<Tags className="w-6 h-6 text-green-500" />}
                title="Kategori Bebas"
                description="Bikin kategori sesukamu pakai 30+ pilihan ikon dan warna yang pas dengan gaya pengeluaranmu."
              />
              <FeatureCard
                icon={<Smartphone className="w-6 h-6 text-purple-500" />}
                title="Instal Tanpa Ribet"
                description="Akses SiBoros langsung dari layar HP layaknya aplikasi biasa tanpa perlu pusing download di App Store."
              />
              <FeatureCard
                icon={<LineChart className="w-6 h-6 text-indigo-500" />}
                title="Pantau Cashflow"
                description="Lihat ke mana perginya duitmu lewat grafik visual yang simpel, transparan, dan gampang dipahami."
              />
              <FeatureCard
                icon={<ShieldCheck className="w-6 h-6 text-rose-500" />}
                title="Aman & Privat"
                description="Data keuanganmu dikunci aman di cloud dengan enkripsi standar enterprise. Privasimu terjaga total."
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-16">3 Langkah Beresin Cashflow</h2>

            <div className="grid md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px bg-gradient-to-r from-zinc-200 via-primary/50 to-zinc-200 dark:from-zinc-800 dark:via-primary/50 dark:to-zinc-800 -z-10"></div>

              <Step
                number="1"
                title="Bikin Akun Instan"
                description="Daftar dalam hitungan detik. Tanpa syarat kartu kredit, langsung masuk tanpa ribet."
              />
              <Step
                number="2"
                title="Catat Pengeluaran"
                description="Tinggal ketik nominal atau scan struk, AI bakal otomatis nyatet buat kamu."
              />
              <Step
                number="3"
                title="Pantau Hasilnya"
                description="Bikin laporan dan dapat insight dari AI biar makin mantap ngatur duitnya."
              />
            </div>
          </div>
        </section>

        {/* Kelebihan & Kekurangan Section */}
        <section className="py-20 px-5 md:py-32 bg-zinc-900 text-zinc-50 dark:bg-zinc-950/80 border-t border-zinc-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-24">

              {/* Sisi Kiri: Kelebihan */}
              <div>
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <CheckCircle2 className="text-green-400 w-6 h-6" /> Mengapa SiBoros?
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2.5 shrink-0"></span>
                    <span className="text-zinc-300 leading-relaxed">UI bersih, sat-set, dan gak ada iklan yang bikin emosi.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2.5 shrink-0"></span>
                    <span className="text-zinc-300 leading-relaxed">Aman dibuka dari mana aja (HP, laptop, atau tablet).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2.5 shrink-0"></span>
                    <span className="text-zinc-300 leading-relaxed">Terbuka banget buat dengerin masukan/request fitur dari kalian.</span>
                  </li>
                </ul>
              </div>

              {/* Sisi Kanan: Roadmap / Apa yang Lagi Dikerjain */}
              <div>
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <AlertCircle className="text-blue-400 w-6 h-6" /> Yang Lagi Dipersiapkan
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0"></span>
                    <span className="text-zinc-300 leading-relaxed">
                      Upgrade Model AI: Bakal pakai AI yang jauh lebih akurat buat baca struk.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0"></span>
                    <span className="text-zinc-300 leading-relaxed">
                      Multi-Wallet: Fitur buat misahin saldo rekening bank, e-wallet, dan uang kas fisik biar gak kecampur.
                    </span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-zinc-400" />
              <span className="font-semibold text-zinc-500">SiBoros</span>
            </div>
            <div className="flex gap-6 text-sm text-zinc-500 font-medium">
              <Link
                href="https://www.threads.com/_kkbwk"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Threads
              </Link>
              <Link
                href="https://www.instagram.com/_kkbwk"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Instagram
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-zinc-400">
            &copy; {new Date().getFullYear()} SiBoros. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Subcomponents

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 md:p-8 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-50 dark:border-zinc-800 shadow-xs hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 tracking-tight">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-balance">
        {description}
      </p>
    </div>
  );
}

function Step({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-center text-xl font-bold text-primary mb-6 z-10">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-3 tracking-tight">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-balance">
        {description}
      </p>
    </div>
  );
}
