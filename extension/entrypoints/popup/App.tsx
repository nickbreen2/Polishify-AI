import { useState, useRef, useEffect } from "react";
import { ClarifyModal } from "@/components/ClarifyModal";
import { GradeCard } from "@/components/GradeCard";
import type {
  PolishMode,
  PolishResponse,
  PolishError,
  ClarifyResponse,
  ClarifyError,
  ImproveResponse,
  ImproveError,
  ClarifyingQuestion,
  GradeResult,
} from "@/lib/types";

/** Client-side heuristic: single-word input with very few vowels is likely gibberish. */
function looksLikeGibberish(text: string): boolean {
  const t = text.trim();
  if (t.length < 4) return false;
  const words = t.split(/\s+/);
  if (words.length === 1) {
    const word = words[0];
    const vowels = (word.match(/[aeiouyAEIOUY]/g) || []).length;
    const vowelRatio = vowels / word.length;
    if (word.length >= 5 && vowelRatio < 0.2) return true;
    if (word.length >= 4 && vowels === 0) return true;
  }
  return false;
}

export default function App() {
  const [inputText, setInputText] = useState("");
  const [polishedText, setPolishedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-detected mode and grade from polish response
  const [detectedMode, setDetectedMode] = useState<PolishMode | null>(null);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [improveUsed, setImproveUsed] = useState(false);

  // Improve flow: clarifying questions
  const [clarifyStep, setClarifyStep] = useState<
    "idle" | "loading" | "questions" | "improving"
  >("idle");
  const [clarifyQuestions, setClarifyQuestions] = useState<
    ClarifyingQuestion[]
  >([]);
  const [clarifyCurrentIndex, setClarifyCurrentIndex] = useState(0);
  const [clarifyAnswers, setClarifyAnswers] = useState<string[]>([]);
  const [clarifySelectedOption, setClarifySelectedOption] = useState<
    string | null
  >(null);
  const [clarifyOtherText, setClarifyOtherText] = useState("");

  const runPolish = async () => {
    const text = inputText.trim();
    if (!text || loading) return;

    if (looksLikeGibberish(text)) {
      setError("Please enter real writing or a prompt, not random characters.");
      return;
    }

    setError(null);
    setPolishedText(null);
    setGrade(null);
    setDetectedMode(null);
    setImproveUsed(false);
    setLoading(true);

    try {
      const response = (await browser.runtime.sendMessage({
        type: "POLISH_REQUEST",
        text,
      })) as PolishResponse | PolishError;

      if (response.type === "POLISH_ERROR") {
        setError(response.error);
      } else {
        setPolishedText(response.improvedText);
        setDetectedMode(response.detectedMode);
        setGrade(response.grade);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!polishedText) return;
    await navigator.clipboard.writeText(polishedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleImprove = async () => {
    if (improveUsed) return;
    const text = inputText.trim();
    if (!text || polishedText === null) return;

    setError(null);
    setClarifyStep("loading");

    try {
      const response = (await browser.runtime.sendMessage({
        type: "CLARIFY_REQUEST",
        text,
        polishedText: polishedText || undefined,
        detectedMode: detectedMode ?? "general",
        grade: grade ?? undefined,
      })) as ClarifyResponse | ClarifyError;

      if (response.type === "CLARIFY_ERROR") {
        setError(response.error);
        setClarifyStep("idle");
        return;
      }

      const questions = response.questions ?? [];
      setClarifyQuestions(questions);
      setClarifyCurrentIndex(0);
      setClarifyAnswers([]);
      setClarifySelectedOption(null);
      setClarifyOtherText("");

      if (questions.length === 0) {
        setClarifyStep("improving");
        runImprove([]);
        return;
      }

      setClarifyStep("questions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setClarifyStep("idle");
    }
  };

  const runImprove = async (answers: string[]) => {
    const text = inputText.trim();
    if (!text) return;

    setClarifyStep("improving");
    setError(null);

    try {
      const response = (await browser.runtime.sendMessage({
        type: "IMPROVE_REQUEST",
        text,
        mode: (detectedMode ?? "general") as PolishMode,
        polishedText: polishedText ?? undefined,
        answers,
        grade: grade ?? undefined,
      })) as ImproveResponse | ImproveError;

      if (response.type === "IMPROVE_ERROR") {
        setError(response.error);
      } else {
        setPolishedText(response.improvedText);
        setGrade(response.grade);
        setImproveUsed(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setClarifyStep("idle");
      setClarifyQuestions([]);
      setClarifyCurrentIndex(0);
      setClarifyAnswers([]);
    }
  };

  const handleClarifyNext = (answer: string) => {
    const effective =
      answer ||
      clarifySelectedOption ||
      (currentQuestion?.allowOther ? clarifyOtherText.trim() : "") ||
      "";
    const nextAnswers = [...clarifyAnswers];
    nextAnswers[clarifyCurrentIndex] = effective;
    setClarifyAnswers(nextAnswers);

    if (clarifyCurrentIndex === clarifyQuestions.length - 1) {
      runImprove(nextAnswers);
      return;
    }

    setClarifyCurrentIndex((i) => i + 1);
    setClarifySelectedOption(null);
    setClarifyOtherText("");
  };

  const handleClarifySkip = () => {
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
  };

  const handleClarifyPrev = () => {
    if (clarifyCurrentIndex > 0) {
      setClarifyCurrentIndex((i) => i - 1);
      const prevAnswer = clarifyAnswers[clarifyCurrentIndex - 1] ?? "";
      const prev = clarifyQuestions[clarifyCurrentIndex - 1];
      if (prev?.options.includes(prevAnswer)) {
        setClarifySelectedOption(prevAnswer);
        setClarifyOtherText("");
      } else {
        setClarifySelectedOption(null);
        setClarifyOtherText(prevAnswer);
      }
    }
  };

  const handleCloseClarify = () => {
    setClarifyStep("idle");
    setClarifyQuestions([]);
    setClarifyCurrentIndex(0);
    setClarifyAnswers([]);
    setClarifySelectedOption(null);
    setClarifyOtherText("");
  };

  const showResult = polishedText !== null;
  const showInput = !showResult;

  const currentQuestion = clarifyQuestions[clarifyCurrentIndex];

  const polishedTextareaRef = useRef<HTMLTextAreaElement>(null);
  const POLISHED_TEXTAREA_MAX_HEIGHT = 400;

  useEffect(() => {
    const el = polishedTextareaRef.current;
    if (!el || polishedText === null) return;
    const resize = () => {
      el.style.height = "auto";
      const h = Math.min(el.scrollHeight, POLISHED_TEXTAREA_MAX_HEIGHT);
      el.style.height = `${h}px`;
    };
    resize();
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(resize);
    });
    return () => cancelAnimationFrame(id);
  }, [polishedText]);

  const showQuestionsPage =
    clarifyStep === "questions" && clarifyQuestions.length > 0;

  return (
    <div className="w-[380px] min-h-[420px] max-h-[600px] flex flex-col">
      {/* Header - always visible */}
      <div className="flex items-center gap-2 p-4 pb-4 shrink-0 border-b border-[#f2f2f2]">
        <img
          src={browser.runtime.getURL("/logo.png")}
          alt="Polishify AI"
          width={20}
          height={20}
          className="w-5 h-5 shrink-0"
        />
        <h1 className="text-lg font-semibold text-gray-900">Polishify AI</h1>
      </div>

      {showQuestionsPage ? (
        <ClarifyModal
          questions={clarifyQuestions}
          currentIndex={clarifyCurrentIndex}
          selectedAnswer={clarifySelectedOption}
          otherInput={clarifyOtherText}
          onSelectOption={setClarifySelectedOption}
          onOtherInputChange={setClarifyOtherText}
          onSkip={handleClarifySkip}
          onNext={handleClarifyNext}
          onPrev={handleClarifyPrev}
          onClose={handleCloseClarify}
          isLoading={clarifyStep === "improving"}
        />
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto px-4 pt-3">
            {showInput && (
              <div className="pt-2 flex flex-col">
                <p className="text-sm text-gray-600 mb-5">
                  Paste your text or prompt in the text box below for a more polished version
                </p>

                <label className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-3 block">
                  Paste here
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      runPolish();
                    }
                  }}
                  placeholder="Paste your writing here..."
                  className="w-full min-h-[120px] px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-gray-300 resize-y mb-4"
                  disabled={loading}
                />

                {error && (
                  <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                    {error}
                  </div>
                )}
              </div>
            )}

            {showResult && polishedText !== null && (
              <div className="pt-2 flex flex-col">
                {error && (
                  <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    {improveUsed ? "Improved version" : "Polished version"}
                  </label>
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={loading}
                    className={`shrink-0 py-1.5 px-2.5 rounded-md border text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                      copied
                        ? "bg-green-600 border-green-600 text-white"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {!copied && (
                      <img
                        src={browser.runtime.getURL("/copy.svg")}
                        alt=""
                        width={14}
                        height={14}
                        className="w-3.5 h-3.5 shrink-0"
                      />
                    )}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                {loading || clarifyStep === "improving" ? (
                  <div className="min-h-[80px] flex items-center justify-center gap-2 text-[#607AFF] text-sm mb-4 rounded-lg border border-gray-200 bg-gray-50">
                    <span className="w-4 h-4 border-2 border-[#c5d0ff] border-t-[#607AFF] rounded-full animate-spin" />
                    {clarifyStep === "improving" ? "Improving…" : "Polishifying…"}
                  </div>
                ) : (
                  <textarea
                    ref={polishedTextareaRef}
                    value={polishedText}
                    onChange={(e) => setPolishedText(e.target.value)}
                    className="min-h-[52px] max-h-[400px] w-full overflow-y-auto resize-y mb-4 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-0 focus:border-gray-300"
                    rows={2}
                  />
                )}

                {grade && detectedMode && (
                  <GradeCard grade={grade} detectedMode={detectedMode} />
                )}
              </div>
            )}
          </div>

          {/* Fixed bottom section - buttons always visible */}
          <div className="shrink-0 px-4 pb-4 pt-3 border-t border-[#f2f2f2] bg-white">
            {showInput && (
              <button
                onClick={runPolish}
                disabled={!inputText.trim() || loading}
                className="w-full py-2.5 rounded-lg text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2 bg-gradient-to-b from-[#456BFF] to-[#2548D2] hover:opacity-95"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Polishifying...
                  </>
                ) : (
                  <>
                    <img
                      src={browser.runtime.getURL("/sparks-solid.svg")}
                      alt=""
                      width={18}
                      height={18}
                      className="w-[18px] h-[18px] shrink-0"
                    />
                    Polishify
                  </>
                )}
              </button>
            )}

            {showResult && (
              <>
                <button
                  type="button"
                  onClick={handleImprove}
                  disabled={loading || clarifyStep !== "idle" || improveUsed || grade?.overall === "Excellent"}
                  className={`w-full py-2.5 rounded-lg text-white font-medium text-sm transition-opacity flex items-center justify-center gap-2 bg-gradient-to-b from-[#456BFF] to-[#2548D2] ${
                    improveUsed || grade?.overall === "Excellent"
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  <img
                    src={browser.runtime.getURL("/sparks-solid.svg")}
                    alt=""
                    width={18}
                    height={18}
                    className="w-[18px] h-[18px] shrink-0"
                  />
                  {improveUsed ? "Already Improved" : grade?.overall === "Excellent" ? "Already Excellent" : "Improve"}
                </button>

              </>
            )}

            {clarifyStep === "loading" && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                <div className="rounded-lg bg-white px-4 py-3 text-sm text-gray-700 shadow">
                  Improving…
                </div>
              </div>
            )}

            <p className="mt-3 text-xs text-gray-400 text-center">
              Open anytime with <kbd className="font-sans font-medium">⌘</kbd> + <kbd className="font-sans font-medium">I</kbd>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
