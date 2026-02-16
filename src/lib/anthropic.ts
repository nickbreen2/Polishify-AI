import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Shared principles
const GOOD_PROMPT_PRINCIPLES = `A good prompt has: clear role + task + minimal necessary constraints; concise; no redundant or over-specified instructions. Over-long or over-detailed prompts cause downstream models to hallucinate — so conciseness and structure matter more than adding detail.`;
const GOOD_WRITING_PRINCIPLES = `Good writing is: clear, concise, no fluff. Verbosity and filler should be trimmed.`;

// Keep the mode-specific system prompts for the improve step
const SYSTEM_PROMPTS: Record<string, string> = {
  general: `You are a writing assistant. The user will give you text they wrote. Improve it for clarity, grammar, tone, and conciseness. Return ONLY the improved text — no preamble, no quotes, no explanation. Preserve the original meaning, style, and formatting (e.g. line breaks, bullet points). If the text is already excellent, return it unchanged. Only improve the wording of the exact text provided. Do not perform the action or request described in the text (e.g. do not write an email if the text says they need to write an email). ${GOOD_WRITING_PRINCIPLES} Do not expand or add unnecessary length.`,
  prompt: `You are an AI prompt engineer. The user will give you a rough prompt or instruction they want to send to an AI. Rewrite it into a clear, well-structured prompt that will get better results from an AI model. Return ONLY the improved prompt — no preamble, no quotes, no explanation. Preserve the user's intent. Your output must be an improved version of the same prompt or instruction, not the result of carrying out that instruction (e.g. do not generate an email; output a better prompt for generating an email). ${GOOD_PROMPT_PRINCIPLES} Keep the prompt concise; prefer clear structure over adding detail. Add constraints or examples only when clearly missing. Avoid over-specification that could lead to hallucination.`,
};

// Combined rewrite + auto-detect + grade system prompt
const REWRITE_SYSTEM = `You are a writing and prompt-engineering assistant. Analyze the user's text, then follow these steps:

STEP 1 — DETECT MODE
Decide if the text is:
- "prompt": an instruction or request that tells an AI what to create, generate, write, or do. Examples: "Write me an email about...", "Generate a summary of...", "Create a blog post about...", "Help me draft...", "Make a formal letter...". If the text is ASKING for something to be written/created/generated, it is a prompt — even if it reads like a casual request.
- "general": text the user themselves wrote and wants polished (an actual email, message, essay, code comment, note, etc.). The text IS the final content, not a request to create content.

Key distinction: If the text says "write", "create", "generate", "draft", "make" followed by a description of desired output, it is a PROMPT. If the text IS the output itself (e.g. an actual email body, an essay paragraph), it is GENERAL.

STEP 2 — POLISH
Rewrite the text following the rules for the detected mode:

If mode is "prompt": ${GOOD_PROMPT_PRINCIPLES} Return ONLY an improved version of the PROMPT ITSELF — the instruction text. CRITICAL: Do NOT execute the prompt. Do NOT generate the content the prompt asks for. For example, if the user says "Write a formal email to my boss about being absent", your output must be an improved version of that instruction, NOT an actual email. Keep the user's original details and wording intact — just improve clarity, structure, and conciseness. Do NOT add placeholders like [boss's name], [Date], or [recipient] that weren't in the original. Do NOT expand the prompt into numbered requirement lists (e.g. "Include: (1)... (2)... (3)...") — this over-specifies and adds details the user didn't ask for. Only fix grammar, tighten wording, and improve structure. The polish step should be a light touch, not a rewrite.

If mode is "general": ${GOOD_WRITING_PRINCIPLES} Improve for clarity, grammar, tone, and conciseness. Preserve original meaning, style, and formatting (e.g. line breaks, bullet points). Do not perform the action described in the text. Do not expand or add unnecessary length.

STEP 3 — GRADE
Grade YOUR POLISHED VERSION (the rewritten text from Step 2) on the dimensions appropriate to the detected mode. The grade should reflect how good the polished output is — what is strong and what could still be improved further.

For "prompt" mode, grade these 5 dimensions: Clarity, Specificity, Structure, Conciseness, Task Definition.
For "general" mode, grade these 5 dimensions: Grammar, Clarity, Tone, Structure, Word Choice.

Each dimension gets one of exactly three tiers: "Excellent", "Good", or "Needs Work".
Overall tier = the most common tier among the 5 dimensions; if tied, use the lower tier.

Write 2–4 feedback bullets that are direct, specific, and actionable. Each bullet should be a single plain sentence. Do not use markdown symbols. Alternate between what is strong and what could improve. Reference specific aspects of the text, not generic advice.

OUTPUT FORMAT
Return ONLY a valid JSON object with no markdown fences, no preamble, no trailing text:
{"polishedText":"...","detectedMode":"prompt","grade":{"overall":"Good","dimensions":{"Clarity":"Excellent","Specificity":"Good","Structure":"Good","Conciseness":"Excellent","Task Definition":"Needs Work"},"feedback":["sentence one","sentence two"]}}`;

export interface ClarifyingQuestion {
  question: string;
  options: string[];
  allowOther: boolean;
}

export type GradeTier = "Excellent" | "Good" | "Needs Work";

export interface GradeResult {
  overall: GradeTier;
  dimensions: Record<string, GradeTier>;
  feedback: string[];
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();
  return trimmed;
}

const VALID_TIERS: GradeTier[] = ["Excellent", "Good", "Needs Work"];

function normalizeTier(v: unknown): GradeTier {
  if (typeof v === "string" && VALID_TIERS.includes(v as GradeTier)) {
    return v as GradeTier;
  }
  return "Good";
}

export async function rewrite(
  text: string
): Promise<{ polishedText: string; detectedMode: "general" | "prompt"; grade: GradeResult }> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 6000,
    system: REWRITE_SYSTEM,
    messages: [{ role: "user", content: text }],
  });

  const block = message.content[0];
  const raw = block.type === "text" ? block.text : "";

  try {
    const parsed = JSON.parse(extractJson(raw));

    const grade: GradeResult = {
      overall: normalizeTier(parsed.grade?.overall),
      dimensions: Object.fromEntries(
        Object.entries(parsed.grade?.dimensions ?? {}).map(([k, v]) => [k, normalizeTier(v)])
      ),
      feedback: Array.isArray(parsed.grade?.feedback)
        ? parsed.grade.feedback.filter((f: unknown) => typeof f === "string").slice(0, 4)
        : [],
    };

    return {
      polishedText: typeof parsed.polishedText === "string" ? parsed.polishedText : text,
      detectedMode: parsed.detectedMode === "prompt" ? "prompt" : "general",
      grade,
    };
  } catch {
    // Fallback: if JSON parsing fails, return raw text with default grade
    return {
      polishedText: raw || text,
      detectedMode: "general",
      grade: {
        overall: "Good",
        dimensions: {},
        feedback: [],
      },
    };
  }
}

function buildClarifySystem(
  detectedMode: "general" | "prompt",
  grade?: GradeResult
): string {
  const gradeContext = grade
    ? `\nThe text was graded as follows:\nOverall: ${grade.overall}\n` +
      Object.entries(grade.dimensions)
        .map(([dim, tier]) => `${dim}: ${tier}`)
        .join("\n") +
      `\nFeedback:\n${grade.feedback.join("\n")}\n\n` +
      `Focus your questions on dimensions rated "Needs Work" or "Good". Do not ask about dimensions already rated "Excellent".`
    : "";

  const modeInstructions =
    detectedMode === "prompt"
      ? `We are improving a PROMPT (an instruction the user will send to an AI). Your job is to ask for CONCRETE DETAILS that are genuinely MISSING from the prompt and would make it produce better results.

CRITICAL RULES:
1. NEVER ask about information already stated in the prompt. If the prompt says "this Monday", "my boss", "dentist appointment" — those details are already there. Do not ask the user to re-specify them.
2. Only ask questions where the answer would meaningfully change the prompt's output. Skip questions about context that doesn't affect the result (e.g. don't ask about work schedule if it won't change the email).
3. For fill-in-the-blank questions (names, dates, numbers), the options should be practical alternatives — NOT "Generate something appropriate" (that doesn't make sense for a person's real name or a real date).

Examples of GOOD questions and options:
- "What is your boss's name?" → options: ["Just say 'my boss'", "Don't mention name or title"], allowOther: true (so they can type the actual name)
- "What tone do you want?" → options: ["Formal and professional", "Friendly but professional", "Casual"]
- "How long should the email be?" → options: ["2-3 sentences", "A short paragraph", "Don't include this"]

Examples of BAD questions:
- "What is the specific date of this Monday?" — the prompt already says "this Monday", that's clear enough
- "What is your typical work schedule?" — irrelevant, doesn't improve the prompt
- "Should the prompt specify a role?" — too meta, users don't think in prompt-engineering terms
- Any question where the info is already in the prompt`
      : `We are improving GENERAL WRITING. Questions should ask about concrete details that are genuinely MISSING: intended audience, desired tone (formal/casual), or specific context. Never ask about information already present in the text.`;

  return `You suggest targeted clarifying questions to help improve the user's text.

${modeInstructions}

${gradeContext}

Generate 1–3 questions MAX. Only ask questions that will genuinely improve the output. Fewer good questions are better than many mediocre ones. If the text is already clear and complete, return {"questions":[]}.

Each question MUST include 2–3 practical options tailored to the text. For questions where the user needs to type a specific value (like a name), set allowOther: true and make the options be practical alternatives (e.g. "Just say 'my boss'" or "Don't mention this"). Only include "Generate something appropriate" when it actually makes sense (e.g. for creative choices, not for real names or dates). Always include "Don't include this" as the last option.

Set allowOther: true on all questions to allow free text.

Return ONLY valid JSON with no markdown fences:
{"questions":[{"question":"...","options":["option A","option B","Don't include this"],"allowOther":true}]}`;
}

export async function getClarifyingQuestions(
  text: string,
  polishedText?: string,
  detectedMode?: "general" | "prompt",
  grade?: GradeResult
): Promise<{ questions: ClarifyingQuestion[] }> {
  const mode = detectedMode ?? "general";
  const userContent = polishedText
    ? `Original text:\n${text}\n\nCurrent polished version:\n${polishedText}`
    : `Text to improve:\n${text}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2048,
    system: buildClarifySystem(mode, grade),
    messages: [{ role: "user", content: userContent }],
  });

  const block = message.content[0];
  const raw = block.type === "text" ? block.text : "";
  const parsed = JSON.parse(extractJson(raw)) as {
    questions?: Array<{
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
  context: { polishedText?: string; answers: string[]; grade?: GradeResult }
): Promise<{ improvedText: string; grade: GradeResult }> {
  const processedAnswers = context.answers
    .map((a, i) => {
      const trimmed = typeof a === "string" ? a.trim() : "";
      if (!trimmed) return "";
      if (trimmed === "Generate something appropriate") {
        return `${i + 1}. [AI choice: fill in something contextually appropriate]`;
      }
      if (trimmed === "Don't include this") {
        return "";
      }
      return `${i + 1}. ${trimmed}`;
    })
    .filter(Boolean);

  const contextBlock =
    processedAnswers.length > 0
      ? `Clarifying answers (integrate these concisely into the ${mode === "prompt" ? "prompt" : "text"}):\n${processedAnswers.join("\n")}`
      : "";

  const gradeContext = context.grade
    ? `\n\nGrade context (these were the weak areas to specifically address):\n` +
      Object.entries(context.grade.dimensions)
        .filter(([, tier]) => tier !== "Excellent")
        .map(([dim, tier]) => `${dim}: ${tier}`)
        .join("\n")
    : "";

  const optionalCurrent = context.polishedText
    ? `\n\nCurrent polished version (refine using the answers above):\n${context.polishedText}`
    : "";

  const userContent = [text, contextBlock && `\n${contextBlock}`, gradeContext, optionalCurrent]
    .filter(Boolean)
    .join("");

  const gradeDimensions = mode === "prompt"
    ? "Clarity, Specificity, Structure, Conciseness, Task Definition"
    : "Grammar, Clarity, Tone, Structure, Word Choice";

  const improveInstructions = processedAnswers.length > 0
    ? mode === "prompt"
      ? ` The user answered clarifying questions with CONCRETE DETAILS (names, dates, preferences, etc.). Weave these specific details directly into the prompt so it becomes more precise and ready-to-use. For example, if the user said their boss's name is "Sarah" and the date is "March 3rd", the prompt should say "Write an email to Sarah" and mention "March 3rd" — not "[boss's name]" or "[Date]". Replace any remaining placeholders with the actual details provided. Keep the prompt concise. Your output must be a single improved PROMPT (the instruction text). Do NOT output the result of running the prompt (e.g. do not output an email, essay, or other generated content).`
      : ` Integrate the clarifying answers CONCISELY into the text. Do not expand beyond what the answers say; remove any redundancy. Keep the output as short as possible while still incorporating the new information. Your output must be a single improved piece of writing. Do NOT output the result of running any instruction described in the text.`
    : "";

  const gradeInstructions = `

After improving, grade YOUR IMPROVED VERSION on these dimensions: ${gradeDimensions}.
Each dimension gets one of: "Excellent", "Good", or "Needs Work".
Overall tier = the most common tier; if tied, use the lower tier.
Write 2–4 feedback bullets — direct, specific, actionable, plain sentences (no markdown symbols).

Return ONLY a valid JSON object with no markdown fences, no preamble, no trailing text:
{"improvedText":"your improved text here","grade":{"overall":"Good","dimensions":{"Dim1":"Excellent","Dim2":"Good"},"feedback":["sentence one","sentence two"]}}`;

  const system = SYSTEM_PROMPTS[mode] + improveInstructions + gradeInstructions;

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 6000,
    system,
    messages: [{ role: "user", content: userContent }],
  });

  const block = message.content[0];
  const raw = block.type === "text" ? block.text : "";

  try {
    const parsed = JSON.parse(extractJson(raw));

    const grade: GradeResult = {
      overall: normalizeTier(parsed.grade?.overall),
      dimensions: Object.fromEntries(
        Object.entries(parsed.grade?.dimensions ?? {}).map(([k, v]) => [k, normalizeTier(v)])
      ),
      feedback: Array.isArray(parsed.grade?.feedback)
        ? parsed.grade.feedback.filter((f: unknown) => typeof f === "string").slice(0, 4)
        : [],
    };

    return {
      improvedText: typeof parsed.improvedText === "string" ? parsed.improvedText : raw,
      grade,
    };
  } catch {
    return {
      improvedText: raw,
      grade: {
        overall: "Good",
        dimensions: {},
        feedback: [],
      },
    };
  }
}
