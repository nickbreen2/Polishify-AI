import { createRoot } from "react-dom/client";
import { Popover } from "@/components/Popover";
import { WidgetContainer } from "@/components/WidgetContainer";
import type {
  TriggerPolish,
  PolishRequest,
  PolishResponse,
  PolishError,
  GradeResult,
  PolishMode,
} from "@/lib/types";
import popoverStyles from "@/components/popover.css?raw";

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",

  main() {
    let shadowHost: HTMLElement | null = null;
    let root: ReturnType<typeof createRoot> | null = null;
    let savedRange: Range | null = null;
    let activeElement: Element | null = null;

    function getSelectedText(): string {
      return window.getSelection()?.toString()?.trim() ?? "";
    }

    function getSelectionPosition(): { top: number; left: number } {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return { top: 100, left: 100 };
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      return {
        top: Math.min(rect.bottom + 8, window.innerHeight - 420),
        left: Math.min(rect.left, window.innerWidth - 440),
      };
    }

    function cleanup() {
      if (root) {
        root.unmount();
        root = null;
      }
      if (shadowHost) {
        shadowHost.remove();
        shadowHost = null;
      }
      savedRange = null;
      activeElement = null;
    }

    function replaceText(newText: string) {
      if (!savedRange || !activeElement) {
        cleanup();
        return;
      }

      // Restore focus and selection
      if (activeElement instanceof HTMLElement) {
        activeElement.focus();
      }

      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }

      // Use execCommand to preserve undo stack
      document.execCommand("insertText", false, newText);

      cleanup();
    }

    function renderPopover(
      text: string,
      improvedText: string | null,
      detectedMode: PolishMode | null,
      grade: GradeResult | null,
      error: string | null,
      loading: boolean,
      pos: { top: number; left: number }
    ) {
      if (!shadowHost) {
        shadowHost = document.createElement("div");
        shadowHost.id = "polishify-ai-root";
        document.body.appendChild(shadowHost);

        const shadow = shadowHost.attachShadow({ mode: "open" });

        // Inject styles
        const style = document.createElement("style");
        style.textContent = popoverStyles;
        shadow.appendChild(style);

        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.top = `${pos.top}px`;
        container.style.left = `${pos.left}px`;
        container.style.zIndex = "2147483647";
        shadow.appendChild(container);

        root = createRoot(container);
      }

      const shadow = shadowHost.shadowRoot!;
      const container = shadow.querySelector("div")!;
      container.style.top = `${pos.top}px`;
      container.style.left = `${pos.left}px`;

      root!.render(
        <Popover
          originalText={text}
          improvedText={improvedText}
          detectedMode={detectedMode}
          grade={grade}
          error={error}
          loading={loading}
          onReplace={replaceText}
          onDismiss={cleanup}
        />
      );
    }

    async function handlePolish() {
      const text = getSelectedText();
      if (!text) return;

      const pos = getSelectionPosition();

      // Save the current selection and active element for later replacement
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        savedRange = sel.getRangeAt(0).cloneRange();
      }
      activeElement = document.activeElement;

      // Show loading state
      renderPopover(text, null, null, null, null, true, pos);

      // Send request through background worker
      try {
        const response = (await browser.runtime.sendMessage({
          type: "POLISH_REQUEST",
          text,
        } satisfies PolishRequest)) as PolishResponse | PolishError;

        if (response.type === "POLISH_ERROR") {
          renderPopover(text, null, null, null, response.error, false, pos);
        } else {
          renderPopover(text, response.improvedText, response.detectedMode, response.grade, null, false, pos);
        }
      } catch (err) {
        renderPopover(
          text,
          null,
          null,
          null,
          err instanceof Error ? err.message : "Something went wrong",
          false,
          pos
        );
      }
    }

    // Listen for trigger from background
    browser.runtime.onMessage.addListener((message: TriggerPolish) => {
      if (message.type === "TRIGGER_POLISH") {
        handlePolish();
      }
    });

    // Escape to dismiss
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && shadowHost) {
        cleanup();
      }
    });

    // ── Floating widget overlay ──────────────────────────────────────────────
    const widgetHost = document.createElement("div");
    widgetHost.id = "polishify-widget-root";
    widgetHost.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:0;overflow:visible;pointer-events:none;z-index:2147483646;";
    document.body.appendChild(widgetHost);

    const widgetShadow = widgetHost.attachShadow({ mode: "open" });

    // Keyframe animation lives here so PolishWidget can reference it by name
    const widgetStyle = document.createElement("style");
    widgetStyle.textContent = `
      @keyframes polishify-pulse {
        0%, 100% { box-shadow: 0 2px 8px rgba(99,102,241,0.45), 0 0 0 0 rgba(99,102,241,0.3); }
        50%       { box-shadow: 0 2px 8px rgba(99,102,241,0.45), 0 0 0 6px rgba(99,102,241,0); }
      }
      @keyframes polishify-dot-pulse {
        0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
        40%           { opacity: 1;   transform: scale(1); }
      }
    `;
    widgetShadow.appendChild(widgetStyle);

    const widgetDiv = document.createElement("div");
    widgetDiv.style.cssText = "position:absolute;top:0;left:0;width:0;height:0;overflow:visible;";
    widgetShadow.appendChild(widgetDiv);

    // Called by WidgetContainer once it locates the rounded input container.
    // We re-parent the shadow host into that element so the widget moves with
    // it natively (scroll, layout shifts) — no JS position tracking needed.
    function adoptIntoContainer(container: HTMLElement) {
      const computed = window.getComputedStyle(container);
      if (computed.position === "static") {
        container.style.position = "relative";
      }
      container.appendChild(widgetHost);
      widgetHost.style.cssText =
        "position:absolute;top:0;left:0;width:0;height:0;overflow:visible;pointer-events:none;z-index:2147483646;";
    }

    const widgetRoot = createRoot(widgetDiv);
    widgetRoot.render(<WidgetContainer onContainerReady={adoptIntoContainer} />);
  },
});
