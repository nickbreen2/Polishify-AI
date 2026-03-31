# Widget Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the user clicks the Polishify widget button inside a chat input, a popup appears above the input showing a polished version of their prompt with Apply, Copy, and Edit actions.

**Architecture:** A new `PolishPopup` component renders inside the existing widget shadow DOM, absolutely positioned above the input. `WidgetContainer` owns popup open/close state and fires the `POLISH_REQUEST` message to the background worker on click. The widget button (`PolishWidget`) already accepts `onClick` and `isActive` props — no changes needed there.

**Tech Stack:** React 19, TypeScript, WXT browser extension framework, inline CSS (no extra libraries)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `extension/components/PolishPopup.tsx` | **Create** | Popup UI — loading / result / edit states |
| `extension/components/WidgetContainer.tsx` | **Modify** | Own popup state, fire API call, render popup |
| `extension/entrypoints/content.tsx` | **Modify** | Add loading-dots keyframe to widget shadow DOM styles |
| `extension/components/PolishWidget.tsx` | **None** | Already accepts `onClick` + `isActive` — untouched |
| `extension/lib/types.ts` | **None** | Existing `POLISH_REQUEST` / `POLISH_RESPONSE` / `POLISH_ERROR` used as-is |

---

## Task 1: Add loading-dots keyframe to widget shadow styles

The popup loading state uses a 3-dot pulse animation. The keyframe must live inside the widget's shadow DOM style tag (in `content.tsx`) — external stylesheets don't reach into shadow roots.

**Files:**
- Modify: `extension/entrypoints/content.tsx:189-196`

- [ ] **Step 1: Add the keyframe**

Open `extension/entrypoints/content.tsx`. Find the `widgetStyle.textContent` assignment (around line 190). Replace it with:

```typescript
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
```

- [ ] **Step 2: Build and confirm no errors**

```bash
cd extension && npm run build 2>&1 | tail -20
```

Expected: build completes with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add extension/entrypoints/content.tsx
git commit -m "feat: add loading-dots keyframe to widget shadow DOM styles"
```

---

## Task 2: Create `PolishPopup.tsx`

The popup component has three internal states: `loading` (dots animation), `result` (read-only polished text + Apply/Copy/Edit), and `edit` (editable textarea + Apply/Cancel). It receives the polished text and action callbacks from `WidgetContainer`.

**Files:**
- Create: `extension/components/PolishPopup.tsx`

- [ ] **Step 1: Create the file**

Create `extension/components/PolishPopup.tsx` with the following content:

```tsx
import { useState, useEffect, useRef, type CSSProperties } from 'react';

interface PolishPopupProps {
  polishedText: string | null;       // null = loading state
  position: { top: number; left: number };  // widget position (container-relative)
  onApply: (text: string) => void;
  onCopy: (text: string) => void;
  onDismiss: () => void;
}

type PopupState = 'loading' | 'result' | 'edit';

const POPUP_WIDTH = 320;
const WIDGET_SIZE = 30;

const COLORS = {
  bg: '#1e1e2e',
  border: '#6c63ff',
  borderFaint: '#3a3a5c',
  text: '#e0e0ff',
  textMuted: '#9d96ff',
  textDim: '#555',
  btnPrimary: '#6c63ff',
  btnPrimaryText: '#ffffff',
  inputBg: '#15151f',
  dot: '#6c63ff',
} as const;

export function PolishPopup({ polishedText, position, onApply, onCopy, onDismiss }: PolishPopupProps) {
  const [state, setState] = useState<PopupState>('loading');
  const [editText, setEditText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Transition loading → result when text arrives
  useEffect(() => {
    if (polishedText !== null) {
      setState('result');
    }
  }, [polishedText]);

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (state === 'edit' && textareaRef.current) {
      textareaRef.current.focus();
      // Place cursor at end
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [state]);

  const wrapStyle: CSSProperties = {
    position: 'absolute',
    // Right-align popup with the widget button
    left: position.left + WIDGET_SIZE - POPUP_WIDTH,
    // Place above the widget; transform pushes it fully above
    top: position.top,
    transform: 'translateY(calc(-100% - 8px))',
    width: POPUP_WIDTH,
    background: COLORS.bg,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 14,
    boxShadow: `0 -4px 20px rgba(108,99,255,0.25)`,
    zIndex: 2147483647,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    boxSizing: 'border-box',
    pointerEvents: 'auto',
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  };

  const labelStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  };

  const dotIndicatorStyle: CSSProperties = {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: COLORS.border,
    flexShrink: 0,
  };

  const dismissBtnStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    color: COLORS.textDim,
    fontSize: 14,
    cursor: 'pointer',
    padding: '0 2px',
    lineHeight: 1,
  };

  const btnBase: CSSProperties = {
    border: 'none',
    borderRadius: 8,
    padding: '7px 16px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  const btnPrimary: CSSProperties = {
    ...btnBase,
    background: COLORS.btnPrimary,
    color: COLORS.btnPrimaryText,
  };

  const btnSecondary: CSSProperties = {
    ...btnBase,
    background: 'transparent',
    color: COLORS.textMuted,
    border: `1px solid ${COLORS.borderFaint}`,
    fontWeight: 400,
  };

  const actionsStyle: CSSProperties = {
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 12,
  };

  if (state === 'loading') {
    return (
      <div style={wrapStyle}>
        <div style={headerStyle}>
          <div style={labelStyle}>
            <div style={dotIndicatorStyle} />
            Polishing...
          </div>
          <button style={dismissBtnStyle} onClick={onDismiss} title="Dismiss">✕</button>
        </div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '10px 0' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: COLORS.dot,
                animation: `polishify-dot-pulse 1.4s ease-in-out ${i * 0.16}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (state === 'edit') {
    return (
      <div style={wrapStyle}>
        <div style={headerStyle}>
          <div style={labelStyle}>
            <div style={dotIndicatorStyle} />
            Edit
          </div>
          <button style={dismissBtnStyle} onClick={onDismiss} title="Dismiss">✕</button>
        </div>
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          style={{
            width: '100%',
            minHeight: 80,
            background: COLORS.inputBg,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 12,
            color: COLORS.text,
            lineHeight: 1.6,
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
        <div style={actionsStyle}>
          <button style={btnPrimary} onClick={() => onApply(editText)}>Apply</button>
          <button style={btnSecondary} onClick={() => setState('result')}>Cancel</button>
        </div>
      </div>
    );
  }

  // state === 'result'
  return (
    <div style={wrapStyle}>
      <div style={headerStyle}>
        <div style={labelStyle}>
          <div style={dotIndicatorStyle} />
          Polished
        </div>
        <button style={dismissBtnStyle} onClick={onDismiss} title="Dismiss">✕</button>
      </div>
      <div
        style={{
          color: COLORS.text,
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        {polishedText}
      </div>
      <div style={actionsStyle}>
        <button style={btnPrimary} onClick={() => onApply(polishedText!)}>Apply</button>
        <button style={btnSecondary} onClick={() => onCopy(polishedText!)}>Copy</button>
        <button
          style={btnSecondary}
          onClick={() => {
            setEditText(polishedText!);
            setState('edit');
          }}
        >
          Edit
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build and confirm no TypeScript errors**

```bash
cd extension && npm run build 2>&1 | tail -20
```

Expected: build succeeds. If TypeScript errors appear, fix them before continuing.

- [ ] **Step 3: Commit**

```bash
git add extension/components/PolishPopup.tsx
git commit -m "feat: add PolishPopup component with loading/result/edit states"
```

---

## Task 3: Wire PolishPopup into WidgetContainer

Replace the `console.log` stub in `handleClick` with actual API call + popup state management. Render `PolishPopup` alongside the widget button.

**Files:**
- Modify: `extension/components/WidgetContainer.tsx`

- [ ] **Step 1: Add popup state and imports**

Open `extension/components/WidgetContainer.tsx`. Replace the import block and add popup state to `WidgetContainer`:

Current imports (lines 1-4):
```typescript
import { useState, useEffect, useRef } from 'react';
import { detectPlatform } from '@/lib/adapters';
import type { PlatformAdapter } from '@/lib/adapters';
import { PolishWidget } from './PolishWidget';
```

Replace with:
```typescript
import { useState, useEffect, useRef } from 'react';
import { detectPlatform } from '@/lib/adapters';
import type { PlatformAdapter } from '@/lib/adapters';
import type { PolishRequest, PolishResponse, PolishError } from '@/lib/types';
import { PolishWidget } from './PolishWidget';
import { PolishPopup } from './PolishPopup';
```

- [ ] **Step 2: Add popup state inside WidgetContainer**

Find the existing state declarations inside `WidgetContainer` (lines 71-74):
```typescript
const [adapter, setAdapter] = useState<PlatformAdapter | null>(null);
const [isActive, setIsActive] = useState(false);
const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
const containerRef = useRef<HTMLElement | null>(null);
```

Add two new state variables immediately after:
```typescript
const [adapter, setAdapter] = useState<PlatformAdapter | null>(null);
const [isActive, setIsActive] = useState(false);
const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
const containerRef = useRef<HTMLElement | null>(null);
const [popupOpen, setPopupOpen] = useState(false);
const [polishedText, setPolishedText] = useState<string | null>(null);
```

- [ ] **Step 3: Replace handleClick with API-calling version**

Find and replace the existing `handleClick` function (lines 148-152):

```typescript
const handleClick = () => {
  const text = adapter.getText();
  // Phase 1: capture text for future polish API wiring
  console.log('[Polishify] Captured text:', text);
};
```

Replace with:
```typescript
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
      // Show error text in result view
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
```

- [ ] **Step 4: Render PolishPopup in the return statement**

Find the current return statement (lines 154-162):
```tsx
return (
  <PolishWidget
    isActive={isActive}
    onClick={handleClick}
    position={position}
    isAbsolute={containerRef.current !== null}
  />
);
```

Replace with:
```tsx
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
```

- [ ] **Step 5: Build and confirm no TypeScript errors**

```bash
cd extension && npm run build 2>&1 | tail -20
```

Expected: build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add extension/components/WidgetContainer.tsx
git commit -m "feat: wire PolishPopup into WidgetContainer with API call on widget click"
```

---

## Task 4: Manual verification

Load the extension and confirm all 4 states work on both ChatGPT and Claude.

**Files:** None (browser testing only)

- [ ] **Step 1: Load the extension**

```bash
cd extension && npm run build
```

In Chrome: go to `chrome://extensions`, enable Developer Mode, click "Load unpacked", select the `extension/.output/chrome-mv3` directory.

- [ ] **Step 2: Test on ChatGPT (chat.openai.com)**

1. Open a new chat
2. Confirm widget button is faded (40% opacity) with empty input
3. Type `hey can u help me with somthing` into the input
4. Confirm widget becomes fully opaque and clickable
5. Click the widget — popup should open immediately with 3-dot loading animation
6. Wait for result — polished text should appear with Apply, Copy, Edit buttons (all equal size)
7. Click **Copy** — paste into a text editor to confirm clipboard has the polished text; popup stays open
8. Click **Edit** — text becomes editable in a textarea; Apply and Cancel buttons appear
9. Edit the text, click **Apply** — ChatGPT's input box updates with your edited text; popup closes
10. Type another prompt, click widget, wait for result, click **Apply** from result view — input updates, popup closes
11. Type a prompt, click widget, wait for result, click **✕** — popup closes, input is unchanged

- [ ] **Step 3: Test on Claude (claude.ai)**

Repeat all 11 steps from Step 2 on Claude.

- [ ] **Step 4: Test error handling**

Temporarily disconnect from the internet (turn off WiFi), type a prompt, click widget. The popup should show an error message beginning with `Error:` in the result view rather than hanging or crashing.

- [ ] **Step 5: Final commit if any fixes were needed**

If you made any fixes during manual testing, commit them:

```bash
git add -p  # stage only the files you changed
git commit -m "fix: <describe what needed fixing>"
```
