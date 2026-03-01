import { useState } from "react";
import type { GradeResult } from "@/lib/types";

interface PopoverProps {
  originalText: string;
  improvedText: string | null;
  detectedMode: "prompt" | "general" | null;
  grade: GradeResult | null;
  error: string | null;
  loading: boolean;
  onReplace: (text: string) => void;
  onDismiss: () => void;
}

export function Popover({
  originalText,
  improvedText,
  grade,
  error,
  loading,
  onReplace,
  onDismiss,
}: PopoverProps) {
  const [tab, setTab] = useState<"improved" | "original">("improved");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!improvedText) return;
    await navigator.clipboard.writeText(improvedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="polishify-popover">
      {/* Header */}
      <div className="polishify-header">
        <span className="polishify-title">
          <img
            src={browser.runtime.getURL("/full-logo.svg")}
            alt=""
            className="h-5 w-auto max-w-[120px] shrink-0"
            style={{ display: "block" }}
          />
        </span>
        <button className="polishify-close" onClick={onDismiss}>
          ×
        </button>
      </div>

      {loading && (
        <div className="polishify-loading">
          <div className="polishify-spinner" />
          Polishing...
        </div>
      )}

      {error && <div className="polishify-error">{error}</div>}

      {improvedText && !loading && (
        <>
          {/* Tabs */}
          <div className="polishify-tabs">
            <button
              className={`polishify-tab ${tab === "improved" ? "active" : ""}`}
              onClick={() => setTab("improved")}
            >
              Improved
            </button>
            <button
              className={`polishify-tab ${tab === "original" ? "active" : ""}`}
              onClick={() => setTab("original")}
            >
              Original
            </button>
          </div>

          {/* Content */}
          <div className="polishify-content">
            <div className="polishify-text">
              {tab === "improved" ? improvedText : originalText}
            </div>
          </div>

          {/* Grade */}
          {grade && (
            <div className="polishify-grade">
              <div className="polishify-grade-overall">
                <span>Grade</span>
                <span className={`polishify-tier polishify-tier-${grade.overall.toLowerCase().replace(" ", "-")}`}>
                  {grade.overall}
                </span>
              </div>
              {grade.feedback.slice(0, 2).map((f, i) => (
                <p key={i} className="polishify-grade-feedback">{f}</p>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="polishify-footer">
            <button className="polishify-btn" onClick={onDismiss}>
              Dismiss
            </button>
            <button
              className={`polishify-btn polishify-btn-copy ${copied ? "copied" : ""}`}
              onClick={handleCopy}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              className="polishify-btn polishify-btn-primary"
              onClick={() => onReplace(improvedText)}
            >
              Replace
            </button>
          </div>
        </>
      )}
    </div>
  );
}
