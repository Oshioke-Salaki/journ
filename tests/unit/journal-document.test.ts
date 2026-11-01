import { describe, expect, it } from "vitest";
import { docToText, InvalidDocument, sanitizeDoc, textToDoc } from "@/features/journal/rich/document";

const p = (...content: object[]) => ({ type: "paragraph", content });
const t = (text: string, marks?: object[]) => ({ type: "text", text, ...(marks ? { marks } : {}) });

describe("sanitizeDoc", () => {
  it("keeps the formatting the editor offers", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2, textAlign: "center" }, content: [t("A good day")] },
        p(
          t("bold", [{ type: "bold" }]),
          t(" marked", [{ type: "highlight", attrs: { color: "var(--jh-mint)" } }]),
          t(" teal hand", [{ type: "textStyle", attrs: { color: "var(--jc-teal)", fontFamily: "var(--jf-hand)", fontSize: "var(--js-large)" } }]),
        ),
        { type: "taskList", content: [{ type: "taskItem", attrs: { checked: true }, content: [p(t("Walk"))] }] },
        { type: "orderedList", attrs: { start: 3 }, content: [{ type: "listItem", content: [p(t("Third"))] }] },
        { type: "blockquote", content: [p(t("Quoted"))] },
        { type: "horizontalRule" },
      ],
    };
    expect(sanitizeDoc(doc)).toEqual(doc);
  });

  it("drops unknown nodes, unknown marks and attributes outside the palette", () => {
    const dirty = {
      type: "doc",
      content: [
        { type: "image", attrs: { src: "https://evil.example/x.png" } },
        { type: "codeBlock", content: [t("code")] },
        p(
          t("x", [{ type: "link", attrs: { href: "javascript:alert(1)" } }]),
          t("y", [{ type: "textStyle", attrs: { color: "red; background:url(https://evil.example)", fontFamily: "Comic Sans MS", fontSize: "999px" } }]),
          t("z", [{ type: "highlight", attrs: { color: "expression(alert(1))" } }]),
        ),
        { type: "heading", attrs: { level: 1, onclick: "alert(1)" }, content: [t("H")] },
        { type: "paragraph", attrs: { textAlign: "left; position:fixed" }, content: [t("P")] },
      ],
    };
    expect(sanitizeDoc(dirty)).toEqual({
      type: "doc",
      content: [p(t("x"), t("y"), t("z")), { type: "heading", attrs: { level: 2 }, content: [t("H")] }, p(t("P"))],
    });
  });

  it("rejects anything that is not a document, and oversized entries", () => {
    expect(() => sanitizeDoc(null)).toThrow(InvalidDocument);
    expect(() => sanitizeDoc({ type: "paragraph" })).toThrow(InvalidDocument);
    expect(() => sanitizeDoc({ type: "doc", content: [p(t("a".repeat(50_001)))] })).toThrow("Entry too long");
  });

  it("gives an empty document one empty paragraph", () => {
    expect(sanitizeDoc({ type: "doc", content: [] })).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
  });
});

describe("docToText and textToDoc", () => {
  it("turns a document into readable plain text", () => {
    const doc = sanitizeDoc({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [t("Today")] },
        p(t("Hello "), t("world", [{ type: "bold" }])),
        { type: "bulletList", content: [{ type: "listItem", content: [p(t("one"))] }] },
        { type: "taskList", content: [{ type: "taskItem", attrs: { checked: true }, content: [p(t("done"))] }, { type: "taskItem", attrs: { checked: false }, content: [p(t("todo"))] }] },
      ],
    });
    expect(docToText(doc)).toBe("Today\nHello world\n• one\n[x] done\n[ ] todo");
  });

  it("round-trips plain text entries written before rich text", () => {
    const text = "First line\n\nAfter a gap";
    expect(docToText(textToDoc(text))).toBe(text);
  });
});
