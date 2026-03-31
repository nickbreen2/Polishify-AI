import { useState, useEffect, useRef } from 'react';
import { detectPlatform } from '@/lib/adapters';
import type { PlatformAdapter } from '@/lib/adapters';
import type { PolishRequest, PolishResponse, PolishError } from '@/lib/types';
import { PolishWidget } from './PolishWidget';
import { PolishPopup } from './PolishPopup';

// Per-platform right offset: distance from rect.right to widget's left edge.
// Claude's textarea rect.right is close to the send button column.
// ChatGPT's textarea rect.right is further left (button column sits beyond it).
const RIGHT_OFFSET: Record<string, number> = {
  claude: 31,
  chatgpt: 23,
};
const RIGHT_OFFSET_DEFAULT = 30;

const TOP_OFFSET: Record<string, number> = {
  claude: -4,
  chatgpt: 0,
};
const TOP_OFFSET_DEFAULT = 4;

// Walk up from the input element and find the first ancestor with a visible
// border-radius (the rounded input box). This is the element we inject into so
// the widget scrolls/moves with the container natively (zero-lag).
function findRoundedContainer(inputEl: HTMLElement): HTMLElement | null {
  let el: HTMLElement | null = inputEl.parentElement;
  while (el && el !== document.body) {
    const br = parseFloat(window.getComputedStyle(el).borderRadius);
    if (br >= 8) return el;
    el = el.parentElement;
  }
  // Fallback: nearest positioned ancestor
  return (inputEl.offsetParent as HTMLElement | null) ?? inputEl.parentElement;
}

// Compute position relative to the injected container so the widget is
// correctly placed without any JS scroll tracking.
function computeContainerPosition(
  adapter: PlatformAdapter,
  container: HTMLElement,
): { top: number; left: number } | null {
  const rect = adapter.getInputRect();
  if (!rect) return null;
  if (rect.bottom < 0 || rect.top > window.innerHeight) return null;
  const containerRect = container.getBoundingClientRect();
  const rightOffset = RIGHT_OFFSET[adapter.name] ?? RIGHT_OFFSET_DEFAULT;
  const topOffset = TOP_OFFSET[adapter.name] ?? TOP_OFFSET_DEFAULT;
  return {
    top: rect.top + topOffset - containerRect.top,
    left: rect.right - rightOffset - containerRect.left,
  };
}

// Fallback: viewport-relative coords when no container was found.
function computeViewportPosition(adapter: PlatformAdapter): { top: number; left: number } | null {
  const rect = adapter.getInputRect();
  if (!rect) return null;
  if (rect.bottom < 0 || rect.top > window.innerHeight) return null;
  const rightOffset = RIGHT_OFFSET[adapter.name] ?? RIGHT_OFFSET_DEFAULT;
  const topOffset = TOP_OFFSET[adapter.name] ?? TOP_OFFSET_DEFAULT;
  return {
    top: rect.top + topOffset,
    left: rect.right - rightOffset,
  };
}

interface WidgetContainerProps {
  onContainerReady?: (container: HTMLElement) => void;
}

export function WidgetContainer({ onContainerReady }: WidgetContainerProps) {
  const [adapter, setAdapter] = useState<PlatformAdapter | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [polishedText, setPolishedText] = useState<string | null>(null);

  // Phase 1: detect platform and wait for input element (handles SPA navigation).
  // When the input element is found, locate the rounded outer container and call
  // onContainerReady so the host element can be re-parented into it.
  useEffect(() => {
    const detected = detectPlatform();
    if (!detected) return;

    function tryInit(): boolean {
      const inputEl = detected!.findInputElement();
      if (!inputEl) return false;

      if (onContainerReady && !containerRef.current) {
        const container = findRoundedContainer(inputEl);
        if (container) {
          containerRef.current = container;
          onContainerReady(container);
        }
      }

      setAdapter(detected!);
      return true;
    }

    if (tryInit()) return;

    // Input not yet in DOM — wait for it (SPA navigation)
    const observer = new MutationObserver(() => {
      if (tryInit()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [onContainerReady]);

  // Phase 2: compute initial position. With DOM injection the browser handles
  // scroll natively, so we only need rAF as a fallback (no container found) or
  // to catch layout shifts (e.g. textarea growing).
  useEffect(() => {
    if (!adapter) return;

    const updateActive = () => setIsActive(adapter.getText().trim().length > 0);
    updateActive();
    const cleanupText = adapter.onTextChange(updateActive);

    let rafId: number;
    let lastTop = -1;
    let lastLeft = -1;

    const tick = () => {
      const container = containerRef.current;
      const pos = container
        ? computeContainerPosition(adapter, container)
        : computeViewportPosition(adapter);
      const top = pos?.top ?? -1;
      const left = pos?.left ?? -1;
      if (top !== lastTop || left !== lastLeft) {
        lastTop = top;
        lastLeft = left;
        setPosition(pos ?? null);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cleanupText();
      cancelAnimationFrame(rafId);
    };
  }, [adapter]);

  if (!adapter || position === null) return null;

  const handleClick = () => {
    const text = adapter.getText().trim();
    if (!text) return;

    setPolishedText(null);  // reset to loading state
    setPopupOpen(true);     // open popup immediately

    browser.runtime.sendMessage({
      type: 'POLISH_REQUEST',
      text,
    } satisfies PolishRequest).then((response: PolishResponse | PolishError) => {
      if (response.type === 'POLISH_ERROR') {
        setPolishedText(`Error: ${response.error}`);
      } else {
        setPolishedText(response.improvedText);
      }
    }).catch((err: unknown) => {
      setPolishedText(`Error: ${err instanceof Error ? err.message : 'Something went wrong'}`);
    });
  };

  const handleApply = (text: string) => {
    adapter.setText(text);
    setPopupOpen(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      // Clipboard write failed silently — user can manually copy from popup
    });
  };

  const handleDismiss = () => {
    setPopupOpen(false);
  };

  return (
    <>
      <PolishWidget
        isActive={isActive}
        onClick={handleClick}
        position={position}
        isAbsolute={containerRef.current !== null}
      />
      {popupOpen && (
        <PolishPopup
          polishedText={polishedText}
          position={position}
          onApply={handleApply}
          onCopy={handleCopy}
          onDismiss={handleDismiss}
        />
      )}
    </>
  );
}
