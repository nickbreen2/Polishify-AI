"use client";

import * as React from "react";
import clsx from "clsx";

type Props = {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
};

export function AnimatedPolishButton({ loading, disabled, onClick }: Props) {
  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-label={loading ? "Polishifying" : "Polishify"}
        aria-pressed={loading}
        disabled={disabled}
        onClick={onClick}
        className={clsx(
          "ui-polish-btn",
          "relative flex items-center justify-center cursor-pointer select-none",
          "rounded-[20px] px-3.5 py-1.5",
          "border border-[#2548D2]/40",
          "transition-[box-shadow,border,background-color] duration-400"
        )}
      >
        {/* Sparkles icon */}
        <svg
          className="ui-polish-btn-svg mr-2 h-[18px] w-[18px] flex-shrink-0 fill-white"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
          />
        </svg>

        {/* Text — re-mounts on state change, restarting the letter shimmer */}
        <div
          key={loading ? "active" : "idle"}
          className="ui-polish-txt-wrapper text-sm font-medium whitespace-nowrap"
        >
          {Array.from(loading ? "Polishifying…" : "Polishify").map((ch, i) => (
            <span key={i} className="ui-polish-letter inline-block">
              {ch}
            </span>
          ))}
        </div>
      </button>

      <style jsx>{`
        .ui-polish-btn {
          --padding: 4px;
          --radius: 20px;
          --transition: 0.4s;
          --highlight: hsla(215, 100%, 80%, 1);
          --highlight-50: hsla(215, 100%, 80%, 0.5);
          --highlight-30: hsla(215, 100%, 80%, 0.3);
          --highlight-20: hsla(215, 100%, 80%, 0.2);
          --highlight-80: hsla(215, 100%, 80%, 0.8);
          background-image: linear-gradient(to bottom, #456bff, #2548d2);
          box-shadow:
            inset 0px 1px 1px rgba(255, 255, 255, 0.3),
            inset 0px 2px 2px rgba(255, 255, 255, 0.2),
            inset 0px 4px 4px rgba(255, 255, 255, 0.1),
            0 2px 10px rgba(69, 107, 255, 0.45);
        }

        .ui-polish-btn::before {
          content: "";
          position: absolute;
          top: calc(0px - var(--padding));
          left: calc(0px - var(--padding));
          width: calc(100% + var(--padding) * 2);
          height: calc(100% + var(--padding) * 2);
          border-radius: calc(var(--radius) + var(--padding));
          pointer-events: none;
          background-image: linear-gradient(0deg, rgba(37, 72, 210, 0.5), rgba(69, 107, 255, 0.7));
          z-index: -1;
          transition: box-shadow var(--transition), filter var(--transition);
          box-shadow:
            0 -8px 8px -6px #0000 inset,
            0 -16px 16px -8px #00000000 inset,
            1px 1px 1px rgba(255, 255, 255, 0.2),
            2px 2px 2px rgba(255, 255, 255, 0.1),
            -1px -1px 1px rgba(0, 0, 0, 0.1),
            -2px -2px 2px rgba(0, 0, 0, 0.05);
        }

        .ui-polish-btn::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background-image: linear-gradient(
            0deg,
            #fff,
            var(--highlight),
            var(--highlight-50),
            8%,
            transparent
          );
          background-position: 0 0;
          opacity: 0;
          transition: opacity var(--transition), filter var(--transition);
        }

        /* Per-letter shimmer */
        .ui-polish-letter {
          color: rgba(255, 255, 255, 0.82);
          animation: ui-polish-letter-anim 2.2s ease-in-out infinite;
          transition: color var(--transition), text-shadow var(--transition);
        }

        @keyframes ui-polish-letter-anim {
          50% {
            text-shadow: 0 0 5px rgba(255, 255, 255, 0.95);
            color: #fff;
          }
        }

        /* SVG sparkle flicker */
        .ui-polish-btn-svg {
          filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.75));
          animation: ui-polish-flicker 2s linear infinite;
          animation-delay: 0.5s;
          transition: fill var(--transition), filter var(--transition);
        }

        @keyframes ui-polish-flicker {
          50% {
            opacity: 0.35;
          }
        }

        /* Hover */
        .ui-polish-btn:hover {
          border-color: rgba(150, 185, 255, 0.6);
        }
        .ui-polish-btn:hover::before {
          box-shadow:
            0 -8px 8px -6px rgba(255, 255, 255, 0.7) inset,
            0 -16px 16px -8px var(--highlight-30) inset,
            1px 1px 1px rgba(255, 255, 255, 0.2),
            2px 2px 2px rgba(255, 255, 255, 0.1),
            -1px -1px 1px rgba(0, 0, 0, 0.1),
            -2px -2px 2px rgba(0, 0, 0, 0.05);
        }
        .ui-polish-btn:hover::after {
          opacity: 0.45;
          -webkit-mask-image: linear-gradient(0deg, #fff, transparent);
          mask-image: linear-gradient(0deg, #fff, transparent);
        }
        .ui-polish-btn:hover .ui-polish-btn-svg {
          fill: #fff;
          filter: drop-shadow(0 0 5px var(--highlight)) drop-shadow(0 -3px 5px rgba(0, 0, 0, 0.25));
          animation: none;
        }

        /* Active / pressed */
        .ui-polish-btn:active {
          border-color: rgba(160, 205, 255, 0.8);
          background-image: linear-gradient(to bottom, #5a7fff, #2548d2);
        }
        .ui-polish-btn:active::before {
          box-shadow:
            0 -8px 12px -6px rgba(255, 255, 255, 0.85) inset,
            0 -16px 16px -8px var(--highlight-80) inset,
            1px 1px 1px rgba(255, 255, 255, 0.3),
            2px 2px 2px rgba(255, 255, 255, 0.15),
            -1px -1px 1px rgba(0, 0, 0, 0.1),
            -2px -2px 2px rgba(0, 0, 0, 0.05);
        }
        .ui-polish-btn:active::after {
          opacity: 0.85;
          -webkit-mask-image: linear-gradient(0deg, #fff, transparent);
          mask-image: linear-gradient(0deg, #fff, transparent);
          filter: brightness(200%);
        }
        .ui-polish-btn:active .ui-polish-letter {
          text-shadow: 0 0 2px rgba(200, 225, 255, 0.9);
          animation: none;
          color: #fff;
        }

        /* Disabled */
        .ui-polish-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Letter stagger — covers up to 13 chars ("Polishifying…") */
        .ui-polish-txt-1 .ui-polish-letter:nth-child(1),
        .ui-polish-txt-2 .ui-polish-letter:nth-child(1) { animation-delay: 0s; }
        .ui-polish-txt-1 .ui-polish-letter:nth-child(2),
        .ui-polish-txt-2 .ui-polish-letter:nth-child(2) { animation-delay: 0.1s; }
        .ui-polish-txt-1 .ui-polish-letter:nth-child(3),
        .ui-polish-txt-2 .ui-polish-letter:nth-child(3) { animation-delay: 0.2s; }
        .ui-polish-txt-1 .ui-polish-letter:nth-child(4),
        .ui-polish-txt-2 .ui-polish-letter:nth-child(4) { animation-delay: 0.3s; }
        .ui-polish-txt-1 .ui-polish-letter:nth-child(5),
        .ui-polish-txt-2 .ui-polish-letter:nth-child(5) { animation-delay: 0.4s; }
        .ui-polish-txt-1 .ui-polish-letter:nth-child(6),
        .ui-polish-txt-2 .ui-polish-letter:nth-child(6) { animation-delay: 0.5s; }
        .ui-polish-txt-1 .ui-polish-letter:nth-child(7),
        .ui-polish-txt-2 .ui-polish-letter:nth-child(7) { animation-delay: 0.6s; }
        .ui-polish-txt-1 .ui-polish-letter:nth-child(8),
        .ui-polish-txt-2 .ui-polish-letter:nth-child(8) { animation-delay: 0.7s; }
        .ui-polish-txt-1 .ui-polish-letter:nth-child(9),
        .ui-polish-txt-2 .ui-polish-letter:nth-child(9) { animation-delay: 0.8s; }
        .ui-polish-txt-1 .ui-polish-letter:nth-child(10),
        .ui-polish-txt-2 .ui-polish-letter:nth-child(10) { animation-delay: 0.9s; }
        .ui-polish-txt-1 .ui-polish-letter:nth-child(11),
        .ui-polish-txt-2 .ui-polish-letter:nth-child(11) { animation-delay: 1.0s; }
        .ui-polish-txt-1 .ui-polish-letter:nth-child(12),
        .ui-polish-txt-2 .ui-polish-letter:nth-child(12) { animation-delay: 1.1s; }
        .ui-polish-txt-1 .ui-polish-letter:nth-child(13),
        .ui-polish-txt-2 .ui-polish-letter:nth-child(13) { animation-delay: 1.2s; }
      `}</style>
    </div>
  );
}
