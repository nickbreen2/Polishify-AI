import { chatgptAdapter } from './chatgpt';
import { claudeAdapter } from './claude';
import { grokAdapter } from './grok';
import { lovableAdapter } from './lovable';
import { replitAdapter } from './replit';

export type { PlatformAdapter } from './types';

/** All registered platform adapters in detection priority order */
export const adapters = [
  chatgptAdapter,
  claudeAdapter,
  grokAdapter,
  lovableAdapter,
  replitAdapter,
];

/**
 * Returns the first adapter whose match() returns true for the current page,
 * or null if the page is not a supported platform.
 */
export function detectPlatform() {
  return adapters.find((a) => a.match()) ?? null;
}
