// components/sticky-note/StickyNoteHeader.tsx

"use client";

type StickyNoteHeaderProps = {
  content: string;
  postItColor: string;

  isDocked: boolean;
  isPreview: boolean;

  onCollapse: () => void;
  onDeleteRequest: () => void;
  onOpen: () => void;
};

export default function StickyNoteHeader({
  content,
  postItColor,
  isDocked,
  isPreview,
  onCollapse,
  onDeleteRequest,
  onOpen,
}: StickyNoteHeaderProps) {
  if (isDocked || isPreview) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex h-8 w-full items-center px-2 text-left text-xs text-neutral-700"
        style={{
          backgroundColor: postItColor,
        }}
        title="스티커 열기"
        aria-label="스티커 열기"
      >
        <span className="truncate">{content.trim() || "빈 메모"}</span>
      </button>
    );
  }

  return (
    <div
      className="flex h-7 w-full items-center justify-end gap-2 px-2 text-xs"
      style={{
        backgroundColor: postItColor,
      }}
    >
      <button
        type="button"
        onClick={onCollapse}
        className="leading-none text-neutral-700 hover:text-neutral-950"
        title="스티커 숨기기"
      >
        숨기기
      </button>

      <button
        type="button"
        onClick={onDeleteRequest}
        className="leading-none text-neutral-700 hover:text-red-600"
        title="스티커 삭제"
        aria-label="스티커 삭제"
      >
        X
      </button>
    </div>
  );
}
