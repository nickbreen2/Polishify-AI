import { Navbar } from "@/components/Navbar";
import { PolishDemo } from "@/components/PolishDemo";
import { FloatingIcons } from "@/components/FloatingIcons";


export default function Home() {
  return (
    <div className="relative bg-zinc-50 font-sans">
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
                <div className="flex items-center gap-2 rounded-full border border-white/50 bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-600 shadow-[0_2px_16px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-xl">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-heartbeat absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  AI-Powered Refinement
                </div>

                <h1 className="text-3xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-5xl">
                  Polish it<br />Before you send it.
                </h1>
                <p className="max-w-md text-base leading-relaxed text-zinc-500 sm:text-lg">
                  Select any text on the web, polish it with AI, and replace it in-place.
                </p>
              </div>
              <PolishDemo />

              {/* Chrome Extension Coming Soon */}
              <div className="flex items-center gap-2.5 rounded-full border border-zinc-200/80 bg-white/60 px-5 py-2.5 text-sm text-zinc-500 shadow-[0_2px_12px_rgba(0,0,0,0.06)] backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-zinc-400" fill="currentColor" aria-hidden="true">
                  <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364zM12 10.545A1.455 1.455 0 1 0 12 13.456a1.455 1.455 0 0 0 0-2.91z" />
                </svg>
                <span>Chrome Extension — <span className="font-medium text-zinc-600">Coming Soon</span></span>
              </div>
            </div>
          </section>

        </main>

        {/* Footer */}
        <footer className="w-full border-t border-zinc-200">
          <div className="flex w-full flex-col items-center gap-4 px-4 py-4 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span className="text-center sm:text-left">Built by the Polishify team — free &amp; open source</span>
            <a
              href="https://github.com/nickbreen2/Polishify-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_1px_4px_rgba(0,0,0,0.08)] sm:w-auto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="h-5 w-5 shrink-0"
                aria-hidden="true"
                fill="currentColor"
              >
                <title>GitHub</title>
                <path
                  fillRule="evenodd"
                  d="M12 0c6.63 0 12 5.276 12 11.79-.001 5.067-3.29 9.567-8.175 11.187-.6.118-.825-.25-.825-.56 0-.398.015-1.665.015-3.242 0-1.105-.375-1.813-.81-2.181 2.67-.295 5.475-1.297 5.475-5.822 0-1.297-.465-2.344-1.23-3.169.12-.295.54-1.503-.12-3.125 0 0-1.005-.324-3.3 1.209a11.32 11.32 0 00-3-.398c-1.02 0-2.04.133-3 .398-2.295-1.518-3.3-1.209-3.3-1.209-.66 1.622-.24 2.83-.12 3.125-.765.825-1.23 1.887-1.23 3.169 0 4.51 2.79 5.527 5.46 5.822-.345.294-.66.81-.765 1.577-.69.31-2.415.81-3.495-.973-.225-.354-.9-1.223-1.845-1.209-1.005.015-.405.56.015.781.51.28 1.095 1.327 1.23 1.666.24.663 1.02 1.93 4.035 1.385 0 .988.015 1.916.015 2.196 0 .31-.225.664-.825.56C3.303 21.374-.003 16.867 0 11.791 0 5.276 5.37 0 12 0z"
                />
              </svg>
              Contribute on GitHub
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
