import { renderToReactElement } from "@tiptap/static-renderer/pm/react";
import type { DocNode } from "./document";
import { journalExtensions } from "./extensions";

/** A saved entry, rendered on the server from its sanitised document. Checklists are read-only. */
export function JournalDocument({ doc, text }: { doc: DocNode | null; text: string }) {
  if (!doc) return <div className="journal-doc whitespace-pre-wrap">{text}</div>;
  return <div className="journal-doc [&_input]:pointer-events-none">{renderToReactElement({ content: doc, extensions: journalExtensions })}</div>;
}
