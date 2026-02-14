import { createRoot } from "react-dom/client";
import { Popover } from "@/components/Popover";
import type {
  TriggerPolish,
  PolishRequest,
  PolishResponse,
  PolishError,
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
      renderPopover(text, null, null, true, pos);

      // Send request through background worker
      try {
        const response = (await browser.runtime.sendMessage({
          type: "POLISH_REQUEST",
          text,
        } satisfies PolishRequest)) as PolishResponse | PolishError;

        if (response.type === "POLISH_ERROR") {
          renderPopover(text, null, response.error, false, pos);
        } else {
          renderPopover(text, response.improvedText, null, false, pos);
        }
      } catch (err) {
        renderPopover(
          text,
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
  },
});
