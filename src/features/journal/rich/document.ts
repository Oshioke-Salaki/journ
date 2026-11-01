import { ALIGNS, COLOR_VALUES, FONT_VALUES, HIGHLIGHT_VALUES, SIZE_VALUES } from "./palette";

/**
 * Journal documents are ProseMirror JSON. Everything that reaches the database goes through
 * `sanitizeDoc`: unknown nodes and marks are dropped, and attribute values must come from the
 * palette, so nothing a client sends can inject markup or styles.
 */

export type DocNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
};

const BLOCKS = new Set(["paragraph", "heading", "bulletList", "orderedList", "listItem", "taskList", "taskItem", "blockquote", "horizontalRule", "hardBreak", "text"]);
const SIMPLE_MARKS = new Set(["bold", "italic", "underline", "strike"]);
const MAX_NODES = 20_000;
const MAX_TEXT = 50_000;

export class InvalidDocument extends Error {}

function cleanAttrs(node: DocNode): Record<string, unknown> | undefined {
  const a = node.attrs ?? {};
  switch (node.type) {
    case "heading":
      return { level: a.level === 3 ? 3 : 2, ...(ALIGNS.includes(a.textAlign as never) && a.textAlign !== "left" ? { textAlign: a.textAlign } : {}) };
    case "paragraph":
      return ALIGNS.includes(a.textAlign as never) && a.textAlign !== "left" ? { textAlign: a.textAlign } : undefined;
    case "orderedList": {
      const start = Number(a.start);
      return Number.isInteger(start) && start >= 1 && start <= 10_000 ? { start } : undefined;
    }
    case "taskItem":
      return { checked: a.checked === true };
    default:
      return undefined;
  }
}

function cleanMarks(marks: DocNode["marks"]) {
  const out: NonNullable<DocNode["marks"]> = [];
  for (const mark of marks ?? []) {
    if (SIMPLE_MARKS.has(mark.type)) out.push({ type: mark.type });
    else if (mark.type === "highlight") {
      const color = mark.attrs?.color;
      if (typeof color === "string" && HIGHLIGHT_VALUES.has(color)) out.push({ type: "highlight", attrs: { color } });
    } else if (mark.type === "textStyle") {
      const a = mark.attrs ?? {};
      const attrs: Record<string, string> = {};
      if (typeof a.color === "string" && COLOR_VALUES.has(a.color)) attrs.color = a.color;
      if (typeof a.fontFamily === "string" && FONT_VALUES.has(a.fontFamily)) attrs.fontFamily = a.fontFamily;
      if (typeof a.fontSize === "string" && SIZE_VALUES.has(a.fontSize)) attrs.fontSize = a.fontSize;
      if (Object.keys(attrs).length) out.push({ type: "textStyle", attrs });
    }
  }
  return out.length ? out : undefined;
}

export function sanitizeDoc(input: unknown): DocNode {
  if (!input || typeof input !== "object" || (input as DocNode).type !== "doc") throw new InvalidDocument("Not a document");
  let count = 0;
  let textLength = 0;

  const walk = (node: DocNode): DocNode | null => {
    if (++count > MAX_NODES) throw new InvalidDocument("Document too large");
    if (!node || typeof node !== "object" || !BLOCKS.has(node.type)) return null;
    if (node.type === "text") {
      if (typeof node.text !== "string" || node.text === "") return null;
      textLength += node.text.length;
      if (textLength > MAX_TEXT) throw new InvalidDocument("Entry too long");
      const marks = cleanMarks(node.marks);
      return marks ? { type: "text", text: node.text, marks } : { type: "text", text: node.text };
    }
    const attrs = cleanAttrs(node);
    const content = Array.isArray(node.content) ? node.content.map(walk).filter((n): n is DocNode => n !== null) : undefined;
    return { type: node.type, ...(attrs ? { attrs } : {}), ...(content && content.length ? { content } : {}) };
  };

  const content = Array.isArray((input as DocNode).content)
    ? ((input as DocNode).content as DocNode[]).map(walk).filter((n): n is DocNode => n !== null)
    : [];
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

/** Plain text of a document: what search, previews, word counts and the export use. */
export function docToText(doc: DocNode): string {
  const blocks: string[] = [];
  const inline = (node: DocNode): string =>
    node.type === "text" ? node.text ?? "" : node.type === "hardBreak" ? "\n" : (node.content ?? []).map(inline).join("");
  const block = (node: DocNode, prefix = "") => {
    switch (node.type) {
      case "paragraph":
      case "heading":
        blocks.push(prefix + inline(node));
        break;
      case "horizontalRule":
        blocks.push("");
        break;
      case "taskItem":
        (node.content ?? []).forEach((child, i) => block(child, i === 0 ? `${node.attrs?.checked ? "[x]" : "[ ]"} ` : ""));
        break;
      case "listItem":
        (node.content ?? []).forEach((child, i) => block(child, i === 0 ? "• " : ""));
        break;
      default:
        (node.content ?? []).forEach((child) => block(child, prefix));
    }
  };
  (doc.content ?? []).forEach((n) => block(n));
  return blocks.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** A plain-text entry (written before rich text existed) as a document. */
export function textToDoc(text: string): DocNode {
  const paragraphs = text.split(/\n/).map((line) => (line ? { type: "paragraph", content: [{ type: "text", text: line }] } : { type: "paragraph" }));
  return { type: "doc", content: paragraphs.length ? paragraphs : [{ type: "paragraph" }] };
}
