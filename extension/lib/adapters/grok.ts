import type { PlatformAdapter } from './types';

// Grok has switched between a plain <textarea> and a contenteditable div
// across releases. Prefer a form-scoped textarea (avoids search bars),
// then fall back to any contenteditable.
function findElement(): HTMLElement | null {
  return (
    (document.querySelector('form textarea') as HTMLElement | null) ??
    (document.querySelector('textarea') as HTMLElement | null) ??
    (document.querySelector('div[contenteditable="true"]') as HTMLElement | null)
  );
}

function isTextarea(el: HTMLElement): el is HTMLTextAreaElement {
  return el.tagName === 'TEXTAREA';
}

export const grokAdapter: PlatformAdapter = {
  name: 'grok',

  match(): boolean {
    return window.location.hostname === 'grok.com';
  },

  findInputElement(): HTMLElement | null {
    return findElement();
  },

  getText(): string {
    const el = findElement();
    if (!el) return '';
    if (isTextarea(el)) return el.value;
    return el.innerText;
  },

  setText(text: string): void {
    const el = findElement();
    if (!el) return;
    el.focus();

    if (isTextarea(el)) {
      el.value = text;
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    // contenteditable path
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

    if (isTextarea(el)) {
      el.addEventListener('input', callback);
      return () => el.removeEventListener('input', callback);
    }

    const observer = new MutationObserver(() => callback());
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  },

  getInputRect(): DOMRect | null {
    const el = findElement();
    return el ? el.getBoundingClientRect() : null;
  },
};
