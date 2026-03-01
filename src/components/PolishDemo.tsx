"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuthModal } from "./AuthModalContext";

type OutputStyle = "Detailed" | "Concise" | "Structured" | "Creative";
const OUTPUT_STYLES: OutputStyle[] = ["Detailed", "Concise", "Structured", "Creative"];

interface GradeResult {
  overall: string;
  dimensions: Record<string, string>;
  feedback: string[];
}

interface ClarifyingQuestion {
  question: string;
  options: string[];
  allowOther: boolean;
}

function StyleDropdown({
  value,
  onChange,
  disabled,
}: {
  value: OutputStyle;
  onChange: (v: OutputStyle) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 py-1.5 pl-3 pr-2.5 rounded-md border border-gray-200 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {value}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={`text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1.5 bg-white rounded-lg border border-gray-200 shadow-lg z-50 overflow-hidden min-w-[110px]">
          {OUTPUT_STYLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { onChange(s); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                s === value
                  ? "bg-[#f0f3ff] text-[#456BFF]"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const FREE_TRIAL_KEY = "polishly_free_used";

export function PolishDemo() {
  const [input, setInput] = useState("");
  const [style, setStyle] = useState<OutputStyle>("Detailed");
  const [result, setResult] = useState<string | null>(null);
  const [detectedMode, setDetectedMode] = useState<string | null>(null);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [freeUsed, setFreeUsed] = useState(false);
  const [improveUsed, setImproveUsed] = useState(false);

  // Clarify flow state
  const [clarifyStep, setClarifyStep] = useState<"idle" | "loading" | "questions" | "improving">("idle");
  const [clarifyQuestions, setClarifyQuestions] = useState<ClarifyingQuestion[]>([]);
  const [clarifyCurrentIndex, setClarifyCurrentIndex] = useState(0);
  const [clarifyAnswers, setClarifyAnswers] = useState<string[]>([]);
  const [clarifySelectedOption, setClarifySelectedOption] = useState<string | null>(null);
  const [clarifyOtherText, setClarifyOtherText] = useState("");

  const { data: session } = useSession();
  const { open: openAuthModal } = useAuthModal();
  const resultRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.style.height = "auto";
      resultRef.current.style.height = resultRef.current.scrollHeight + "px";
    }
  }, [result]);

  useEffect(() => {
    setFreeUsed(localStorage.getItem(FREE_TRIAL_KEY) === "1");
  }, []);

  async function handlePolish() {
    const text = input.trim();
    if (!text || loading) return;

    if (!session && freeUsed) {
      openAuthModal();
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setDetectedMode(null);
    setGrade(null);
    setImproveUsed(false);
    setClarifyStep("idle");

    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, style }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setResult(data.polishedText ?? "");
        setDetectedMode(data.detectedMode ?? null);
        setGrade(data.grade ?? null);
        if (!session) {
          localStorage.setItem(FREE_TRIAL_KEY, "1");
          setFreeUsed(true);
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleImprove() {
    if (!result || !grade || clarifyStep !== "idle" || improveUsed) return;

    setClarifyStep("loading");
    setError(null);

    try {
      const res = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input,
          polishedText: result,
          detectedMode,
          grade,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setClarifyStep("idle");
        return;
      }

      const questions: ClarifyingQuestion[] = data.questions ?? [];
      setClarifyQuestions(questions);
      setClarifyCurrentIndex(0);
      setClarifyAnswers([]);
      setClarifySelectedOption(null);
      setClarifyOtherText("");

      if (questions.length === 0) {
        runImprove([]);
        return;
      }

      setClarifyStep("questions");
    } catch {
      setError("Something went wrong. Please try again.");
      setClarifyStep("idle");
    }
  }

  async function runImprove(answers: string[]) {
    const text = input.trim();
    if (!text) return;

    setClarifyStep("improving");
    setError(null);

    try {
      const res = await fetch("/api/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          mode: detectedMode,
          polishedText: result,
          answers,
          grade,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.improvedText ?? result);
        setGrade(data.grade ?? null);
        setImproveUsed(true);
      } else {
        setError(data.error ?? "Something went wrong.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setClarifyStep("idle");
      setClarifyQuestions([]);
      setClarifyCurrentIndex(0);
      setClarifyAnswers([]);
    }
  }

  function handleClarifyNext(answer: string) {
    const nextAnswers = [...clarifyAnswers];
    nextAnswers[clarifyCurrentIndex] = answer;
    setClarifyAnswers(nextAnswers);

    if (clarifyCurrentIndex === clarifyQuestions.length - 1) {
      runImprove(nextAnswers);
      return;
    }

    setClarifyCurrentIndex((i) => i + 1);
    setClarifySelectedOption(null);
    setClarifyOtherText("");
  }

  function handleClarifySkip() {
    const nextAnswers = [...clarifyAnswers];
    nextAnswers[clarifyCurrentIndex] = "";
    setClarifyAnswers(nextAnswers);

    if (clarifyCurrentIndex === clarifyQuestions.length - 1) {
      runImprove(nextAnswers);
      return;
    }

    setClarifyCurrentIndex((i) => i + 1);
    setClarifySelectedOption(null);
    setClarifyOtherText("");
  }

  function handleClarifyPrev() {
    if (clarifyCurrentIndex === 0) return;
    const prevIndex = clarifyCurrentIndex - 1;
    const prevAnswer = clarifyAnswers[prevIndex] ?? "";
    const prevQuestion = clarifyQuestions[prevIndex];
    if (prevQuestion?.options.includes(prevAnswer)) {
      setClarifySelectedOption(prevAnswer);
      setClarifyOtherText("");
    } else {
      setClarifySelectedOption(null);
      setClarifyOtherText(prevAnswer);
    }
    setClarifyCurrentIndex(prevIndex);
  }

  function handleCloseClarify() {
    setClarifyStep("idle");
    setClarifyQuestions([]);
    setClarifyCurrentIndex(0);
    setClarifyAnswers([]);
    setClarifySelectedOption(null);
    setClarifyOtherText("");
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function getResultLabel() {
    if (improveUsed) return "Improved Version";
    if (detectedMode === "prompt") return "Polished Prompt";
    if (detectedMode === "professional") return "Polished Email";
    if (detectedMode === "creative") return "Polished Writing";
    if (detectedMode === "casual") return "Polished Message";
    return "Polished Version";
  }

  const currentQuestion = clarifyQuestions[clarifyCurrentIndex];
  const currentAnswer = clarifySelectedOption
    ? clarifySelectedOption
    : currentQuestion?.allowOther && clarifyOtherText.trim()
      ? clarifyOtherText.trim()
      : "";
  const isLastQuestion = clarifyCurrentIndex === clarifyQuestions.length - 1;
  const canSubmitQuestion = currentAnswer !== "";

  return (
    <div className="w-full max-w-2xl flex flex-col gap-3">
      {/* Input box — always visible */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <textarea
          value={input}
          onChange={(e) => { setInput(e.target.value); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handlePolish();
            }
          }}
          placeholder="Paste your writing or prompt here…"
          rows={5}
          disabled={loading}
          className="w-full resize-none px-5 pt-5 pb-3 text-sm text-gray-900 placeholder-gray-400 outline-none disabled:opacity-60"
        />
        {/* Toolbar inside the box */}
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
          <StyleDropdown value={style} onChange={setStyle} disabled={loading} />
          <button
            onClick={handlePolish}
            disabled={!input.trim() || loading}
            className="py-2 px-4 rounded-lg text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2 bg-gradient-to-b from-[#456BFF] to-[#2548D2] hover:opacity-95"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Polishifying…
              </>
            ) : (
              <>
                <img src="/sparks-solid.svg" alt="" width={18} height={18} className="w-[18px] h-[18px] shrink-0" />
                Polish
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Result */}
      {result !== null && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              {getResultLabel()}
            </span>
            <button
              onClick={handleCopy}
              className={`shrink-0 py-1.5 px-3 rounded-md border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                copied
                  ? "bg-green-600 border-green-600 text-white"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Polished text — spinner while improving */}
          {clarifyStep === "improving" ? (
            <div className="flex items-center justify-center gap-2 px-5 py-8 text-sm text-[#607AFF]">
              <span className="w-4 h-4 border-2 border-[#c5d0ff] border-t-[#607AFF] rounded-full animate-spin" />
              Improving…
            </div>
          ) : (
            <textarea
              ref={resultRef}
              value={result}
              onChange={(e) => {
                setResult(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              className="w-full resize-none overflow-hidden px-5 py-4 text-sm text-gray-900 bg-white outline-none focus:ring-0 border-0"
            />
          )}

          {/* Questionnaire — shown when clarifyStep === "questions" */}
          {clarifyStep === "questions" && currentQuestion && (
            <div className="mx-4 mb-4 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
              {/* Q header: pagination + close */}
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2.5">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{clarifyCurrentIndex + 1} of {clarifyQuestions.length}</span>
                  {clarifyQuestions.length > 1 && (
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={handleClarifyPrev}
                        disabled={clarifyCurrentIndex === 0}
                        className="rounded px-1 py-0.5 text-gray-500 hover:bg-gray-200 disabled:opacity-30"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClarifyNext("")}
                        disabled={clarifyCurrentIndex === clarifyQuestions.length - 1}
                        className="rounded px-1 py-0.5 text-gray-500 hover:bg-gray-200 disabled:opacity-30"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCloseClarify}
                  className="rounded p-1 text-gray-400 hover:bg-gray-200 text-base leading-none"
                >
                  ×
                </button>
              </div>

              {/* Question text */}
              <div className="px-4 pt-3 pb-2">
                <p className="text-sm font-medium text-gray-900">{currentQuestion.question}</p>
              </div>

              {/* Options */}
              <div className="px-4 pb-3 space-y-1.5">
                {/* Free-text input */}
                {currentQuestion.allowOther && (
                  <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 mb-1 ${
                    clarifyOtherText.trim() && !clarifySelectedOption
                      ? "border-[#456BFF] bg-[#eff2ff]"
                      : "border-gray-200 bg-white"
                  }`}>
                    <span className="text-gray-400 text-xs">✎</span>
                    <input
                      type="text"
                      value={clarifyOtherText}
                      onChange={(e) => {
                        setClarifyOtherText(e.target.value);
                        if (e.target.value.trim()) setClarifySelectedOption(null);
                      }}
                      onFocus={() => { if (clarifyOtherText.trim()) setClarifySelectedOption(null); }}
                      placeholder="Type your answer…"
                      className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                )}

                {/* Option buttons */}
                {currentQuestion.options.map((option, i) => {
                  const isSelected = clarifySelectedOption === option;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setClarifySelectedOption(option);
                        setClarifyOtherText("");
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? "border-[#456BFF] bg-[#eff2ff] text-gray-900"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                        isSelected ? "bg-[#456BFF] text-white" : "border border-gray-300 bg-white text-gray-500"
                      }`}>
                        {i + 1}
                      </span>
                      <span className="flex-1">{option}</span>
                      {isSelected && <span className="text-[#456BFF] text-xs">→</span>}
                    </button>
                  );
                })}

                {/* Skip / Next / Improve */}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClarifySkip}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClarifyNext(currentAnswer)}
                    disabled={!canSubmitQuestion}
                    className="rounded-lg bg-gradient-to-b from-[#456BFF] to-[#2548D2] px-3 py-1.5 text-xs font-medium text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLastQuestion ? "Improve" : "Next"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Grade feedback — hidden while clarify is active */}
          {grade && grade.feedback.length > 0 && clarifyStep === "idle" && !improveUsed && (
            <div className="mx-4 mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  How to improve
                </span>
                <button
                  onClick={handleImprove}
                  className="flex items-center gap-1.5 rounded-md bg-gradient-to-b from-[#456BFF] to-[#2548D2] px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-95"
                >
                  Improve
                </button>
              </div>
              <div className="mt-2 space-y-1.5">
                {grade.feedback.map((bullet, i) => (
                  <p key={i} className="text-xs leading-relaxed text-gray-600">
                    • {bullet}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Loading state while fetching questions */}
          {clarifyStep === "loading" && (
            <div className="mx-4 mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
              <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
              Loading questions…
            </div>
          )}
        </div>
      )}

      {/* Free trial nudge */}
      {result !== null && !session && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[#456BFF]/20 bg-[#f0f3ff] px-4 py-3">
          <p className="text-sm text-[#2548D2]">
            That was your <span className="font-semibold">free polish</span>. Sign up to keep going.
          </p>
          <button
            onClick={openAuthModal}
            className="shrink-0 rounded-lg bg-gradient-to-b from-[#456BFF] to-[#2548D2] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-95"
          >
            Sign up free →
          </button>
        </div>
      )}
    </div>
  );
}
