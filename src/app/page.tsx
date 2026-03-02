import { Navbar } from "@/components/Navbar";
import { PolishDemo } from "@/components/PolishDemo";
import { FloatingIcons } from "@/components/FloatingIcons";


export default function Home() {
  return (
    <div className="relative bg-zinc-50 font-sans dark:bg-black">
      {/* Grid background */}
      <div className="bg-grid pointer-events-none absolute inset-0" />

      {/* All content in a single z-[1] wrapper — guarantees it's above the grid */}
      <div className="relative z-[1] flex min-h-screen flex-col">
        <Navbar />

        {/* Spacer for fixed nav */}
        <div className="h-[57px]" />

        <main className="flex flex-1 flex-col items-center px-8">

          {/* Hero + Demo */}
          <section id="polish" className="relative flex w-full flex-col items-center gap-8 pb-24 pt-10 sm:pt-20">
            <FloatingIcons />

            {/* Content constrained to max-w-2xl, above floating icons */}
            <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-8">
              <div className="flex flex-col items-center gap-4 text-center">
                {/* Badge */}
                <div className="flex items-center gap-2 rounded-full border border-white/50 bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-600 shadow-[0_2px_16px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-xl dark:border-white/15 dark:bg-white/8 dark:text-zinc-300 dark:shadow-[0_2px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-heartbeat absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  AI-Powered Refinement
                </div>

                <h1 className="text-3xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
                  Polish it<br />Before you send it.
                </h1>
                <p className="max-w-md text-base leading-relaxed text-zinc-500 dark:text-zinc-400 sm:text-lg">
                  Select any text on the web, polish it with AI, and replace it in-place.
                </p>
              </div>
              <PolishDemo />
            </div>
          </section>

        </main>

        {/* Footer */}
        <footer className="w-full border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto max-w-2xl px-8 py-8 text-center text-sm text-zinc-400">
            Chrome extension — free &amp; open source
          </div>
        </footer>
      </div>
    </div>
  );
}
