/**
 * The journal's writing palette. Every value is a CSS variable defined in globals.css, so colours
 * stay readable in light and dark mode, and the server accepts only these exact values.
 */

export const FONTS = [
  { value: "var(--jf-serif)", label: "Serif", sample: "Dear diary" },
  { value: "var(--jf-sans)", label: "Sans", sample: "Dear diary" },
  { value: "var(--jf-hand)", label: "Handwritten", sample: "Dear diary" },
  { value: "var(--jf-type)", label: "Typewriter", sample: "Dear diary" },
] as const;

export const SIZES = [
  { value: "var(--js-small)", label: "Small" },
  { value: null, label: "Normal" },
  { value: "var(--js-large)", label: "Large" },
  { value: "var(--js-xl)", label: "Extra large" },
] as const;

export const COLORS = [
  { value: null, label: "Default", swatch: "var(--ink)" },
  { value: "var(--jc-teal)", label: "Teal", swatch: "var(--jc-teal)" },
  { value: "var(--jc-sage)", label: "Sage", swatch: "var(--jc-sage)" },
  { value: "var(--jc-blue)", label: "Blue", swatch: "var(--jc-blue)" },
  { value: "var(--jc-rose)", label: "Rose", swatch: "var(--jc-rose)" },
  { value: "var(--jc-amber)", label: "Amber", swatch: "var(--jc-amber)" },
  { value: "var(--jc-muted)", label: "Soft grey", swatch: "var(--jc-muted)" },
] as const;

export const HIGHLIGHTS = [
  { value: "var(--jh-yellow)", label: "Yellow" },
  { value: "var(--jh-peach)", label: "Peach" },
  { value: "var(--jh-mint)", label: "Mint" },
  { value: "var(--jh-blue)", label: "Blue" },
  { value: "var(--jh-rose)", label: "Rose" },
] as const;

export const ALIGNS = ["left", "center", "right", "justify"] as const;

export const FONT_VALUES = new Set<string>(FONTS.map((f) => f.value));
export const SIZE_VALUES = new Set<string>(SIZES.flatMap((s) => (s.value ? [s.value] : [])));
export const COLOR_VALUES = new Set<string>(COLORS.flatMap((c) => (c.value ? [c.value] : [])));
export const HIGHLIGHT_VALUES = new Set<string>(HIGHLIGHTS.map((h) => h.value));
