// components/sticky-note/StickyNoteBody.tsx

"use client";

import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
  type Ref,
} from "react";

export type StickyNoteTextFormat =
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough";

export type StickyNoteBodyHandle = {
  applyFormat: (format: StickyNoteTextFormat) => void;
};

type StickyNoteBodyProps = {
  ref?: Ref<StickyNoteBodyHandle>;
  content: string;
  highlightQuery?: string;
  onContentChange: (content: string) => void;
};

const ALLOWED_TAGS = new Set([
  "B",
  "BR",
  "DIV",
  "EM",
  "I",
  "P",
  "S",
  "STRIKE",
  "STRONG",
  "U",
]);

const REMOVED_TAGS = new Set(["SCRIPT", "STYLE"]);

function sanitizeEditorHtml(html: string) {
  const template = document.createElement("template");
  template.innerHTML = html;

  const sanitizeNode = (parent: ParentNode) => {
    Array.from(parent.childNodes).forEach((node) => {
      if (!(node instanceof HTMLElement)) {
        return;
      }

      if (REMOVED_TAGS.has(node.tagName)) {
        node.remove();
        return;
      }

      sanitizeNode(node);

      if (!ALLOWED_TAGS.has(node.tagName)) {
        node.replaceWith(...Array.from(node.childNodes));
        return;
      }

      Array.from(node.attributes).forEach((attribute) => {
        node.removeAttribute(attribute.name);
      });
    });
  };

  sanitizeNode(template.content);

  if ((template.content.textContent ?? "").trim() === "") {
    return "";
  }

  return template.innerHTML;
}

export default function StickyNoteBody({
  ref,
  content,
  highlightQuery = "",
  onContentChange,
}: StickyNoteBodyProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const appliedHighlightQueryRef = useRef("");

  const syncContent = () => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    onContentChange(sanitizeEditorHtml(editor.innerHTML));
  };

  const applyFormat = (format: StickyNoteTextFormat) => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    editor.focus();
    document.execCommand(format, false);
    syncContent();
  };

  useImperativeHandle(ref, () => ({ applyFormat }));

  useLayoutEffect(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const sanitizedContent = sanitizeEditorHtml(content);

    const query = highlightQuery.trim();
    if (!query) {
      appliedHighlightQueryRef.current = "";
      if (editor.innerHTML !== sanitizedContent) editor.innerHTML = sanitizedContent;
      return;
    }

    if (
      appliedHighlightQueryRef.current === query &&
      editor.querySelector("mark[data-search-highlight]")
    ) {
      return;
    }

    editor.innerHTML = sanitizedContent;
    appliedHighlightQueryRef.current = query;

    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    let currentNode = walker.nextNode();
    while (currentNode) {
      textNodes.push(currentNode as Text);
      currentNode = walker.nextNode();
    }

    const lowerQuery = query.toLocaleLowerCase("ko-KR");
    textNodes.forEach((textNode) => {
      const text = textNode.data;
      const lowerText = text.toLocaleLowerCase("ko-KR");
      let cursor = 0;
      let matchIndex = lowerText.indexOf(lowerQuery, cursor);
      if (matchIndex < 0) return;

      const fragment = document.createDocumentFragment();
      while (matchIndex >= 0) {
        fragment.append(text.slice(cursor, matchIndex));
        const mark = document.createElement("mark");
        mark.dataset.searchHighlight = "true";
        mark.className = "search-highlight";
        mark.textContent = text.slice(matchIndex, matchIndex + query.length);
        fragment.append(mark);
        cursor = matchIndex + query.length;
        matchIndex = lowerText.indexOf(lowerQuery, cursor);
      }
      fragment.append(text.slice(cursor));
      textNode.replaceWith(fragment);
    });

    editor.querySelector<HTMLElement>("mark[data-search-highlight]")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [content, highlightQuery]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }
    if (event.shiftKey && event.key.toLowerCase() === "x") {
      event.preventDefault();
      applyFormat("strikeThrough");
      return;
    }
    const formatByKey: Partial<Record<string, StickyNoteTextFormat>> = {
      b: "bold",
      i: "italic",
      u: "underline",
    };

    const format = formatByKey[event.key.toLowerCase()];

    if (!format) {
      return;
    }

    event.preventDefault();
    applyFormat(format);
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();

    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    syncContent();
  };

  return (
    <div className="h-full bg-transparent py-2 pl-3 pr-1">
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="스티커 메모 내용"
        data-placeholder="메모 내용을 입력하세요."
        style={{
          font: "inherit",
          outline: "none",
        }}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        onInput={syncContent}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className={[
          "h-full w-full overflow-y-auto border-0 bg-transparent",
          "whitespace-pre-wrap break-words pr-2",
          "sticky-note-content text-slate-800",
          "outline-none ring-0 shadow-none",
          "focus:outline-none focus:ring-0 focus:shadow-none",
          "focus-visible:outline-none focus-visible:ring-0",
          "empty:before:pointer-events-none empty:before:text-slate-500/60",
          "empty:before:content-[attr(data-placeholder)]",
          "scrollbar-soft",
        ].join(" ")}
      />
    </div>
  );
}
