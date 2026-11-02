"use client";

import debounce from "lodash.debounce";
import { useRouter } from "next/navigation";
import React from "react";
import { createPortal } from "react-dom";

type Block = {
  el: HTMLElement;
  start: number;
  mono: boolean;
  caret: number;
  style: React.CSSProperties;
};

type CaretHint = { word: string; nth: number };

type Status = "saved" | "saving" | "conflict" | "error";

const STATUS_TEXT: Record<Status, string> = {
  saved: "Saved",
  saving: "Saving",
  conflict: "File changed on disk. Press Esc to reload.",
  error: "Save failed",
};

type Format = { label: string; text: string; before: string; after: string };

const FORMATS: Record<string, Format> = {
  b: { label: "Bold", text: "B", before: "**", after: "**" },
  i: { label: "Italic", text: "I", before: "_", after: "_" },
  e: { label: "Code", text: "Code", before: "`", after: "`" },
  k: { label: "Link", text: "Link", before: "[", after: "](https://)" },
};

const findArticle = () => document.querySelector<HTMLElement>("article.blog");

const takeCaretHint = (el: HTMLElement): CaretHint | null => {
  const selection = window.getSelection();
  const word = selection?.toString().trim();
  if (!selection || !word || selection.rangeCount === 0) return null;
  const { startContainer, startOffset } = selection.getRangeAt(0);
  const before = document.createRange();
  before.selectNodeContents(el);
  before.setEnd(startContainer, startOffset);
  selection.removeAllRanges();
  return { word, nth: before.toString().split(word).length - 1 };
};

const findCaret = (source: string, hint: CaretHint | null) => {
  if (!hint) return source.length;
  let index = -1;
  for (let n = 0; n <= hint.nth; n++) {
    const next = source.indexOf(hint.word, index + 1);
    if (next === -1) break;
    index = next;
  }
  return index === -1 ? source.length : index;
};

export default function InlineEditor({ id }: { id: string }) {
  const router = useRouter();
  const [block, setBlock] = React.useState<Block | null>(null);
  const [text, setText] = React.useState("");
  const [status, setStatus] = React.useState<Status>("saved");
  const blockRef = React.useRef<Block | null>(null);
  const persisted = React.useRef({ end: 0, expected: "" });
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const saveQueue = React.useRef<Promise<void>>(Promise.resolve());
  const openRequest = React.useRef(0);

  const save = React.useMemo(() => {
    const put = async (start: number, replacement: string) => {
      const { end, expected } = persisted.current;
      try {
        const response = await fetch("/api/edit", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, start, end, expected, replacement }),
        });
        if (response.status === 204) {
          persisted.current = { end: start + replacement.length, expected: replacement };
          setStatus("saved");
        } else {
          setStatus(response.status === 409 ? "conflict" : "error");
        }
      } catch (error) {
        console.error("Error saving block:", error);
        setStatus("error");
      }
    };
    return debounce((start: number, replacement: string) => {
      saveQueue.current = saveQueue.current.then(() => put(start, replacement));
      return saveQueue.current;
    }, 500);
  }, [id]);

  const close = React.useCallback(async () => {
    const current = blockRef.current;
    blockRef.current = null;
    openRequest.current++;
    if (!current) return;
    await save.flush();
    current.el.removeAttribute("data-editing");
    setBlock(null);
    router.refresh();
  }, [save, router]);

  const open = React.useCallback(
    async (el: HTMLElement, hint: CaretHint | null) => {
      await close();
      const request = openRequest.current;
      const start = Number(el.dataset.srcStart);
      const end = Number(el.dataset.srcEnd);
      try {
        const response = await fetch(`/api/edit?id=${encodeURIComponent(id)}`);
        if (!response.ok) throw new Error(`Unexpected status ${response.status}`);
        const { body }: { body: string } = await response.json();
        if (request !== openRequest.current) return;
        const source = body.slice(start, end);
        const mono = source.startsWith("```");
        const computed = getComputedStyle(el.firstElementChild ?? el);
        const next: Block = {
          el,
          start,
          mono,
          caret: findCaret(source, hint),
          style: {
            ...(mono ? {} : { fontSize: computed.fontSize, lineHeight: computed.lineHeight }),
            fontWeight: computed.fontWeight,
            letterSpacing: computed.letterSpacing,
            color: computed.color,
          },
        };
        persisted.current = { end, expected: source };
        blockRef.current = next;
        el.setAttribute("data-editing", "");
        setText(source);
        setStatus("saved");
        setBlock(next);
      } catch (error) {
        console.error("Error loading post source:", error);
      }
    },
    [id, close]
  );

  React.useEffect(() => {
    const article = findArticle();
    if (!article) return;

    const onDoubleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || event.target.closest(".src-editor")) return;
      const el = event.target.closest(".src-block");
      if (!(el instanceof HTMLElement) || el.hasAttribute("data-editing")) return;
      open(el, takeCaretHint(el));
    };

    const onClick = (event: MouseEvent) => {
      if (!blockRef.current || !(event.target instanceof Element)) return;
      if (!event.target.closest(".src-editor")) close();
    };

    article.addEventListener("dblclick", onDoubleClick);
    article.addEventListener("click", onClick);
    return () => {
      article.removeEventListener("dblclick", onDoubleClick);
      article.removeEventListener("click", onClick);
    };
  }, [open, close]);

  React.useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [text, block]);

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !block) return;
    textarea.focus();
    textarea.setSelectionRange(block.caret, block.caret);
  }, [block]);

  const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!block) return;
    const { value } = event.target;
    setText(value);
    setStatus(current => (current === "conflict" ? current : "saving"));
    save(block.start, value);
  };

  const wrap = ({ before, after }: Format) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const selected = value.slice(selectionStart, selectionEnd);
    textarea.focus();
    document.execCommand("insertText", false, before + selected + after);
    const selectionFrom = selectionStart + before.length;
    textarea.setSelectionRange(selectionFrom, selectionFrom + selected.length);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = event.metaKey || event.ctrlKey;
    if (event.key === "Escape" || (mod && event.key === "Enter")) {
      event.preventDefault();
      close();
      return;
    }
    if (!mod) return;
    const key = event.key.toLowerCase();
    if (event.shiftKey) return;
    const format = FORMATS[key];
    if (!format) return;
    event.preventDefault();
    wrap(format);
  };

  return (
    <>
      {block &&
        createPortal(
          <div className="my-4 src-editor">
            <div className="flex flex-wrap items-center gap-1 mb-2 text-xs">
              {Object.values(FORMATS).map(format => (
                <button
                  key={format.label}
                  type="button"
                  aria-label={format.label}
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => wrap(format)}
                  className="px-2 py-1 leading-none rounded-md btn-glass text-accent-200 active:scale-[0.96]"
                >
                  {format.text}
                </button>
              ))}
              <span
                role="status"
                className={`ml-auto tabular-nums ${status === "conflict" || status === "error" ? "text-red-400" : "text-accent-300"}`}
              >
                {STATUS_TEXT[status]}
              </span>
            </div>
            <textarea
              ref={textareaRef}
              aria-label="Edit block source"
              value={text}
              onChange={onChange}
              onKeyDown={onKeyDown}
              spellCheck={!block.mono}
              style={block.style}
              className={`w-full pb-1 overflow-hidden bg-transparent border-b border-dashed outline-none resize-none border-accent-800 focus:border-accent-500 ${block.mono ? "font-mono text-sm" : ""}`}
            />
          </div>,
          block.el
        )}
    </>
  );
}
