import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Shared principles
const GOOD_PROMPT_PRINCIPLES = `A good prompt has: clear role + task + minimal necessary constraints; concise; no redundant or over-specified instructions. Over-long or over-detailed prompts cause downstream models to hallucinate — so conciseness and structure matter more than adding detail.`;
const GOOD_WRITING_PRINCIPLES = `Good writing is: clear, concise, no fluff. Verbosity and filler should be trimmed.`;

// Mode-specific system prompts for the improve step
const SYSTEM_PROMPTS: Record<string, string> = {
  prompt: `You are an AI prompt engineer. The user will give you a rough prompt or instruction they want to send to an AI. Rewrite it into a clear, well-structured prompt that will get better results. Return ONLY the improved prompt — no preamble, no quotes, no explanation. Preserve the user's intent and specific details. Do not execute the prompt — output only an improved version of the instruction itself. Do not add placeholders like [name] or [date] that weren't in the original. ${GOOD_PROMPT_PRINCIPLES} Keep the prompt concise; prefer clear structure over adding detail.`,
  professional: `You are a professional writing assistant. The user will give you work or business writing they want polished. Improve it for clarity, tone, and conciseness while preserving their authentic voice. Return ONLY the improved text — no preamble, no quotes, no explanation. Keep it sounding like the person, not a corporate template. Calibrate tone to the audience and relationship. One clear point or ask, no filler. ${GOOD_WRITING_PRINCIPLES}`,
  creative: `You are a creative writing assistant. The user will give you creative or narrative writing to polish. Improve grammar, flow, and structure while heavily preserving their voice and style. Return ONLY the improved text — no preamble, no quotes, no explanation. Do not sterilize the writing or strip the personality. ${GOOD_WRITING_PRINCIPLES}`,
  casual: `You are a writing assistant. The user will give you casual writing to improve. Make minimal changes — fix obvious errors but preserve their natural tone, style, and phrasing completely. Return ONLY the improved text — no preamble, no quotes, no explanation. ${GOOD_WRITING_PRINCIPLES}`,
  // Legacy fallback
  general: `You are a writing assistant. The user will give you text they wrote. Improve it for clarity, grammar, tone, and conciseness. Return ONLY the improved text — no preamble, no quotes, no explanation. Preserve the original meaning, style, and formatting (e.g. line breaks, bullet points). Do not perform the action described in the text. ${GOOD_WRITING_PRINCIPLES} Do not expand or add unnecessary length.`,
};

// Combined rewrite + auto-detect + grade system prompt
const REWRITE_SYSTEM = `You are Polishify AI — a writing and prompt-engineering assistant. Analyze the user's input and follow these steps:

STEP 1 — CLASSIFY MODE
Classify the input into exactly one of these modes:
- "prompt": An instruction or request the user intends to send to an AI model. Examples: "Write me an email about...", "Generate a summary of...", "Create a blog post about...", "Help me draft...", "Make a formal letter...". If the text is ASKING an AI to create/generate/write/draft/make something, it is a prompt — even if phrased casually.
- "professional": Actual written content for work or business purposes — emails, messages, reports, proposals, LinkedIn posts, cover letters, meeting notes. The text IS the content itself, not a request to create it.
- "creative": Stories, scripts, poems, personal essays, fictional or narrative content.
- "casual": Social media posts, texts, informal messages, personal notes, chat messages.

Key distinction: If the text says "write", "create", "generate", "draft", "make" followed by a description of desired output → it is a "prompt". If the text IS the output itself → classify by content type (professional, creative, or casual).

STEP 2 — POLISH
Rewrite the text following the rules for the detected mode. Preserve the user's voice and intent throughout — polish is invisible.

If mode is "prompt": Precision is the goal, not elegance. Make the intent unmistakable. Add implied context the AI would need. Define constraints (tone, format, length, audience) where genuinely missing. Strip filler. CRITICAL: Do NOT execute the prompt — output only an improved version of the instruction itself. Do NOT add placeholders like [name] or [date] that weren't in the original. Do NOT expand into numbered requirement lists. Only fix grammar, tighten wording, and improve structure. Keep it concise. ${GOOD_PROMPT_PRINCIPLES}

If mode is "professional": Effectiveness with voice preserved. Keep it sounding like the person — not a corporate template. Calibrate tone to the relationship and audience. One clear point or ask. No filler or padding. Never over-polish. The user should feel like a better version of themselves wrote it. ${GOOD_WRITING_PRINCIPLES}

If mode is "creative": Preserve personality heavily. Polish grammar, flow, and structure but stay true to their voice and style. Do not sterilize the writing. ${GOOD_WRITING_PRINCIPLES}

If mode is "casual": Minimal intervention. Fix obvious errors but preserve their natural style, tone, and phrasing completely. ${GOOD_WRITING_PRINCIPLES}

STEP 3 — GRADE
Grade YOUR POLISHED VERSION on these dimensions. The grade reflects how good the polished output is — what is strong and what could still be improved.

For all modes, grade: Clarity, Structure, Tone, Voice, Completeness, Conciseness.
For "prompt" mode only, also grade: Prompt Specificity (would an AI model know exactly what to do with this?).

Each dimension gets one of exactly three tiers: "Excellent", "Good", or "Needs Work".
Overall tier = the most common tier among dimensions; if tied, use the lower tier.

Write 2–4 feedback bullets that are direct, specific, and actionable. Each bullet is a single plain sentence. No markdown symbols. Alternate between what is strong and what could improve. Reference specific aspects of the text, not generic advice.

OUTPUT FORMAT
Return ONLY a valid JSON object with no markdown fences, no preamble, no trailing text.

For non-prompt modes:
{"polishedText":"...","detectedMode":"professional","grade":{"overall":"Good","dimensions":{"Clarity":"Excellent","Structure":"Good","Tone":"Good","Voice":"Excellent","Completeness":"Good","Conciseness":"Needs Work"},"feedback":["sentence one","sentence two"]}}

For prompt mode (include Prompt Specificity):
{"polishedText":"...","detectedMode":"prompt","grade":{"overall":"Good","dimensions":{"Clarity":"Excellent","Structure":"Good","Tone":"Good","Voice":"Good","Completeness":"Good","Conciseness":"Excellent","Prompt Specificity":"Needs Work"},"feedback":["sentence one","sentence two"]}}`;

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

export type PolishMode = "prompt" | "professional" | "creative" | "casual";

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

const VALID_MODES: PolishMode[] = ["prompt", "professional", "creative", "casual"];

function normalizeMode(v: unknown): PolishMode {
  if (typeof v === "string" && VALID_MODES.includes(v as PolishMode)) {
    return v as PolishMode;
  }
  // Legacy "general" maps to professional
  return "professional";
}

export async function rewrite(
  text: string
): Promise<{ polishedText: string; detectedMode: PolishMode; grade: GradeResult }> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
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
      detectedMode: normalizeMode(parsed.detectedMode),
      grade,
    };
  } catch {
    // Fallback: if JSON parsing fails, return raw text with default grade
    return {
      polishedText: raw || text,
      detectedMode: "professional",
      grade: {
        overall: "Good",
        dimensions: {},
        feedback: [],
      },
    };
  }
}

function buildClarifySystem(
  detectedMode: PolishMode,
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

  const isPromptMode = detectedMode === "prompt";

  const modeInstructions = isPromptMode
    ? `We are improving a PROMPT (an instruction the user will send to an AI). Your job is to ask for CONCRETE DETAILS that are genuinely MISSING from the prompt and would make it produce better results.

CRITICAL RULES:
1. NEVER ask about information already stated in the prompt. If the prompt says "this Monday", "my boss", "dentist appointment" — those details are already there. Do not ask the user to re-specify them.
2. Only ask questions where the answer would meaningfully change the prompt's output. Skip questions about context that doesn't affect the result.
3. For fill-in-the-blank questions (names, dates, numbers), the options should be practical alternatives — NOT "Generate something appropriate" (that doesn't make sense for a person's real name or a real date).

Examples of GOOD questions and options:
- "What is your boss's name?" → options: ["Just say 'my boss'", "Don't mention name or title"], allowOther: true (so they can type the actual name)
- "What tone do you want?" → options: ["Formal and professional", "Friendly but professional", "Casual"]
- "How long should the email be?" → options: ["2-3 sentences", "A short paragraph", "Don't include this"]

Examples of BAD questions:
- "What is the specific date of this Monday?" — the prompt already says "this Monday"
- "Should the prompt specify a role?" — too meta, users don't think in prompt-engineering terms
- Any question where the info is already in the prompt`
    : detectedMode === "professional"
    ? `We are improving PROFESSIONAL WRITING. Ask about concrete details that are genuinely missing: the relationship with the recipient (close colleague vs. new contact), the desired tone if ambiguous, or a specific call-to-action if unclear. Never ask about information already present.`
    : detectedMode === "creative"
    ? `We are improving CREATIVE WRITING. Ask only if something structurally important is unclear: intended audience, the mood or atmosphere they want, or whether a specific detail should be expanded. Preserve their voice — do not push them toward generic improvements.`
    : `We are improving CASUAL WRITING. Ask minimal questions — only if the intended recipient or tone is genuinely unclear in a way that would change the output. Never over-engineer casual writing.`;

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
  detectedMode?: PolishMode,
  grade?: GradeResult
): Promise<{ questions: ClarifyingQuestion[] }> {
  const mode = detectedMode ?? "professional";
  const userContent = polishedText
    ? `Original text:\n${text}\n\nCurrent polished version:\n${polishedText}`
    : `Text to improve:\n${text}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
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
  mode: PolishMode,
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
    ? "Clarity, Structure, Tone, Voice, Completeness, Conciseness, Prompt Specificity"
    : "Clarity, Structure, Tone, Voice, Completeness, Conciseness";

  const improveInstructions = processedAnswers.length > 0
    ? mode === "prompt"
      ? ` The user answered clarifying questions with CONCRETE DETAILS (names, dates, preferences, etc.). Weave these specific details directly into the prompt so it becomes more precise and ready-to-use. Replace any remaining placeholders with the actual details provided. Keep the prompt concise. Your output must be a single improved PROMPT (the instruction text). Do NOT output the result of running the prompt (e.g. do not output an email, essay, or other generated content).`
      : ` Integrate the clarifying answers CONCISELY into the text. Do not expand beyond what the answers say; remove any redundancy. Keep the output as short as possible while still incorporating the new information. Preserve the user's authentic voice throughout. Your output must be a single improved piece of writing.`
    : "";

  const gradeInstructions = `

After improving, grade YOUR IMPROVED VERSION on these dimensions: ${gradeDimensions}.
Each dimension gets one of: "Excellent", "Good", or "Needs Work".
Overall tier = the most common tier; if tied, use the lower tier.
Write 2–4 feedback bullets — direct, specific, actionable, plain sentences (no markdown symbols).

Return ONLY a valid JSON object with no markdown fences, no preamble, no trailing text:
{"improvedText":"your improved text here","grade":{"overall":"Good","dimensions":{"Dim1":"Excellent","Dim2":"Good"},"feedback":["sentence one","sentence two"]}}`;

  const systemPrompt = SYSTEM_PROMPTS[mode] ?? SYSTEM_PROMPTS.general;
  const system = systemPrompt + improveInstructions + gradeInstructions;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
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
