-- Rich text for journal entries. `body_doc` is the sanitised editor document (ProseMirror JSON);
-- `body` keeps the plain text of it for search, previews, word counts and the data export.
-- Entries written before this change have no document and are shown from `body`.
alter table public.journal_entries
  add column body_doc jsonb check (body_doc is null or (jsonb_typeof(body_doc) = 'object' and pg_column_size(body_doc) <= 1048576));

comment on column public.journal_entries.body_doc is 'Sanitised editor document (ProseMirror JSON). Null for plain-text entries.';
