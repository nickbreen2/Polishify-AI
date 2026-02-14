export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-12 px-8 py-20">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Polishify.AI logo" width={48} height={48} />
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Polishify<span className="text-purple-700 dark:text-purple-400">.AI</span>
          </h1>
        </div>

        {/* Tagline */}
        <p className="max-w-md text-center text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Select any text on the web. Polish it with AI. Replace it in-place.
        </p>

        {/* How it works */}
        <div className="grid w-full gap-6 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-2xl">1</span>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Select text
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Highlight any text in a text field on the web.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-2xl">2</span>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Press ⌘⇧O
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Or right-click and choose &ldquo;Polish with AI&rdquo;.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-2xl">3</span>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Replace
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Review the improved text and replace it with one click.
            </p>
          </div>
        </div>

        {/* Modes */}
        <div className="flex w-full flex-col gap-4 sm:flex-row">
          <div className="flex-1 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-2 text-sm font-semibold text-purple-700 dark:text-purple-400">
              General Writing
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Improve clarity, grammar, tone, and conciseness for emails,
              docs, messages, and more.
            </p>
          </div>
          <div className="flex-1 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-2 text-sm font-semibold text-purple-700 dark:text-purple-400">
              Prompt Engineering
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Turn rough instructions into clear, structured prompts that
              get better results from AI models.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-zinc-400">Chrome extension — free &amp; open source</p>
        </div>
      </main>
    </div>
  );
}
