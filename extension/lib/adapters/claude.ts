import type { PlatformAdapter } from './types';

// Ordered fallback selectors — Claude.ai has changed its DOM across versions.
// 1. data-testid="chat-input": most stable, intentionally preserved across deploys
// 2. div.tiptap.ProseMirror: Claude uses Tiptap, not raw ProseMirror
// 3. role="textbox": ARIA fallback, most resilient to class/attribute churn
const SELECTORS = [
  '[data-testid="chat-input"]',
  'div.tiptap.ProseMirror[contenteditable="true"]',
  '[role="textbox"][contenteditable="true"]',
] as const;

function findElement(): HTMLElement | null {
  for (const sel of SELECTORS) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el) return el;
  }
  return null;
}

export const claudeAdapter: PlatformAdapter = {
  name: 'claude',

  match(): boolean {
    return window.location.hostname === 'claude.ai';
  },

  findInputElement(): HTMLElement | null {
    return findElement();
  },

  getText(): string {
    const el = findElement();
    if (!el) return '';
    return el.innerText;
  },

  setText(text: string): void {
    const el = findElement();
    if (!el) return;
    el.focus();

    // ProseMirror contenteditable: select all then execCommand so ProseMirror's
    // beforeinput/input listeners fire and internal editor state updates.
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    sel?.removeAllRanges();
    sel?.addRange(range);
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.execCommand('insertText', false, text);
  },

  onTextChange(callback: () => void): () => void {
    const el = findElement();
    if (!el) return () => {};

    const observer = new MutationObserver(() => callback());
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  },

  getInputRect(): DOMRect | null {
    const el = findElement();
    return el ? el.getBoundingClientRect() : null;
  },
};
