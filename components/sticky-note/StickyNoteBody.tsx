// components/sticky-note/StickyNoteBody.tsx

"use client";

type StickyNoteBodyProps = {
  content: string;
  onContentChange: (content: string) => void;
};

export default function StickyNoteBody({
  content,
  onContentChange,
}: StickyNoteBodyProps) {
  return (
    <div className="h-full bg-transparent px-3 pb-3 pt-2">
      <textarea
        value={content}
        onChange={(event) => onContentChange(event.target.value)}
        placeholder="메모 내용을 입력하세요."
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        className={[
          "h-full w-full resize-none border-none bg-transparent",
          "text-xs leading-5 text-slate-800",
          "outline-none placeholder:text-slate-500/60",
          "scrollbar-soft",
        ].join(" ")}
      />
    </div>
  );
}
