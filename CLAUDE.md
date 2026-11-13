# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Nature of the project

XiaoTrack (package name `devhub`) is a personal **learning sandbox**. The goal is for the owner to learn as much as possible about development, to understand the whole codebase and to reason (and code) on their own. Collaboration rule (2026-10-28, revised 2026-11-13):

- **The owner codes the logic, Claude assists.** By default, explain, review, and point to patterns. Claude may write code when the owner asks for it, and always explains the why.
- **Analysis and design are done together**, whoever writes the code afterwards.
- **New concepts:** when the owner meets something they don't know yet, Claude helps actively (explanation, then example code if asked).
- **Tedious and repetitive work** (HTML markup, CSS/Tailwind styling, animations, boilerplate): Claude writes it by default.
- **Exception: when such a task brings a concept worth learning** (a new CSS feature, a new animation technique, a browser API...), Claude says so *before* coding and lets the owner choose: the owner codes it by hand with Claude's step-by-step guidance, or Claude codes it all and explains it afterwards.
- **Claude-written code gets reviewed:** after a batch of Claude-written styling/animation, Claude offers a file-by-file walkthrough so the owner knows what is in the codebase.

Session memory lives in `.claude/memory/session-log.md` (written by `/never-forget`, read by `/remember`). Run `/remember` at the start of a session to pick up earlier decisions and TODOs.

## Repository layout

An npm workspaces monorepo (`workspaces: ["apps/*"]`):

- `apps/web`: React 19 + Vite 7 + Tailwind CSS v4 + React Router v7 (TypeScript). The dev server binds `0.0.0.0:5173`. This is where almost all current work happens.
- `apps/api`: NestJS 11 scaffold (a single `AppController`/`AppService`, no DB/config/auth yet). Default port `3000` (override with `PORT`).
- `apps/ai/XiaoBot`: a Python side experiment (`main.py` plus `requirements.txt`, which is UTF-16 encoded). It isn't part of the npm workspaces.
- `docs/`: design docs written in French. They are the source of truth for intent:
  - `docs/coding-conventions.md`: the project's coding rules. Read this before reviewing or writing frontend code. §10 lists known legacy debt.
  - `docs/widgets/00-cadrage-v1.md`: the current spec for the dashboard widget system, and the source of truth. `01-analyse.md` is outdated and kept only for history.
  - `docs/widgets/03-plan-v1.md`: the step-by-step build plan the owner follows by hand (phases 0 to 7). When helping, locate the current step and stay within it.
  - `docs/widgets/04-cadrage-v2.md`: the V2 spec (drag, push right then down, auto compaction). It adds to the V1 spec and replaces the V1 rules listed in its §2.
  - `docs/widgets/05-plan-v2.md`: the V2 build plan (phases 0 to 6), same format as the V1 plan. The layout engine stays home-made (confirmed 2026-10-30).
  - `docs/widgets/prerequis/`: concept primers for building the widget system.
  - `docs/design/`: the design charter (`charte-graphique.md`). Its visual board is `apps/web/planche-charte-v1.html` (served by Vite at `/planche-charte-v1.html` in dev).
  - `docs/vol-cookbook/`: an offline cookbook (TS, React, Router, state, widget framework, testing).
- `Claude outputs/`: earlier Claude-generated notes and session logs. Not source code.

Root `docker-compose.yml` and `apps/api/Dockerfile` are `# TODO` placeholders.

## Commands

From the repo root:

```bash
npm run install:all   # npm install --workspaces
npm run dev           # api + web in parallel
npm run dev:web       # Vite only
npm run dev:api       # Nest (start:dev) only
npm run build         # build every workspace
```

The root `npm test` script is a stub that exits with an error. Tests are configured per workspace: Jest in `apps/api`, Vitest in `apps/web`.

`apps/web`:
```bash
npm run build   # tsc -b && vite build  (the type check is part of the build)
npm run lint    # eslint .
npm test        # vitest (inherits vite.config.ts, including the @/ alias)
npx vitest run src/components/widgets/engine/geometry.test.ts   # single file
```

`apps/api`:
```bash
npm run start:dev | lint | format
npm test                        # jest, config inline in package.json (rootDir=src, *.spec.ts)
npx jest src/app.controller.spec.ts   # single file
npx jest -t "pattern"                 # single test by name
npm run test:e2e                # test/jest-e2e.json
```

## Frontend architecture (`apps/web/src`)

**Routing is config-driven.** `shared/config/routes.ts` exports `sidebarRoutes`, a list of `RouteConfig` objects (`id`, `path`, `Component`, `handle: { icon, title, displayMode }`) declared `as const satisfies ReadonlyArray<RouteConfig>`. The same array feeds two consumers:
- `shared/config/router.tsx` (`createBrowserRouter`): `/` renders `MainLayout`, the index route redirects to `/dashboard`, and the sidebar routes become children.
- `layout/Sidebar/MainSidebar.tsx`: renders one nav entry per route from `handle`.

Adding a page means adding a `pages/X.tsx`, exporting it from `pages/index.ts`, adding a `MainDomain` value, and adding a `sidebarRoutes` entry. Paths come from `MainDomain` in `shared/types/domain.types.ts`.

**Layout.** `MainLayout` is a CSS grid, exactly `h-dvh` with `overflow-hidden`: brand tile (`AppHeader`) + `MainHeader` on top, `MainSidebar` + `MainContent` below. The window never scrolls; only `MainContent` (`<main>`, `min-h-0 overflow-y-auto`) does, so anything `position: sticky` in a page (e.g. the widget edit bar) sticks relative to it. Header and sidebar are plain `bg-surface` panels; the only signature is the two colour washes (halos) of the `body` background. Below `md` the four blocks stack.

**Styling system.** The design charter is `docs/design/charte-graphique.md` (decided 2026-11-13, visual board in `apps/web/planche-charte-v1.html`). It is the source of truth for colours, buttons, type scale, shapes and motion, and it is applied to the code (2026-11-13; its §9 lists the open points). Follow it for any new screen or mockup:
- Design tokens live in the `@theme` block of `assets/css/index.css` and generate Tailwind utilities: colours (`canvas`, `surface`, `line(-strong)`, `ink(-soft|-muted)`, `accent(-strong|-soft|-line)`, `data-1..5`, `success|warning|danger|info` with `-soft`/`-strong`, `domain-*`), type scale (`text-caption|label|body|title|heading|display`, no other size), radii (`rounded-sm|md|lg` = 6/10/14px, overriding Tailwind's), shadows (`shadow-card|card-hover|float|brand`), easings. **No raw colour in components** (no `rgb()`, `oklch()`, `gray-*`, `sky-*`...): tokens only, so dark mode stays possible.
- Plain CSS vars in `:root`: `--shadow-tint` (the one shadow colour), `--brand-gradient(-text)`, `--color-scrim`, `--motion-fast|base|slow` (150/250/400ms).
- Custom utilities (`@utility`): `bg-brand` / `text-brand` (the gradient: logo + ONE primary action per screen only) and `tone-tile` (icon tile tinted by `--tone`; `domainToneMap` in `shared/styles` maps each `MainDomain` to its colour).
- Shared buttons in `index.css` (`@layer components`): `.btn` + `.btn-primary|accent|soft|secondary|ghost|danger` + `.btn-lg` / `.btn-icon`. Every button uses them.
- Component-specific styles go in a sibling CSS file in `@layer components`, imported by the component: `widget-grid.css`, `modals/modal.css`, `widgets/palette/palette.css`. Tailwind utilities stay in the JSX for one-off layout.
- Motion: a global `prefers-reduced-motion` rule in `index.css` neutralises CSS animations; JS animations (WAAPI, rAF, smooth scroll, exit timers) must check `prefersReducedMotion()` from `@/shared/utils`.
- Font: Inter, self-hosted via `@fontsource-variable/inter` (imported in `main.tsx`).

**Widget system** (`components/widgets/`, in progress, used only by `pages/Dashboard.tsx`). The spec is `docs/widgets/00-cadrage-v1.md`. It overrides `01-analyse.md` and `docs/vol-cookbook/05-widget-framework.md`. Key points:
- Domain-agnostic and "ready to plug": each archetype defines a data contract, and each catalog entry will provide a source function (fake in V1). No `domain`/`endpoint` in the target catalog.
- There are three levels. The *archetype* (how a widget renders) owns its `Body`, a required `defaultSize` and a `minSize`. The *catalog entry* (`type`, `as const satisfies`, `WidgetType = keyof typeof widgetCatalog`) is code that is never persisted, and it can override `defaultSize`. The *instance* (`{ id: uuid, type, size: {width, height}, position: {x, y} }`) is the persisted placement, in grid units, 0-indexed. The default size is copied into the instance when a widget is added and is never applied at render time.
- A catalog entry may carry `tone` (a CSS colour, e.g. `domainToneMap.habits`) for its icon tile. It is presentation only: the widget system never interprets it, so the catalog stays domain-agnostic.
- The grid owns placement; `<Widget>`/`WidgetCard` never read size or position and just fill their cell.
- `widget-grid.css` (in `@layer components`): `.widget-grid-frame` (container query, no padding) → `.widget-grid` → `.widget-cell` carrying CSS vars `--col`/`--row`/`--w`/`--h`. Above the container threshold: 12 columns scaled with `cqi` units, positions and holes kept. Below it: a single column in reading order (sorted by `y`, then `x`). No medium mode. Don't add Tailwind grid utilities on these elements, because the `utilities` layer would override the CSS.
- Minimum widget size is 2×1. V1 (done) covers add/remove with auto-placement, an edit mode, and localStorage persistence behind `load()`/`save()`. V2 (`04-cadrage-v2.md`) adds drag with auto compaction; phases 0 to 3 and 5 are built (drag, preview, styling, FLIP animation in `hooks/useFlipAnimation.ts`). Phase 4 (auto-scroll while dragging) and the phase 6 acceptance pass remain. Resize is postponed. The layout engine is home-made. There is no global store (Redux/Zustand) by design.
- Edit mode UI: `WidgetToolbar` (top: "Edit widgets" button, or a hint while editing) and `WidgetEditBar` (floating sticky bar: status, Add, Cancel, Save), passed to `WidgetGrid` as `toolbar` / `footer`. Animation durations shared between TS and CSS live in `widget-grid.constants.ts` (keep them in sync with `widget-grid.css`).

**Enum pattern.** "Enums" are `const` objects plus a same-named type: `export const X = {...} as const; export type X = typeof X[keyof typeof X];` (see `DisplayMode`, `MainDomain`, `WidgetSize`). `erasableSyntaxOnly` forbids TS `enum`, so use this pattern for new ones.

**Tooling specifics:**
- Path alias `@/` → `src/`, defined in both `vite.config.ts` and `tsconfig.app.json`. Keep the two in sync.
- SVGs are imported as components with `?react` (vite-plugin-svgr). svgo strips `stroke-width` and `class`. Icons are centralized in `components/icons/library.ts` with an `Icon` suffix (`HamIcon`) and rendered through `<Icon>`/`<IconButton>`, not as raw SVG components.
- `Icon`/`Avatar` sizes come from `sizeMapTW` in `shared/styles` (`sm | md | lg | custom`). With `custom`, the caller supplies the size through `className`.
- Tailwind v4 via `@tailwindcss/vite` and a single `@import "tailwindcss"` in `assets/css/index.css`. There is no `tailwind.config.js`.
- Strict TS: `strict`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax` (type-only imports must use `import type`), `erasableSyntaxOnly`, `noUncheckedSideEffectImports`. A violation breaks `npm run build`.
- `src/poc/` holds throwaway proof-of-concept code.

Key rules from `docs/coding-conventions.md`: English identifiers and English UI text (some French text remains as legacy); `type`, not `interface`; props are `readonly` and named `XxxProps`; one default-exported component per file; barrel `index.ts` files contain re-exports only; `@/` for cross-folder imports and relative paths for siblings; `components/` (context-free UI) vs `layout/` (app shell) vs `pages/` (screens) vs `shared/` (no React components).

## Repo notes

- `.gitignore` excludes `package-lock.json`. Only `apps/api/package-lock.json` is tracked (committed before the rule). Don't force-add other lockfiles.
- The root `package.json` lists `react-grid-layout` and `react-router-dom` as dependencies. The widget layout engine is home-made by decision (2026-09-24), so `react-grid-layout` is not used.
