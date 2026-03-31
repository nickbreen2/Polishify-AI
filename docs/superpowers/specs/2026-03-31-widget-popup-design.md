# Widget Popup — Design Spec
**Date:** 2026-03-31
**Status:** Approved

---

## Context

The Polishly AI extension already injects a small widget button (✦) into ChatGPT and Claude's chat input boxes. When a user has typed a prompt, clicking the widget should polish it and show the result in a popup — letting them apply, copy, or edit the polished version before sending. This replaces the previous no-op click on the widget and completes the core in-context polishing workflow.

---

## Decisions

| Question | Decision |
|---|---|
| Popup position | Anchored above the input box (same shadow DOM as widget) |
| Buttons | Apply · Copy · Edit — all equal size |
| Apply | Replaces prompt text via `adapter.setText()`, closes popup |
| Copy | Copies polished text to clipboard |
| Edit | Toggles polished text into an editable field inside popup |
| Cancel (in edit mode) | Reverts to result view (state ③) |
| Loading | Popup opens immediately with loading animation, text appears when ready |
| Widget when empty | Already handled — 40% opacity, non-clickable (`isActive` flag) |

---

## Architecture

### New file
- `extension/components/PolishPopup.tsx` — the popup UI component

### Modified files
- `extension/components/PolishWidget.tsx` — add `onClick` prop, wire up disabled state
- `extension/components/WidgetContainer.tsx` — own popup state, trigger API call, pass adapter down to popup

### Unchanged
- `extension/lib/adapters/` — no changes needed
- `extension/entrypoints/background.ts` — existing `POLISH_REQUEST` message already handles the API call
- `extension/components/Popover.tsx` — kept for text-selection flow, untouched

---

## Component Design

### `PolishPopup.tsx`

**Props:**
```typescript
interface PolishPopupProps {
  polishedText: string | null   // null = loading state
  onApply: (text: string) => void
  onCopy: (text: string) => void
  onDismiss: () => void
}
```

**Internal state:**
```typescript
type PopupState = 'loading' | 'result' | 'edit'
editText: string   // tracks edits in edit mode
```

**State machine:**
- `loading` → `result` when `polishedText` prop changes from null to string
- `result` → `edit` when Edit clicked (seeds `editText` from `polishedText`)
- `edit` → `result` when Cancel clicked (discards `editText`)
- Any state → unmounted when Apply or dismiss ✕ clicked

**Rendering per state:**

| State | Header | Body | Buttons |
|---|---|---|---|
| `loading` | "POLISHING..." | 3-dot pulse animation | — |
| `result` | "POLISHED" + ✕ | Polished text (read-only) | Apply · Copy · Edit |
| `edit` | "EDIT" + ✕ | `<textarea>` pre-filled with polished text | Apply · Cancel |

**Positioning:** Absolutely positioned above the input container. `WidgetContainer` controls visibility by mounting/unmounting. Uses existing shadow DOM (`#polishify-widget-root`) — no new shadow host needed.

---

### `WidgetContainer.tsx` changes

Add state:
```typescript
const [popupOpen, setPopupOpen] = useState(false)
const [polishedText, setPolishedText] = useState<string | null>(null)
```

Add handler:
```typescript
const handleWidgetClick = async () => {
  if (!isActive) return
  setPolishedText(null)   // reset to loading state
  setPopupOpen(true)      // open popup immediately

  // send POLISH_REQUEST to background worker (existing message type)
  const text = adapter.getText()
  browser.runtime.sendMessage({ type: 'POLISH_REQUEST', text })
    .then(response => {
      if (response.type === 'POLISH_RESPONSE') {
        setPolishedText(response.polishedText)
      }
    })
}
```

Pass `handleWidgetClick` as `onClick` to `PolishWidget`.

**Apply handler** (passed to `PolishPopup`):
```typescript
const handleApply = (text: string) => {
  adapter.setText(text)
  setPopupOpen(false)
}
```

---

### `PolishWidget.tsx` changes

- Accept `onClick` and `isActive` props (both passed down from `WidgetContainer`)
- `isActive` stays owned by `WidgetContainer` (already tracks text via `onTextChange`)
- `onClick` only fires when `isActive` is true

---

## Data Flow

```
User types prompt
  → adapter.onTextChange() fires
  → WidgetContainer sets isActive = true
  → PolishWidget renders at full opacity, cursor:pointer

User clicks widget
  → handleWidgetClick() runs
  → setPopupOpen(true), setPolishedText(null)
  → PolishPopup mounts in loading state
  → POLISH_REQUEST sent to background worker
  → background calls polishify.app/api/rewrite
  → POLISH_RESPONSE received
  → setPolishedText(response.polishedText)
  → PolishPopup transitions to result state

User clicks Apply
  → adapter.setText(polishedText)
  → setPopupOpen(false) → PolishPopup unmounts

User clicks Copy
  → navigator.clipboard.writeText(polishedText)
  → (popup stays open)

User clicks Edit
  → popup transitions to edit state
  → text becomes editable

User clicks Apply in edit mode
  → adapter.setText(editText)
  → setPopupOpen(false) → PolishPopup unmounts

User clicks Cancel in edit mode
  → popup reverts to result state

User clicks ✕
  → setPopupOpen(false) → PolishPopup unmounts
```

---

## Error Handling

If the API call fails (`POLISH_ERROR` response), the error message is shown as text in the result view. The user can dismiss the popup and click the widget again to retry. No dedicated "Try again" button — the dismiss + re-click flow is sufficient for v1.

---

## Verification

1. Open ChatGPT or Claude in browser with extension loaded
2. Confirm widget is faded with empty input
3. Type a prompt — confirm widget becomes fully opaque and clickable
4. Click widget — popup appears immediately with loading animation
5. Loading resolves — polished text appears with Apply · Copy · Edit
6. Click Copy — verify clipboard contains polished text, popup stays open
7. Click Edit — text becomes editable, Apply/Cancel shown
8. Edit text, click Apply — prompt input updates with edited text, popup closes
9. Repeat with Apply from result state — original prompt replaced, popup closes
10. Click ✕ on popup — closes without changing prompt
11. Test on both ChatGPT (`#prompt-textarea`) and Claude (`[data-testid="chat-input"]`)
