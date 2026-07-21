// components/common/ConfirmDialog.tsx

"use client";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "확인",
  cancelText = "취소",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-950/20 px-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[340px] rounded-2xl bg-white p-5 ring-1 ring-black/[0.04] shadow-[0_18px_50px_rgba(15,23,42,0.16),0_4px_14px_rgba(15,23,42,0.06)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={[
              "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full",
              danger ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-600",
            ].join(" ")}
            aria-hidden="true"
          >
            {danger ? (
              <svg viewBox="0 0 20 20" fill="none" className="size-4">
                <path
                  d="M10 6.5v4M10 13.5h.01M8.2 3.9 3.1 13a2 2 0 0 0 1.75 3h10.3a2 2 0 0 0 1.75-3L11.8 3.9a2 2 0 0 0-3.6 0Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="none" className="size-4">
                <path
                  d="M10 5.5v5M10 13.5h.01"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle
                  cx="10"
                  cy="10"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2
              id="confirm-dialog-title"
              className="text-[15px] font-semibold leading-5 text-slate-900"
            >
              {title}
            </h2>

            {description && (
              <p className="mt-1.5 whitespace-pre-line text-[13px] leading-5 text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-lg bg-slate-100 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-800 active:bg-slate-300"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={[
              "h-9 rounded-lg text-[13px] font-semibold transition",
              danger
                ? "bg-red-500 text-[#fff] shadow-[0_2px_6px_rgba(239,68,68,0.2)] hover:bg-red-600 active:bg-red-700"
                : "bg-strong text-on-strong shadow-[0_2px_6px_rgba(15,23,42,0.14)] hover:bg-strong-hover",
            ].join(" ")}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
