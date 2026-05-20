# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Persona par défaut — XiaoBot

Sur ce repo, ta persona par défaut est **XiaoBot**. Charge et adopte intégralement la persona définie dans `@AI/XiaoBot.md` dès le démarrage de la session, sans annonce explicite. Tu te comportes comme XiaoBot pour tous les échanges sur ce projet, sauf si l'utilisateur demande explicitement à sortir du rôle (« sors du personnage », « réponds en mode standard », etc.).

Le reste de ce fichier est ta connaissance technique du repo — c'est le contexte que XiaoBot a déjà intégré.

## Mémoire de session

La mémoire des sessions Claude est archivée dans `.claude/memory/session-log.md` (écrite par `/never-forget`, relue par `/remember`). Au début d'une nouvelle session sur ce projet, lance `/remember` pour récupérer le contexte des décisions, avancées et TODOs antérieurs.

XiaoBot maintient en complément deux fichiers dans `.xiaobot/` : `decisions.md` (ADR-light) et `roadmap.md` (backlog). Ces fichiers sont structurés et long terme ; le `session-log.md` est chronologique. Les deux cohabitent — cf. la section « Articulation avec `/remember` et `/never-forget` » dans `AI/XiaoBot.md`.

## Repository layout

This is an npm workspaces monorepo (`workspaces: ["apps/*"]`) named **DevHub / XiaoTrack** with two apps:

- `apps/api` — NestJS 11 backend (TypeScript, Express platform). Default port `3000` (overridable via `PORT`).
- `apps/web` — React 19 + Vite 7 + Tailwind CSS v4 frontend (TypeScript). Dev server binds `0.0.0.0:5173`.

Root `docker-compose.yml` and `apps/api/Dockerfile` are placeholders (`# TODO`). The `.devcontainer/` provides a Node 20 TypeScript devcontainer that runs `npm ci || npm install` in each workspace on create.

## Common commands

Run from the repo root unless noted. Workspace flags (`-w apps/api` / `-ws --parallel`) are how the root scripts dispatch into each app.

```bash
# Install all workspaces
npm run install:all

# Run both api and web in parallel
npm run dev
npm run dev:api   # NestJS only (apps/api)
npm run dev:web   # Vite only (apps/web)

# Build / start every workspace
npm run build
npm run start
```

Per-app commands (run inside `apps/api` or `apps/web`, or via `-w`):

```bash
# apps/api (NestJS)
npm run start:dev      # nest start --watch
npm run start:debug    # nest start --debug --watch
npm run lint           # eslint --fix on src/apps/libs/test
npm run format         # prettier on src and test
npm test               # jest (config inline in package.json: rootDir=src, testRegex=*.spec.ts)
npm run test:watch
npm run test:cov
npm run test:e2e       # uses test/jest-e2e.json
# Run a single test:
npx jest path/to/file.spec.ts
npx jest -t "test name pattern"

# apps/web (Vite)
npm run dev            # vite --host 0.0.0.0 --port 5173
npm run build          # tsc -b && vite build  (project references via tsconfig.json)
npm run lint           # eslint .
npm run preview        # vite preview
```

Note: there is no root-level `test` script — testing is per-workspace, currently only configured in `apps/api`.

## Frontend architecture (`apps/web`)

The frontend is intentionally small and convention-driven. A few non-obvious points worth knowing before editing:

- **Path alias `@/`** maps to `apps/web/src/` in three places that all need to stay in sync if changed: `vite.config.ts` (resolve.alias), `tsconfig.app.json` (paths), and consumer imports.
- **SVGs as React components** via `vite-plugin-svgr`. Import with the `?react` query, e.g. `import Bell from '@/assets/icons/bell.svg?react'`. The resulting component is passed to the shared `<Icon icon={Bell} />` / `<IconButton />` wrappers — do not render raw `<svg>` tags directly when an `Icon` wrapper exists.
- **Icon sizing convention.** `Icon` and `Avatar` both consume `sizeMapTW` from `@/shared/styles` (`sm | md | lg | custom`). When `size="custom"`, sizing must come from the caller's `className` (e.g. `className="w-8 h-8"`). The wrapper applies `[&>svg]:w-full [&>svg]:h-full` so the inner SVG fills the span.
- **Tailwind v4** is wired through the official Vite plugin (`@tailwindcss/vite`) and a single `@import "tailwindcss";` in `src/assets/css/index.css`. There is no `tailwind.config.js` — utilities/tokens are configured via CSS, not JS.
- **Layout shape.** `App.tsx` → `MainLayout` (CSS grid: header row spans both columns, sidebar + main below). New pages should plug into `MainContent`; the page directory currently holds a single `Dashboard.tsx`.
- **Component folders use barrel `index.ts`** that re-exports both default components and named types (see `components/icons/index.ts`, `components/avatar/index.ts`, `shared/styles/index.ts`). Match this pattern when adding new components.
- **Types live next to their components** in `*.types.ts` files (`icons.types.ts`, `avatar.types.ts`, `layout.types.ts`). Cross-cutting types live in `shared/types/`.
- **TS strictness** is high: `strict`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUncheckedSideEffectImports`. `verbatimModuleSyntax` means **type-only imports must use `import type { ... }`** — mixing types into value imports will fail to build.

## Backend architecture (`apps/api`)

Standard scaffolded NestJS 11 app at this stage: `main.ts` bootstraps `AppModule` with a single `AppController` / `AppService`. No database, config module, or auth wired up yet — when adding those, follow Nest module conventions (feature-module per domain) and register them in `AppModule.imports`.

Jest configuration is inline in `apps/api/package.json` (not a separate `jest.config`); E2E uses `test/jest-e2e.json`.

## Other repo notes

- `.gitignore` only excludes `node_modules` and `package-lock.json`. The root `package-lock.json` is committed despite this — be careful not to accidentally stage workspace lockfiles.
- The `AI/` directory contains agent persona definitions (`xiaobot.md` is the default persona loaded above ; `rodin.md` is a separate intellectual sparring persona unrelated to this codebase). Don't treat these as application source.
