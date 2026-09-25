# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Nature of the project

XiaoTrack (package name `devhub`) is a personal **learning sandbox**: the owner writes the application code themselves. `docs/vol-cookbook/00-index.md` states this explicitly. By default, explain, review, and point to patterns. Don't write feature code in `apps/web` or `apps/api` unless you're asked to directly.

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
  - `docs/widgets/prerequis/`: concept primers for building the widget system.
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

**Layout.** `MainLayout` is a CSS grid (header row above sidebar + content). `MainContent` renders the `<Outlet />`.

**Widget system** (`components/widgets/`, in progress, used only by `pages/Dashboard.tsx`). The spec is `docs/widgets/00-cadrage-v1.md`. It overrides `01-analyse.md` and `docs/vol-cookbook/05-widget-framework.md`. Key points:
- Domain-agnostic and "ready to plug": each archetype defines a data contract, and each catalog entry will provide a source function (fake in V1). No `domain`/`endpoint` in the target catalog.
- There are three levels. The *archetype* (how a widget renders) owns its `Body`, a required `defaultSize` and a `minSize`. The *catalog entry* (`type`, `as const satisfies`, `WidgetType = keyof typeof widgetCatalog`) is code that is never persisted, and it can override `defaultSize`. The *instance* (`{ id: uuid, type, size: {width, height}, position: {x, y} }`) is the persisted placement, in grid units, 0-indexed. The default size is copied into the instance when a widget is added and is never applied at render time.
- The grid owns placement; `<Widget>`/`WidgetCard` never read size or position and just fill their cell.
- `widget-grid.css` (in `@layer components`): `.widget-grid-frame` (container query, no padding) → `.widget-grid` → `.widget-cell` carrying CSS vars `--col`/`--row`/`--w`/`--h`. Above the container threshold: 12 columns scaled with `cqi` units, positions and holes kept. Below it: a single column in reading order (sorted by `y`, then `x`). No medium mode. Don't add Tailwind grid utilities on these elements, because the `utilities` layer would override the CSS.
- Minimum widget size is 2×1. V1 covers add/remove with auto-placement, an edit mode, and localStorage persistence behind `load()`/`save()`. Drag and resize are V2. The layout engine is home-made. There is no global store (Redux/Zustand) by design.

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

- `.gitignore` excludes `package-lock.json`, but the root lockfile is committed anyway. Don't stage workspace lockfiles by accident.
- The root `package.json` lists `react-grid-layout` and `react-router-dom` as dependencies. The widget layout engine is home-made by decision (2026-09-24), so `react-grid-layout` is not used.
