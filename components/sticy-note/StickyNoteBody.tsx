// components/sticky-note/StickyNoteBody.tsx

"use client";

type StickyNoteBodyProps = {
  content: string;
};

export default function StickyNoteBody({ content }: StickyNoteBodyProps) {
  return (
    <div className="border-t border-neutral-200 bg-white p-2 text-xs text-neutral-700">
      {content || "메모 내용이 없습니다."}
    </div>
  );
}
