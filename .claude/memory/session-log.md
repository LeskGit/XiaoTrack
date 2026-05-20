# Session log — XiaoTrack

Mémoire append-only des sessions Claude. Géré par la commande `/never-forget`, relu par `/remember`.

---

## 2026-05-20 — Session état initial du projet (focus : web)

### Décisions

- **Cadre coaching confirmé comme socle de travail** — XiaoTrack est un sandbox d'apprentissage ; l'assistant explique, review, challenge, mais n'écrit pas le code applicatif (`apps/api`, `apps/web`). Exception sur demande explicite. Cette règle est désormais ancrée comme point de départ persistant.
- **Bootstrap de la mémoire de session** — première activation de `/never-forget` dans le repo ; création de `.claude/memory/session-log.md` et ajout d'une section dédiée dans `CLAUDE.md`. Les prochaines sessions s'appuieront sur ce log via `/remember`.

### Avancées

- **Snapshot du repo (monorepo npm workspaces `apps/*`)** : `apps/api` (NestJS 11, scaffold standard, pas encore de DB/auth/config) ; `apps/web` (React 19 + Vite 7 + Tailwind v4, déjà bien structuré).
- **`apps/web` — état du front au 2026-05-20** :
  - Routing en place : `BrowserRouter` (`main.tsx:9`) + `Routes` imbriquées (`App.tsx:8-18`), redirect `/` → `/dashboard`, `<Outlet />` dans `MainContent.tsx:7`.
  - Layout grid : `MainLayout.tsx` (header row + sidebar/main) — `AppHeader`, `MainHeader`, `MainSidebar`, `MainContent`.
  - Library d'icônes centralisée : `components/icons/library.ts` exporte tous les SVG SVGR sous noms (`MenuIcon`, `BellIcon`, `TrendingUpDownIcon`, etc.).
  - Wrapper `<Icon />` / `<IconButton />` avec `sizeMapTW` + `iconWeightMap` (`shared/styles/defaultProperties.styles.ts`).
  - Sidebar avec `NavLink` + état actif via callback `({isActive}) =>` (`CategorySidebar.tsx:7-10`).
  - Pages stubs : `Dashboard`, `Nutrition`, `Workouts`, `Planning`, `Habits`, `Notes` — barrel `pages/index.ts`.
  - SVGR configuré dans `vite.config.ts` avec `removeAttrs` (stroke-width, class) — permet de styler via Tailwind.
  - Alias `@/` → `apps/web/src/` synchronisé entre `vite.config.ts` et `tsconfig.app.json`.
- **Review pédagogique du code web livrée** : 8 points identifiés (cf. TODOs ci-dessous), classés par criticité (bug latent → naming → architecture).

### TODOs / Suites

- [ ] **Brancher `categorieName` du `MainHeader` sur la route active** — actuellement hardcodé à `"Dashboard"` dans `MainLayout.tsx:13`, ne change pas selon la navigation. Piste : `useLocation` / `useMatches`. (priorité haute, visible immédiatement)
- [ ] **Unifier la source de vérité des sections de l'app** — `App.tsx` (routes), `MainSidebar.tsx` (nav config), `pages/index.ts` (exports) listent trois fois la même chose. Réfléchir à une config unique `{id, title, path, icon, component}` consommée par les 3.
- [ ] **Corriger le fallback Avatar (bug latent)** — `Avatar.tsx:8` passe `"@/assets/img/avatar/dog.png"` comme string au DOM ; l'alias `@/` n'est résolu qu'à la compilation via `import`, donc 404 garantie quand le fallback se déclenche.
- [ ] **Nettoyer le code de debug `eventClickTest`** — `MainHeader.tsx:8-10` (`console.log("zdz")`), branché sur deux `IconButton`. Définir l'intention réelle (toggle sidebar ? notifications ?) ou retirer.
- [ ] **Retravailler `SBCategoriePprops` (`layout.types.ts:11`)** — typo `Pprops`, franglais "Categorie", abréviation "SB", et `icon: React.ComponentType` ne couvre pas les `SVGProps` que SVGR expose.
- [ ] **Trancher l'usage de `grid` dans `MainContent.tsx:6`** — `className="grid shadow-md"` sans cols/rows = comportement `block`. Configurer ou retirer.
- [ ] **Hoist la liste `categories` hors de `MainSidebar.tsx:6-13`** — actuellement recréée à chaque render. Occasion d'introduire la question "config statique vs `useMemo`".
- [ ] **Rendre le logo `AppHeader` cliquable (Link to "/")** — convention SPA standard, manquant.
- [ ] **Question ouverte (long terme)** : le projet annonce une exploration "React pur" (sans framework de routing/state pré-construit). À quel moment basculer du React Router actuel vers une approche maison pour l'apprentissage ?
