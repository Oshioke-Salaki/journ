<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# JournApp

A self-awareness journal (PWA) for a wellness audience, mainly women. Next.js 16 + Supabase.
Read `docs/ARCHITECTURE.md` and `docs/DESIGN.md` before changing code.

## Rules

- Features live in `src/features/<feature>/` (actions, queries, schemas, components). Routes in
  `src/app` stay thin.
- Every read of member data goes through `lib/auth/session.ts` (`requireMember`, `requireAdmin`)
  and the request-bound client in `lib/supabase/server.ts`. Never cache member data; never add a
  service-role key to the app.
- Every write is a Server Action that validates with Zod, authorises, writes, revalidates, and
  returns `ActionResult`. Show results with `toastResult` / `notify`.
- New tables: RLS, policies, indexes, a pgTAP test, and an entry in `export_my_data()`.
- Pages that read the session render their data inside `<Suspense>` with a skeleton at the final size.
- Use design tokens (`bg-surface`, `text-ink`, ...), never raw colours. No gradients, glass, emoji,
  icon tiles or tiny uppercase labels. Light and dark must both work.
- Every block needs loading, empty and error states; every control needs hover, focus and disabled.
- Before finishing: `pnpm check`, `pnpm db:test`, `pnpm build`, `pnpm test:e2e`.
- Update the docs in `docs/` in the same change as the code.
