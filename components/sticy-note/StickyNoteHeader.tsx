// components/sticky-note/StickyNoteHeader.tsx

"use client";

type StickyNoteHeaderProps = {
  title: string;
  content: string;
  postItColor: string;
  isDocked: boolean;
  isPreview: boolean;
  onCollapse: () => void;
  onDeleteRequest: () => void;
  onOpen: () => void;
};

export default function StickyNoteHeader({
  title,
  content,
  postItColor,
  isDocked,
  isPreview,
  onCollapse,
  onDeleteRequest,
  onOpen,
}: StickyNoteHeaderProps) {
  return (
    <div
      className="relative flex h-[150px] items-center justify-center border-b border-neutral-900"
      style={{ backgroundColor: postItColor }}
      onClick={isPreview ? onOpen : undefined}
    >
      {!isDocked && (
        <div className="absolute right-2 top-2 flex items-center gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onCollapse();
            }}
            className="text-lg font-extrabold text-red-600"
            title="오른쪽으로 숨기기"
          >
            숨기기
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDeleteRequest();
            }}
            className="text-2xl font-extrabold text-red-600"
            title="완전히 삭제"
          >
            X
          </button>
        </div>
      )}

      <div className="px-4 text-center">
        <div className="text-2xl font-extrabold text-black">
          {isDocked ? "필기" : title}
        </div>

        {isPreview && (
          <p className="mt-2 line-clamp-2 text-xs text-neutral-700">
            {content || "내용 없음"}
          </p>
        )}
      </div>
    </div>
  );
}
