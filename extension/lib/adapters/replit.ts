import type { PlatformAdapter } from './types';

// Replit's IDE has many textareas (CodeMirror, Monaco backing elements).
// CodeMirror/Monaco textareas are typically aria-hidden with no placeholder,
// so the specificity of these selectors protects against accidental targeting.
// Ordered from most specific to least specific.
const SELECTORS = [
  'textarea[placeholder*="message" i]',
  'textarea[aria-label*="message" i]',
  'textarea',
] as const;

function findElement(): HTMLTextAreaElement | null {
  for (const sel of SELECTORS) {
    const el = document.querySelector(sel) as HTMLTextAreaElement | null;
    if (el) return el;
  }
  return null;
}

export const replitAdapter: PlatformAdapter = {
  name: 'replit',

  match(): boolean {
    return window.location.hostname === 'replit.com';
  },

  findInputElement(): HTMLElement | null {
    return findElement();
  },

  getText(): string {
    const el = findElement();
    return el ? el.value : '';
  },

  setText(text: string): void {
    const el = findElement();
    if (!el) return;
    el.focus();
    el.value = text;
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  },

  onTextChange(callback: () => void): () => void {
    const el = findElement();
    if (!el) return () => {};
    el.addEventListener('input', callback);
    return () => el.removeEventListener('input', callback);
  },

  getInputRect(): DOMRect | null {
    const el = findElement();
    return el ? el.getBoundingClientRect() : null;
  },
};
