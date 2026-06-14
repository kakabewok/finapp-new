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
              <Button asChild size="sm" className="rounded-full px-5">
                <Link href="/dashboard">Buka Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
                  Masuk
                </Link>
                <Button asChild size="sm" className="rounded-full px-5">
                  <Link href="/register">Daftar</Link>
                </Button>
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
            <div className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1 text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              Kuasai Keuanganmu Hari Ini
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 text-balance leading-tight">
              Catat keuanganmu,<br className="hidden sm:block" /> kuasai masa depanmu.
            </h1>
            <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 text-balance">
              SiBoros adalah asisten keuangan pribadi yang membantu kamu mencatat pengeluaran, merencanakan budget, dan memahami kebiasaan finansialmu dengan mudah dan aman.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 w-full sm:w-auto">
              {user ? (
                <Button asChild size="lg" className="rounded-full w-full sm:w-auto text-base h-12 px-8">
                  <Link href="/dashboard">
                    Lanjut ke Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="rounded-full w-full sm:w-auto text-base h-12 px-8">
                    <Link href="/register">
                      Mulai Gratis <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full w-full sm:w-auto text-base h-12 px-8">
                    <Link href="/login">Masuk ke Akun</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Dashboard Mockup Placeholder */}
          <div className="mt-16 md:mt-24 container mx-auto max-w-5xl px-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            <div className="relative rounded-xl md:rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shadow-2xl overflow-hidden aspect-[16/9] md:aspect-[21/9] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-100/50 to-transparent dark:from-zinc-900/50"></div>
              <div className="text-center z-10 opacity-60">
                <PieChart className="w-16 h-16 mx-auto mb-4 text-zinc-400" />
                <p className="text-lg font-medium text-zinc-500">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-32 bg-zinc-50 dark:bg-zinc-900/20 border-y border-zinc-200 dark:border-zinc-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Fitur Lengkap & Cerdas</h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto text-balance">
                Semua yang kamu butuhkan untuk mengelola keuangan dalam satu aplikasi yang cepat dan responsif.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              <FeatureCard 
                icon={<Zap className="w-6 h-6 text-yellow-500" />}
                title="Pencatatan Cepat"
                description="Catat pemasukan dan pengeluaran dalam hitungan detik. Tersedia juga fitur scan struk otomatis dengan AI."
              />
              <FeatureCard 
                icon={<PieChart className="w-6 h-6 text-blue-500" />}
                title="Budget Planner"
                description="Buat budget bulanan per kategori dan pantau batas pengeluaranmu. Praktis bisa copy dari bulan lalu!"
              />
              <FeatureCard 
                icon={<Tags className="w-6 h-6 text-green-500" />}
                title="Kategori Kustom"
                description="Buat kategori tak terbatas dengan lebih dari 30+ ikon dan warna pilihan yang menyesuaikan kebutuhanmu."
              />
              <FeatureCard 
                icon={<Smartphone className="w-6 h-6 text-purple-500" />}
                title="Bisa Diinstall (PWA)"
                description="Akses SiBoros layaknya aplikasi native di HP kamu tanpa perlu ribet download dari App Store."
              />
              <FeatureCard 
                icon={<LineChart className="w-6 h-6 text-indigo-500" />}
                title="Insight Keuangan"
                description="Laporan visual yang mudah dipahami untuk menganalisa tren pengeluaran dan laju tabungan bulananmu."
              />
              <FeatureCard 
                icon={<ShieldCheck className="w-6 h-6 text-rose-500" />}
                title="Aman & Privat"
                description="Data kamu tersimpan aman di cloud database dengan enkripsi tingkat tinggi dari infrastruktur kelas enterprise."
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-16">Mudah Digunakan, Tanpa Ribet</h2>
            
            <div className="grid md:grid-cols-3 gap-12 relative">
              <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px bg-gradient-to-r from-zinc-200 via-primary/50 to-zinc-200 dark:from-zinc-800 dark:via-primary/50 dark:to-zinc-800 -z-10"></div>
              
              <Step 
                number="1"
                title="Daftar Gratis"
                description="Buat akun dalam hitungan detik. Tidak perlu kartu kredit atau pengisian data pribadi yang rumit."
              />
              <Step 
                number="2"
                title="Catat Transaksi"
                description="Mulai catat setiap pemasukan dan pengeluaranmu ke dalam kategori yang tepat setiap hari."
              />
              <Step 
                number="3"
                title="Lihat Insight"
                description="SiBoros akan otomatis mengolah datamu menjadi laporan visual yang mempermudah evaluasi."
              />
            </div>
          </div>
        </section>

        {/* Kelebihan & Kekurangan Section */}
        <section className="py-20 md:py-32 bg-zinc-900 text-zinc-50 dark:bg-zinc-950/80 border-t border-zinc-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
              <div>
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <CheckCircle2 className="text-green-400 w-6 h-6" /> Mengapa SiBoros?
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2.5 shrink-0"></span>
                    <span className="text-zinc-300 leading-relaxed">100% Gratis digunakan untuk seluruh fitur pencatatan utama.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2.5 shrink-0"></span>
                    <span className="text-zinc-300 leading-relaxed">Antarmuka sangat bersih, cepat, dan tidak memuat iklan yang mengganggu.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2.5 shrink-0"></span>
                    <span className="text-zinc-300 leading-relaxed">Sangat responsif di semua perangkat (Desktop, Tablet, HP).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2.5 shrink-0"></span>
                    <span className="text-zinc-300 leading-relaxed">Dikembangkan secara aktif dan terbuka terhadap masukan pengguna.</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <AlertCircle className="text-blue-400 w-6 h-6" /> Yang Sedang Dikembangkan
                </h3>
                <p className="text-zinc-400 mb-6 leading-relaxed">
                  Kami jujur, SiBoros masih dalam tahap pertumbuhan. Beberapa fungsionalitas lanjutan masih dalam roadmap kami:
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0"></span>
                    <span className="text-zinc-300 leading-relaxed">Akurasi scan struk menggunakan AI (Gemini) masih terus ditingkatkan agar lebih presisi.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0"></span>
                    <span className="text-zinc-300 leading-relaxed">Integrasi mutasi perbankan otomatis (Coming Soon).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5 shrink-0"></span>
                    <span className="text-zinc-300 leading-relaxed">Fitur export laporan ke PDF dan Excel tingkat lanjut.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Bottom Section */}
        <section className="py-24 md:py-40 text-center">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Mulai Atur Uangmu Sekarang</h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-10 max-w-xl mx-auto">
              Bergabunglah dan ambil kendali penuh atas masa depan finansialmu. Mudah, cepat, dan tanpa biaya tersembunyi.
            </p>
            <Button asChild size="lg" className="rounded-full text-base h-14 px-10 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02]">
              <Link href="/register">
                Mulai Gratis Hari Ini <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
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
              <Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Contact</Link>
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
    <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
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
