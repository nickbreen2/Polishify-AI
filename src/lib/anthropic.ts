import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPTS: Record<string, string> = {
  general: `You are a writing assistant. The user will give you text they wrote. Improve it for clarity, grammar, tone, and conciseness. Return ONLY the improved text — no preamble, no quotes, no explanation. Preserve the original meaning, style, and formatting (e.g. line breaks, bullet points). If the text is already excellent, return it unchanged. Only improve the wording of the exact text provided. Do not perform the action or request described in the text (e.g. do not write an email if the text says they need to write an email).`,
  prompt: `You are an AI prompt engineer. The user will give you a rough prompt or instruction they want to send to an AI. Rewrite it into a clear, well-structured prompt that will get better results from an AI model. Return ONLY the improved prompt — no preamble, no quotes, no explanation. Preserve the user's intent. Your output must be an improved version of the same prompt or instruction, not the result of carrying out that instruction (e.g. do not generate an email; output a better prompt for generating an email).`,
};

export interface ClarifyingQuestion {
  question: string;
  options: string[];
  allowOther: boolean;
}

const CLARIFY_SYSTEM = `You suggest clarifying questions so we can improve the user's PROMPT (the instruction they will send to an AI). The goal is to rewrite a better prompt, not to create the thing the prompt describes.

Ask 1–3 questions that reveal what is MISSING or UNCLEAR in the prompt so we can add or refine instructions in it. Good topics: tone (formal/casual), audience for the output (so the prompt can mention it), desired length or format of the output, any constraints (e.g. brief, include subject line, bullet points).

Do NOT ask about the CONTENT of what the user wants to create (e.g. do not ask "What's your main argument?", "What do you want to say in the email?", or "How do you want to phrase the request?"). Only ask about how the PROMPT should be specified (tone, detail level, output format, audience).

Each question must have 2–4 concise option strings and allowOther: true. Return ONLY a valid JSON object with this exact shape (no markdown, no code fence): {"questions":[{"question":"...","options":["...","..."],"allowOther":true}]}. If no clarifying questions would help, return {"questions":[]}.`;

function extractJson(text: string): string {
  const trimmed = text.trim();
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();
  return trimmed;
}

export async function getClarifyingQuestions(
  text: string,
  polishedText?: string
): Promise<{ questions: ClarifyingQuestion[] }> {
  const userContent = polishedText
    ? `Original prompt:\n${text}\n\nCurrent polished version of the prompt:\n${polishedText}`
    : `Prompt to improve:\n${text}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    system: CLARIFY_SYSTEM,
    messages: [{ role: "user", content: userContent }],
  });

  const block = message.content[0];
  const raw = block.type === "text" ? block.text : "";
  const parsed = JSON.parse(extractJson(raw)) as {
    questions?: Array< {
      question?: string;
      options?: string[];
      allowOther?: boolean;
    }>;
  };
  const questions: ClarifyingQuestion[] = (parsed.questions ?? [])
    .filter(
      (q) =>
        typeof q?.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length >= 2
    )
    .map((q) => ({
      question: q.question!,
      options: q.options!,
      allowOther: q.allowOther !== false,
    }));

  return { questions };
}

export async function improveWithContext(
  text: string,
  mode: "general" | "prompt",
  context: { polishedText?: string; answers: string[] }
): Promise<{ improvedText: string }> {
  const contextBlock =
    context.answers.length > 0
      ? `Clarifying answers (use these only to add or refine instructions IN the prompt):\n${context.answers
          .map((a, i) => `${i + 1}. ${a}`)
          .join("\n")}`
      : "";
  const optionalCurrent = context.polishedText
    ? `\n\nCurrent polished version of the prompt (refine using the answers above):\n${context.polishedText}`
    : "";
  const userContent = [
    text,
    contextBlock && `\n${contextBlock}`,
    optionalCurrent,
  ]
    .filter(Boolean)
    .join("");

  // When we have clarifying answers, always use prompt mode so output is an improved prompt, never the result of running it
  const effectiveMode = context.answers.length > 0 ? "prompt" : mode;
  const system =
    SYSTEM_PROMPTS[effectiveMode] +
    (context.answers.length > 0
      ? " Use the clarifying answers ONLY to add or clarify instructions in the prompt. Your output must be a single improved PROMPT (the instruction text). Do NOT output the result of running the prompt (e.g. do not output an email, essay, or other generated content). Return ONLY the improved prompt."
      : "");

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: userContent }],
  });

  const block = message.content[0];
  const improvedText = block.type === "text" ? block.text : "";

  return { improvedText };
}

export async function rewrite(
  text: string,
  mode: "general" | "prompt"
): Promise<{ improvedText: string }> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system: SYSTEM_PROMPTS[mode],
    messages: [{ role: "user", content: text }],
  });

  const block = message.content[0];
  const improvedText = block.type === "text" ? block.text : "";

  return { improvedText };
}
