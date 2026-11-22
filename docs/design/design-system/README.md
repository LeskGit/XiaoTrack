# XiaoTrack

A personal tracker (dashboard, workouts, nutrition, planning, habits, notes). Calm structure, one signature, indigo for everything you can click.

This system mirrors the code: the tokens come from `apps/web/src/assets/css/index.css` (`@theme`), the rules from `docs/design/charte-graphique.md` (v1, 2026-11-13). When the two disagree, the code and the charter win: update this system from them.

## Content fundamentals

- **English UI text**, sentence case, verb first on actions: "Start session", "Add exercise", "Save".
- Short labels, no jargon the athlete would not use: "reps", "weight", "rest", "RPE".
- Numbers carry their unit and use tabular figures: `82.5 kg`, `3 × 8–12`, `45 s`. Bodyweight is `0 kg`, shown as "Bodyweight"; a missing value is "—", never 0.
- Dates are short and relative when close: "Today", "Tomorrow", "Sat 22 Nov".

## Visual foundations

**Personality.** Plain canvas, crisp borders, white surfaces. The only signature is the two halos: soft blue (top-left) and violet (top-right) washes over `canvas` (class `.xt-canvas`). Header and sidebar are plain `surface` panels.

**Colour has roles, never borrowed:**

- `ink`, `ink-soft`, `ink-muted` for text; `surface`, `canvas`, `line`, `line-strong` for planes and borders.
- `accent` (indigo) for anything clickable or selected. `accent-strong` for accent text, `accent-soft` for fills and hovers, `accent-line` for borders and guides.
- `data-1..5` for charts and progress only; a single series is always `data-1` (turquoise).
- Status (`success`, `warning`, `danger`, `info`, each with `-soft` background and `-strong` text) never appears alone: always with an icon or a word.
- Domain colours (`domain-workouts` rose, `domain-nutrition` orange...) appear **only on icon tiles** (`.tone-tile`): 13 % tint at rest, filled when active. Never on a button, a text or a chart.

**The brand gradient** (blue → indigo → purple, 135°) is allowed in two places only: the logo, and **one** primary action per screen (`.btn-primary`). Everywhere else the accent is flat.

**Type.** Inter, six levels and no other size: `display` 28, `heading` 20, `title` 16, `body` 14, `label` 13, `caption` 12. Numbers use `font-variant-numeric: tabular-nums` (`.tabular`).

**Shapes.** `radius-sm` 6 (badges, checkboxes), `radius-md` 10 (buttons, fields, icon tiles), `radius-lg` 14 (cards, modals, panels). The pill is reserved for floating bars, badges and the round header buttons. Every shadow is tinted indigo-900: `shadow-card` at rest, `shadow-card-hover` on hover, `shadow-float` for floating things, `shadow-brand` under the gradient only.

**Motion.** Expressive but short: `ease-out-soft` for most moves, `ease-spring` for what lands; 150 ms hovers, 250 ms state changes, 400 ms entrances. `prefers-reduced-motion` turns everything off.

**Layout.** App shell: brand tile + header (64 px) on top, 256 px sidebar + scrolling content below (from `md`); below `md` the blocks stack. Only the content scrolls. Cards are `.card` (border `line`, `radius-lg`, `shadow-card`), padded 16 px on phones and 24 px on desktop.

## Components

Plain CSS classes in `components/bundle.css`, the same names as the app: `.btn` + `.btn-primary | accent | soft | secondary | ghost | danger`, `.btn-lg`, `.btn-icon`; `.field` and `.field-label`; `.card`; `.badge` + `.badge-neutral | info | warning | success | danger`; `.tone-tile`; `.section-label`. No JS bundle: mockups load the stylesheet and use the classes.

## Iconography

Line icons, 20 px in buttons and the header, drawn at a regular weight, `currentColor`. In the app they come from `components/icons/library.ts` (SVG imported with `?react`). Mockups may use simple inline SVG line icons in the same spirit.
