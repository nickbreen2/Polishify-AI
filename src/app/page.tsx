import { Navbar } from "@/components/Navbar";
import { PolishDemo } from "@/components/PolishDemo";

const EXTENSION_URL = "#"; // TODO: replace with Chrome Web Store URL when published

function CheckIcon({ brand }: { brand?: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 ${brand ? "text-brand" : "text-zinc-400"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <Navbar />

      {/* Spacer for fixed nav */}
      <div className="h-[57px]" />

      <main className="flex flex-col items-center px-8">

        {/* Hero + Demo */}
        <section id="polish" className="flex w-full max-w-2xl flex-col items-center gap-8 pb-24 pt-20">
          <div className="flex flex-col items-center gap-4 text-center">
            <h1 className="text-5xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-white">
              Polish it<br />Before you send it.
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-zinc-500 dark:text-zinc-400">
              Select any text on the web. Polish it with AI.<br />Replace it in-place.
            </p>
          </div>
          <PolishDemo />
        </section>

        {/* How it works */}
        <section className="w-full max-w-3xl pb-20">
          <h2 className="mb-10 text-center text-xs font-semibold uppercase tracking-widest text-zinc-400">
            How it works
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light dark:bg-brand-dark">
                <svg className="h-5 w-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">1. Select text</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Highlight any text in a text field on the web.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light dark:bg-brand-dark">
                <span className="text-sm font-bold text-brand">⌘I</span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">2. Press ⌘I</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Or right-click and choose &ldquo;Polish with AI&rdquo;.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-light dark:bg-brand-dark">
                <svg className="h-5 w-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">3. Replace</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Review the improved text and replace it with one click.
              </p>
            </div>
          </div>
        </section>

        {/* What you can polish */}
        <section id="templates" className="w-full max-w-3xl pb-20">
          <h2 className="mb-10 text-center text-xs font-semibold uppercase tracking-widest text-zinc-400">
            What you can polish
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* General Writing */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light dark:bg-brand-dark">
                  <svg className="h-5 w-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">General Writing</h3>
              </div>
              <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                Improve the clarity, grammar, tone, and conciseness of anything you write — before you hit send.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Emails", "Slack messages", "Docs", "LinkedIn posts", "Tweets"].map((tag) => (
                  <span key={tag} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Prompt Engineering */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light dark:bg-brand-dark">
                  <svg className="h-5 w-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Prompt Engineering</h3>
              </div>
              <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                Turn rough AI instructions into clear, structured prompts that get you better results every time.
              </p>
              <div className="flex flex-wrap gap-2">
                {["ChatGPT", "Claude", "Gemini", "Midjourney", "Cursor"].map((tag) => (
                  <span key={tag} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-400 dark:border-zinc-800">
        Chrome extension — free &amp; open source
      </footer>
    </div>
  );
}
