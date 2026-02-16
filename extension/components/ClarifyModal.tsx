import type { ClarifyingQuestion } from "@/lib/types";

interface ClarifyModalProps {
  questions: ClarifyingQuestion[];
  currentIndex: number;
  selectedAnswer: string | null;
  otherInput: string;
  onSelectOption: (option: string) => void;
  onOtherInputChange: (value: string) => void;
  onSkip: () => void;
  onNext: (answer: string) => void;
  onPrev: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export function ClarifyModal({
  questions,
  currentIndex,
  selectedAnswer,
  otherInput,
  onSelectOption,
  onOtherInputChange,
  onSkip,
  onNext,
  onPrev,
  onClose,
  isLoading = false,
}: ClarifyModalProps) {
  if (questions.length === 0) return null;

  const current = questions[currentIndex];
  const total = questions.length;
  const isLast = currentIndex === total - 1;
  // If selectedAnswer is a non-empty string, use that (user picked an option).
  // If selectedAnswer is "" (cleared by typing), use the text input.
  // If selectedAnswer is null, fall back to text input.
  const currentAnswer =
    selectedAnswer
      ? selectedAnswer
      : current.allowOther && otherInput.trim()
        ? otherInput.trim()
        : "";
  const canSubmit = currentAnswer !== "";
  const handleNext = () => onNext(currentAnswer);

  return (
    <div
      className="flex flex-1 flex-col min-h-0 w-full bg-white overflow-auto"
      role="region"
      aria-label="Clarifying questions"
    >
      {/* Header: pagination + close */}
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>
            {currentIndex + 1} of {total}
          </span>
          {total > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onPrev}
                disabled={currentIndex === 0}
                className="rounded p-1 disabled:opacity-40 text-gray-600 hover:bg-gray-100"
                aria-label="Previous question"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => onNext("")}
                disabled={currentIndex === total - 1}
                className="rounded p-1 disabled:opacity-40 text-gray-600 hover:bg-gray-100"
                aria-label="Next question"
              >
                ›
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-gray-500 hover:bg-gray-100 text-lg leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Question */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <h2 className="text-base font-medium text-gray-900">{current.question}</h2>
      </div>

      {/* Options */}
      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4">
        <div className="space-y-1">
          {current.allowOther && (
            <div className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 mb-2 ${
              otherInput.trim() && !selectedAnswer
                ? "border-[#456BFF] bg-[#eff2ff]"
                : "border-gray-200 bg-white"
            }`}>
              <span className="text-gray-400" aria-hidden>
                ✎
              </span>
              <input
                type="text"
                value={otherInput}
                onChange={(e) => {
                  onOtherInputChange(e.target.value);
                  if (e.target.value.trim()) onSelectOption("");
                }}
                onFocus={() => { if (otherInput.trim()) onSelectOption(""); }}
                placeholder="Type your answer..."
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                aria-label="Type your answer"
              />
            </div>
          )}

          {current.options.map((option, i) => {
            const isSelected = selectedAnswer === option;
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onSelectOption(option);
                  onOtherInputChange("");
                }}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                  isSelected
                    ? "border-[#456BFF] bg-[#eff2ff] text-gray-900"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                    isSelected
                      ? "bg-[#456BFF] text-white"
                      : "border border-gray-300 bg-white text-gray-600"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="flex-1">{option}</span>
                {isSelected && (
                  <span className="text-[#456BFF]" aria-hidden>
                    →
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canSubmit}
            className="rounded-lg bg-gradient-to-b from-[#456BFF] to-[#2548D2] px-3 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLast ? (isLoading ? "Improving…" : "Improve") : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
