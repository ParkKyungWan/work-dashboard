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
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/30"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
    >
      <div
        className="w-[320px] rounded-md border border-neutral-900 bg-white p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="confirm-dialog-title"
          className="text-base font-bold text-neutral-900"
        >
          {title}
        </h2>

        {description && (
          <p className="mt-2 whitespace-pre-line text-sm text-neutral-600">
            {description}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-neutral-300 bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-200"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={
              danger
                ? "rounded bg-red-600 px-3 py-1.5 text-sm font-bold text-white hover:bg-red-700"
                : "rounded bg-neutral-900 px-3 py-1.5 text-sm font-bold text-white hover:bg-neutral-800"
            }
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
