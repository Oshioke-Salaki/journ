# Design

## Direction

JournApp should feel **calm, bright and uplifting** (the client's words), and personal rather than
clinical. The art direction was dealt with the taste-skill (`design-taste-frontend`, app style
_editorial greeting_, seed 1324012344) with the brand palette kept:

- **The greeting is the headline.** Today opens with "Good evening, Meriem." set in a serif, and a
  plain line with the day's one fact ("You haven't checked in yet today").
- **Tonal panels, not boxes.** Surfaces are separated by a step in tone (white, sand), never by
  heavy borders or shadows. Shadows only on things that float: dialogs, toasts.
- **Colour on data.** The interface runs on ink and sand tones; the teal accent marks data (the mood
  line, progress) and selection. Brand pastels belong to artwork.
- **No ornaments.** No gradients, glass, emoji, icon-in-a-circle tiles or tiny uppercase labels.

## The signature element: the landscape

The JournApp mark is a sun over layered hills. The same picture is drawn in code
(`components/brand/landscape*.tsx`) and becomes **data**: on a check-in, the sun sits higher the
better the mood and the hills stand taller the more energy there is. It animates live as a member
answers, appears as today's picture on Today, and as a row of past days in My Space. Topics and
videos use the same language with their own palettes, seeded so a given id always draws the same
picture. Replace video artwork with real thumbnails when the videos are recorded.

## Tokens

All colours are CSS custom properties in `src/app/globals.css`, exposed to Tailwind as roles
(`bg-surface`, `text-ink`, `bg-accent`...). Never use raw hex in components (brand artwork excepted).

| Role | Light | Dark | Used for |
| --- | --- | --- | --- |
| `ground` | #faf8f4 | #0d1111 | Window background behind the app sheet |
| `surface` | #ffffff | #141a19 | Page and inputs |
| `raised` | #f3efe8 | #1a2120 | Panels |
| `sand` | #ece3d5 | #222a28 | Feature fields (quote, prompts) |
| `ink` / `muted` / `faint` | #15302e / #4f5e5c / #5f6a68 | #f0f3f1 / #b2bdba / #96a39f | Text tiers, all ≥ 4.5:1 |
| `primary` | #1e4d4a | #cfe8e1 | The one filled button per screen |
| `accent` | #2c7a72 | #6cc2b4 | Data and selection |
| `positive` / `negative` | #247b50 / #b4232a | #4cc38a / #f0737a | Status only |

Dark mode follows the device, or the member's choice in Settings (stored on the device, applied
before first paint by an inline script).

## Type

- **Hanken Grotesk** for the interface. Tabular figures (`.num`) wherever numbers line up or change.
- **Newsreader** (serif) has three jobs: the greeting, quotes and prompts, and the writing itself.
- Sizes: 12/13/14/15/16 for interface text, 17–22 for section and card titles, 26–34 for page titles,
  34–44 for the greeting. The welcome page goes larger (52–84) because it is a page, not an app screen.

## Components

`src/components/ui`: Button (primary, secondary, outline, ghost, danger; loading keeps its width),
Field/Label/Description (wired to `aria-describedby` and errors), Input/Textarea/Select, PasswordInput,
Checkbox, Switch, Chips (toggle chips), Dialog and AlertDialog (bottom sheet on phones, centred
dialog on larger screens), Skeleton, EmptyState, ErrorState, Spinner, Avatar, Toaster.

Radii: panels 22px, cards 16–20px, fields 14px, buttons and chips fully round.

## Layout and responsiveness

- **Phone (under 1024px):** a top bar and the four-tab bar from the sketches (Today, Discover,
  Community, My Space), safe-area aware for iPhone notches and the home indicator. Dialogs become
  bottom sheets. Primary actions in focused flows sit in a fixed bottom bar within thumb reach.
- **Laptop and iPad landscape (1024px and up):** a sidebar on the tinted ground with the page on a
  white sheet inset 8px. Content runs on a 12-column grid inside a 1180px column.
- Focused flows (check-in, writing) hide navigation entirely.

## Motion

Motion is feedback, never decoration: buttons press (scale 0.98), steps slide in the direction of
travel, the landscape springs to its new values, ticked steps pop their check. Every animation uses
transform and opacity and is switched off under `prefers-reduced-motion`.

## States

Every data block has: a **skeleton** at the final size (no layout shift), an **empty state** that
keeps its frame and says how to start, and an **error state** inside the block with a way forward.
Saves show a toast; failed optimistic changes roll back with an explanation. Forms validate on blur
and on submit, server errors land on the same fields.

## Accessibility

WCAG 2.1 AA: contrast ≥ 4.5:1 for text in both themes, visible focus rings, full keyboard support
(the body map, level pickers and chips included), labels on every control, live regions for counts
and saves, and a skip link. Automated axe checks run on every screen in the screenshot test.

## Writing

Plain, warm and specific. Sentence case. Name the thing ("Check-in saved", not "Success"). Errors say
what happened and what to do. No exclamation marks, no emoji, no guilt ("You haven't checked in yet
today", never "You missed a day").
