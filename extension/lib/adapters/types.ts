export interface PlatformAdapter {
  /** Short identifier: "chatgpt", "claude", "grok", "lovable", "replit" */
  name: string;

  /** Returns true if the current page belongs to this platform */
  match(): boolean;

  /** Locates the active prompt input element, or null if not found */
  findInputElement(): HTMLElement | null;

  /** Reads the current text from the input */
  getText(): string;

  /**
   * Writes text into the input and triggers the platform's internal state update.
   * Uses execCommand for contenteditable (ProseMirror/React) and dispatches
   * InputEvent + change for textarea elements.
   */
  setText(text: string): void;

  /**
   * Watches for user typing. Returns an unsubscribe function.
   * Uses MutationObserver for contenteditable, 'input' event for textarea.
   */
  onTextChange(callback: () => void): () => void;

  /** Returns the bounding DOMRect of the input element for overlay positioning */
  getInputRect(): DOMRect | null;
}
