import type { PlatformAdapter } from './types';

// #prompt-textarea is a stable id that has persisted through ChatGPT's
// ProseMirror migration — it works for both the legacy <textarea> and the
// current <div contenteditable="true"> variant.
const SELECTOR = '#prompt-textarea';

export const chatgptAdapter: PlatformAdapter = {
  name: 'chatgpt',

  match(): boolean {
    return window.location.hostname === 'chatgpt.com';
  },

  findInputElement(): HTMLElement | null {
    return document.querySelector(SELECTOR) as HTMLElement | null;
  },

  getText(): string {
    const el = this.findInputElement();
    if (!el) return '';
    if (el.tagName === 'TEXTAREA') {
      return (el as HTMLTextAreaElement).value;
    }
    // contenteditable: innerText handles <br>/<p> newlines correctly
    return el.innerText;
  },

  setText(text: string): void {
    const el = this.findInputElement();
    if (!el) return;
    el.focus();

    if (el.tagName === 'TEXTAREA') {
      (el as HTMLTextAreaElement).value = text;
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

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
    const el = this.findInputElement();
    if (!el) return () => {};

    if (el.tagName === 'TEXTAREA') {
      el.addEventListener('input', callback);
      return () => el.removeEventListener('input', callback);
    }

    // MutationObserver for contenteditable: catches ProseMirror DOM restructuring
    // (childList/subtree) and direct text node edits (characterData).
    const observer = new MutationObserver(() => callback());
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  },

  getInputRect(): DOMRect | null {
    const el = this.findInputElement();
    return el ? el.getBoundingClientRect() : null;
  },
};
