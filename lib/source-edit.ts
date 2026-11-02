import matter from "gray-matter";

export type BlockEdit = { start: number; end: number; expected: string; replacement: string };

export const readBody = (raw: string) => matter(raw).content;

export function applyBlockEdit(raw: string, edit: BlockEdit) {
  if (edit.start < 0 || edit.end < edit.start) return null;
  const offset = raw.length - readBody(raw).length;
  const start = offset + edit.start;
  const end = offset + edit.end;
  if (raw.slice(start, end) !== edit.expected) return null;
  return raw.slice(0, start) + edit.replacement + raw.slice(end);
}
