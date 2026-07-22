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

function getContentPreview(content: string) {
  return content
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(?:div|p)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export default function StickyNoteHeader({
  content,
  postItColor,
  isDocked,
  isPreview,
  onCollapse,
  onDeleteRequest,
  onOpen,
}: StickyNoteHeaderProps) {
  const contentPreview = getContentPreview(content);

  if (isDocked || isPreview) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={[
          "flex h-9 w-full items-center px-3 text-left",
          "sticky-note-surface sticky-note-content text-xs font-medium text-slate-700",
          "transition hover:brightness-[0.98]",
        ].join(" ")}
        style={{ backgroundColor: postItColor }}
        title="스티커 열기"
        aria-label="스티커 열기"
      >
        <span className="min-w-0 flex-1 truncate">
          {contentPreview || "빈 메모"}
        </span>

        <span
          className="ml-2 shrink-0 text-[9px] text-slate-500/70"
          aria-hidden="true"
        >
          ◀
        </span>
      </button>
    );
  }

  return (
    <div
      className="sticky-note-surface flex h-8 w-full items-center justify-between px-2.5"
      style={{ backgroundColor: postItColor }}
    >
      <span
        className="grid shrink-0 cursor-move grid-cols-3 gap-[2px] rounded-md p-1"
        aria-hidden="true"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <span
            key={index}
            className="size-[2.5px] rounded-full bg-slate-500/55"
          />
        ))}
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onCollapse}
          className={[
            "h-6 rounded-md px-2",
            "text-[10px] font-semibold text-slate-600",
            "transition hover:bg-black/[0.045] hover:text-slate-800",
          ].join(" ")}
          title="스티커 숨기기"
        >
          숨기기
        </button>

        <button
          type="button"
          onClick={onDeleteRequest}
          className={[
            "grid size-6 place-items-center rounded-md",
            "text-xs font-medium text-slate-500",
            "transition hover:bg-red-50 hover:text-red-500",
          ].join(" ")}
          title="스티커 삭제"
          aria-label="스티커 삭제"
        >
          ×
        </button>
      </div>
    </div>
  );
}
