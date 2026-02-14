import type { PolishMode, ClarifyingQuestion } from "./types";

const API_BASE = "http://localhost:3000/api";

export async function polishText(
  text: string,
  mode: PolishMode
): Promise<{ improvedText: string }> {
  const res = await fetch(`${API_BASE}/rewrite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, mode }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `API error (${res.status})`);
  }

  return res.json();
}

export async function getClarifyingQuestions(
  text: string,
  polishedText?: string
): Promise<{ questions: ClarifyingQuestion[] }> {
  const res = await fetch(`${API_BASE}/clarify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, polishedText: polishedText ?? undefined }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `API error (${res.status})`);
  }

  return res.json();
}

export async function improveWithContext(
  text: string,
  mode: PolishMode,
  answers: string[],
  polishedText?: string
): Promise<{ improvedText: string }> {
  const res = await fetch(`${API_BASE}/improve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      mode,
      answers,
      polishedText: polishedText ?? undefined,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `API error (${res.status})`);
  }

  return res.json();
}
