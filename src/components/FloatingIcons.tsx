"use client";

type FloatIcon = {
  name: string;
  cdnSlug?: string;   // set to show logo from SimpleIcons CDN
  file?: string;      // set to show logo from /public/icons/
  animation: string;
  style: React.CSSProperties;
  delay: string;
  duration: string;
};

const ICONS: FloatIcon[] = [
  // Left column
  { name: "ChatGPT",    file: "ChatGPT_Logo_0.svg", animation: "float-a", style: { left: "5%",  top: "8%"  }, delay: "0s",   duration: "5s"   },
  { name: "Cursor",     cdnSlug: "cursor",    animation: "float-b", style: { left: "18%", top: "30%" }, delay: "1.4s", duration: "7s"   },
  { name: "DeepSeek",   file: "deepseek.svg", animation: "float-a", style: { right: "12%", top: "41%" }, delay: "1s",   duration: "6.5s" },
  { name: "Gemini",     file: "gemini.svg",    animation: "float-c", style: { left: "7%",  top: "54%" }, delay: "0.7s", duration: "6s"   },
  { name: "Perplexity", cdnSlug: "perplexity", animation: "float-d", style: { left: "14%", top: "76%" }, delay: "0.3s", duration: "8s"   },
  // Right column
  { name: "Claude",     file: "claude.svg",   animation: "float-b", style: { right: "5%",  top: "8%"  }, delay: "0.5s", duration: "6s"   },
  { name: "Midjourney", file: "midjourney.svg", animation: "float-d", style: { right: "18%", top: "28%" }, delay: "1.1s", duration: "7.5s" },
  { name: "Copilot",    file: "copilot.svg",  animation: "float-a", style: { right: "7%",  top: "54%" }, delay: "0.9s", duration: "5.5s" },
  { name: "Grok",       file: "grok.svg",     animation: "float-c", style: { right: "14%", top: "76%" }, delay: "1.6s", duration: "6.5s" },
];

export function FloatingIcons() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden xl:block">
      {ICONS.map((icon) => (
        <div
          key={icon.name}
          className="absolute flex h-14 w-14 items-center justify-center rounded-2xl border border-white/50 bg-white/25 p-3 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-white/5"
          style={{
            ...icon.style,
            animation: `${icon.animation} ${icon.duration} ease-in-out ${icon.delay} infinite`,
          }}
        >
          {(icon.cdnSlug || icon.file) && (
            <img
              src={icon.cdnSlug ? `https://cdn.simpleicons.org/${icon.cdnSlug}` : `/icons/${icon.file}`}
              alt={icon.name}
              className="h-full w-full object-contain dark:invert"
            />
          )}
        </div>
      ))}
    </div>
  );
}
