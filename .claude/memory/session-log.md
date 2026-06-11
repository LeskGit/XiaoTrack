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

---

## 2026-06-11 — Session routing data router + archi dashboard widgets

### Décisions

- **Redirect `/` → `/dashboard` via index route + `loader: redirect()`** — choisi contre `<Navigate>` et contre « l'index rend directement Dashboard ». Raison : c'est l'idiomatique data router (la redirection se joue en phase loader, avant tout rendu, zéro flash). `redirect()` utilise un `replaceState` sous le capot → `/` ne reste pas dans l'historique, le bouton « précédent » n'est pas piégé dans une boucle. Conséquence : l'index route est une route *fantôme* (pas de Component), distincte de la route `dashboard`.
- **Métadonnées de route sous `handle`, pas `metadata`** — React Router ne lit que `handle` via `useMatches()`. Le champ a été renommé `metadata → handle` dans `routes.ts` / `routes.types.ts`. Avant correction, le spread `...sidebarRoutes` laissait les données sous `metadata` (ignoré silencieusement par RR) → régression latente qui aurait cassé le titre du MainHeader.
- **Garder `as const satisfies ReadonlyArray<RouteConfig>`** — ne PAS rétrograder vers une annotation `: RouteConfig[]`. Raison : `satisfies` préserve les types littéraux (permet de dériver `type SectionId = typeof sidebarRoutes[number]["id"]`), nécessaire pour le futur TODO « unifier la source de vérité des sections ». L'annotation élargirait `path`/`id` en `string` et tuerait cette capacité.
- **Titre du MainHeader via `useMatches().at(-1)?.handle`, PAS `useState`+`useEffect`+props** — raison : l'URL est la source de vérité de « quelle page », elle survit au back/refresh/nouvel onglet/redirect, alors qu'un state recopié désync (l'effet ne se déclenche qu'au clic sidebar) et introduit un flash + un render en plus. Règle ancrée : « l'URL *est* le state ». Affine la réflexion long terme « React Router vs maison » → on approfondit l'API data plutôt que de partir maison.
- **Architecture dashboard widgets en 3 couches** — Shell générique `<Widget>` (la carte : titre/ombre/✕) + Body spécialisé par forme (`StatCardBody` / `ChartBody` / `ProgressListBody`) + Registry (annuaire `type → Body`, = le catalogue prédéfini). Modélisation TS : **discriminated union** `WidgetConfig` sur le champ `type`, et `WidgetInstance = WidgetConfig & { id, layout }`. Le dashboard = `WidgetInstance[]`. Distinction clé type (catalogue, statique) vs instance (posée, dynamique). État de disposition = persistant → pyramide `useState` → `localStorage` → API Nest.
- **Choix de libs** — couche LAYOUT (drag/resize) = **`react-grid-layout`** (⚠️ PAS `react-widgets` qui est des champs de formulaire). Couche CONTENU = **Recharts réservé au seul archétype `chart`** ; `stat` (texte+icône) et `progress` (barres `<div>` en %) se font sans lib. `react-grid-layout` se branche en 4ᵉ couche par-dessus, sans réécrire les 3 autres.
- **Ordre d'apprentissage figé** : 1) Shell `<Widget>` → 2) `StatCardBody` → 3) Registry + discriminated union → 4) liste d'instances (add/remove) en `useState` → 5) persistance → 6) `react-grid-layout` en dernier.

### Avancées

- `apps/web/src/shared/config/router.tsx` : ajout de l'index route `{ index: true, loader: () => redirect("/dashboard") }` + `...sidebarRoutes` en children. Redirect fonctionnel.
- `apps/web/src/shared/config/routes.ts` + nouveau `routes.types.ts` : type `RouteConfig` extrait dans son fichier ; champ `loader?` retiré de `RouteConfig` (la redirection vit sur l'index route) ; renommage `metadata → handle` → `useMatches` lit bien les titres.
- `apps/web/src/layout/Header/MainHeader.tsx:15` : câblage du titre via `useMatches()` démarré (`const routeData = useMatches().at(-1)`) — narrowing du `handle` (typé `unknown`) encore à finir.
- Sessions pédagogiques `/greatest-strength` livrées sur : `redirect()`, `useMatches`, `.at()`, `useOutlet`, History API / pattern « URL = state ».

### TODOs / Suites

- [ ] **Finir le titre du MainHeader** — `useMatches().at(-1)?.handle.title` ne compile pas tel quel (`handle: unknown`). Narrow via cast ou type guard en réutilisant le type du `handle` de `RouteConfig` ; prévoir un fallback (`?? "..."`) car l'index route n'a PAS de `handle`. Décider aussi *où* le titre s'affiche dans le JSX. (avance le TODO « categorieName » du 2026-05-20)
- [ ] **Trancher les 2 questions d'archi dashboard** : (1) données **dans** la config (widget « bête » nourri par le parent, option A recommandée) vs widget **autonome** qui fetch lui-même (B) ; (2) confirmer que Recharts est réservé au seul archétype `chart`.
- [ ] **Dashboard étape 1** : concevoir la signature du Shell `<Widget>` (titre, sous-titre, actions, children).
- [ ] **Vérifier compat `react-grid-layout` ↔ React 19 + StrictMode** avant l'étape 6 (lib impérative ancienne ; plans B : `gridstack`, `@dnd-kit`).
- [ ] **Vérifier compat `Tremor` ↔ Tailwind v4 sans config** si Tremor est retenu pour les charts/KPI (historiquement dépendant d'un `tailwind.config.js`).
- [ ] Reliquat 2026-05-20 toujours ouvert et croisé cette session : nettoyer `eventClickTest`/`console.log("zdz")` (`MainHeader.tsx:8-10,21,28`), trancher le `grid` sans cols de `MainContent.tsx:6`.
