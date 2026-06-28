import { useEffect, useRef, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const INPUT_SELECTOR =
  'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled])';

const SCROLLBAR_STYLES = `
.modal-scroll-area::-webkit-scrollbar {
  width: 8px !important;
  height: 8px !important;
}
.modal-scroll-area::-webkit-scrollbar-track {
  background: rgb(30 41 59) !important;
  border-radius: 9999px !important;
}
.modal-scroll-area::-webkit-scrollbar-thumb {
  background: rgb(100 116 139) !important;
  border-radius: 9999px !important;
}
.modal-scroll-area::-webkit-scrollbar-thumb:hover {
  background: rgb(148 163 184) !important;
}
`;

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const titleId = useRef(
    `modal-title-${Math.random().toString(36).slice(2, 9)}`,
  ).current;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          FOCUSABLE_SELECTOR,
        );
        if (focusable.length === 0) return;

        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose],
  );

  // Keep latest handler in a ref so the effect never re-runs due to callback identity
  const handleKeyDownRef = useRef(handleKeyDown);
  handleKeyDownRef.current = handleKeyDown;

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the first input, textarea, or select inside the modal (skip close button)
    requestAnimationFrame(() => {
      if (!panelRef.current) return;

      const input =
        panelRef.current.querySelector<HTMLElement>(INPUT_SELECTOR);
      if (input) {
        input.focus();
        return;
      }

      const focusable =
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length > 0) {
        focusable[0]!.focus();
      } else {
        panelRef.current.focus();
      }
    });

    const onKeyDown = (e: KeyboardEvent) => handleKeyDownRef.current(e);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <style>{SCROLLBAR_STYLES}</style>
      <div
        data-testid="modal-backdrop"
        className="absolute inset-0 bg-black/60 transition-opacity duration-200"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        data-testid="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className="relative z-10 mx-4 w-full max-w-3xl max-md:max-h-[95vh] md:max-h-[90vh] rounded-lg bg-slate-800 p-6 shadow-xl transition-all duration-200 flex flex-col overflow-hidden"
      >
        <div className="mb-4 flex items-center justify-between">
          {title && (
            <h2
              id={titleId}
              className="text-lg font-semibold text-slate-100"
            >
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className={cn(
              "ml-auto rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200",
              !title && "ml-0",
            )}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div
          className="min-h-0 flex-1 overflow-y-auto scrollbar-thin modal-scroll-area pr-2 pb-6"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgb(100 116 139) rgb(30 41 59)",
          }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
