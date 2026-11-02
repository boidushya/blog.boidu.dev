"use client";

import debounce from "lodash.debounce";
import { useRouter } from "next/navigation";
import React from "react";
import { createPortal } from "react-dom";

type Block = {
  el: HTMLElement;
  start: number;
  mono: boolean;
  style: React.CSSProperties;
};

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
  h: { label: "Highlight", text: "Mark", before: "==", after: "==" },
};

const findArticle = () => document.querySelector<HTMLElement>("article.blog");

export default function InlineEditor({ id }: { id: string }) {
  const router = useRouter();
  const [enabled, setEnabled] = React.useState(false);
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
    async (el: HTMLElement) => {
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
    if (!enabled || !article) return;
    article.setAttribute("data-inline-edit", "");

    const onClick = (event: MouseEvent) => {
      if (event.metaKey || event.ctrlKey || !(event.target instanceof Element)) return;
      if (event.target.closest(".src-editor")) return;
      const el = event.target.closest(".src-block");
      if (!(el instanceof HTMLElement)) {
        close();
        return;
      }
      if (el.hasAttribute("data-editing")) return;
      event.preventDefault();
      open(el);
    };

    article.addEventListener("click", onClick);
    return () => {
      article.removeEventListener("click", onClick);
      article.removeAttribute("data-inline-edit");
    };
  }, [enabled, open, close]);

  React.useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [text, block]);

  const toggle = () => {
    if (enabled) close();
    setEnabled(!enabled);
  };

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
    if (key === "h" ? !event.shiftKey : event.shiftKey) return;
    const format = FORMATS[key];
    if (!format) return;
    event.preventDefault();
    wrap(format);
  };

  return (
    <>
      <div className="fixed bottom-4 left-4 sm:bottom-12 sm:left-12">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={enabled}
          className={`flex items-center gap-2 px-4 py-2 text-sm leading-none rounded-full btn-glass shadow-deep active:scale-[0.96] ${enabled ? "text-accent-50" : "text-accent-300"}`}
        >
          <span
            aria-hidden="true"
            className={`w-1.5 h-1.5 rounded-full transition-colors ${enabled ? "bg-accent-50" : "bg-accent-600"}`}
          />
          Edit
        </button>
      </div>
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
              autoFocus
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
