import type { PolishMode, ClarifyingQuestion, GradeResult, OutputStyle } from "./types";

const API_BASE = "https://polishify.app/api";

export async function polishText(
  text: string,
  style?: OutputStyle
): Promise<{ polishedText: string; detectedMode: PolishMode; grade: GradeResult }> {
  const res = await fetch(`${API_BASE}/rewrite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, style }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `API error (${res.status})`);
  }

  return res.json();
}

export async function getClarifyingQuestions(
  text: string,
  polishedText?: string,
  detectedMode?: PolishMode,
  grade?: GradeResult
): Promise<{ questions: ClarifyingQuestion[] }> {
  const res = await fetch(`${API_BASE}/clarify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      polishedText: polishedText ?? undefined,
      detectedMode: detectedMode ?? undefined,
      grade: grade ?? undefined,
    }),
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
  polishedText?: string,
  grade?: GradeResult
): Promise<{ improvedText: string; grade: GradeResult }> {
  const res = await fetch(`${API_BASE}/improve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      mode,
      answers,
      polishedText: polishedText ?? undefined,
      grade: grade ?? undefined,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `API error (${res.status})`);
  }

  return res.json();
}
