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

  // Transition loading → result when text arrives, and back to loading when cleared
  useEffect(() => {
    if (polishedText !== null) {
      setState('result');
    } else {
      setState('loading');
      setEditText('');
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
    // Right-align popup with the widget button (host is fixed at 0,0 so these are viewport coords)
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
            maxHeight: 180,
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
  const isAuthError = polishedText?.toLowerCase().includes('sign in') ?? false;
  const isLimitError = polishedText?.toLowerCase().includes('limit') ?? false;
  const displayText = polishedText?.replace(/^Error:\s*/i, '') ?? '';

  let headerLabel = 'Polished';
  if (isAuthError) headerLabel = 'Sign in required';
  else if (isLimitError) headerLabel = 'Limit reached';

  return (
    <div style={wrapStyle}>
      <div style={headerStyle}>
        <div style={labelStyle}>
          <div style={dotIndicatorStyle} />
          {headerLabel}
        </div>
        <button style={dismissBtnStyle} onClick={onDismiss} title="Dismiss">✕</button>
      </div>
      <div
        style={{
          color: COLORS.text,
          fontSize: 12,
          lineHeight: 1.6,
          maxHeight: 180,
          overflowY: 'auto',
        }}
      >
        {displayText}
      </div>
      <div style={actionsStyle}>
        {isAuthError ? (
          <button
            style={btnPrimary}
            onClick={() => window.open('https://polishify.app/sign-in', '_blank')}
          >
            Sign in
          </button>
        ) : isLimitError ? (
          <button
            style={btnPrimary}
            onClick={() => window.open('https://polishify.app/pricing', '_blank')}
          >
            Upgrade
          </button>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
