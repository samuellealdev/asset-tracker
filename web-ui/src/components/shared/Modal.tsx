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

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the first focusable element inside the modal
      requestAnimationFrame(() => {
        if (panelRef.current) {
          const focusable =
            panelRef.current.querySelectorAll<HTMLElement>(
              FOCUSABLE_SELECTOR,
            );
          if (focusable.length > 0) {
            focusable[0]!.focus();
          } else {
            panelRef.current.focus();
          }
        }
      });

      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
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
        className="relative z-10 mx-4 w-full max-w-2xl max-md:max-h-[95vh] md:max-h-[85vh] rounded-lg bg-slate-800 p-6 shadow-xl transition-all duration-200 flex flex-col overflow-hidden"
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
        {children}
      </div>
    </div>,
    document.body,
  );
}
