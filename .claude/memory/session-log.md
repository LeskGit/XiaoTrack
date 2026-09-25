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

---

## 2026-06-15 — Session conception système de widgets (build maison)

### Décisions

- **Construire le système de widgets soi-même, pas de lib layout** — contexte : besoin peu poussé + projet d'apprentissage + risque compat `react-grid-layout` ↔ React 19 (`findDOMNode` supprimé). Choix : maison, sur **Pointer Events** (drag) + **CSS Grid** (substrat de position), zéro dépendance. Raison : la complexité des libs vient de la collision/reflow 2D, pas du drag ; en restant sur du **reorder** (ordre dans un tableau, pas coordonnées pixel), le maison devient trivial. Conséquence : on n'adopte pas react-grid-layout/@dnd-kit/gridstack pour l'instant. Signal de bascule futur noté dans l'ADR. Tranche le TODO « vérifier compat react-grid-layout » du 2026-06-11 (devenu non bloquant tant qu'on reste maison).
- **Architecture du système de widgets en 5 couches** — rejet du « god-component `WidgetInstance` qui porte tout » (donnée+drag+UI+CSS = intestable, persistance impossible, collision de nom). Retenu : (1) Donnée `WidgetInstance` sérialisable / (2) Comportement = hook headless `useDraggable` / (3) Présentation = Shell `<Widget>` (carte + hover) / (4) Contenu = Body par `type` via Registry / (5) Orchestration = `<Dashboard>` détient `WidgetInstance[]`. **Formalisée en ADR dans `.xiaobot/decisions.md`** (2026-06-15). Prolonge l'archi « Shell + Body + Registry » du 2026-06-11.
- **Couche 1 (donnée) modélisée en discriminated union sur `type`** — `WidgetBase` (id, layout, style?) en `interface`, union des variantes en `type` (obligatoire : une interface n'exprime pas une union), `WidgetInstance = WidgetBase & WidgetConfig`. TS distribue l'intersection → l'union discriminée est préservée → narrowing auto dans le `switch` du Registry + exhaustivité via `assertNever`. **`data` placé DANS chaque branche** (pas dans `WidgetBase`) sinon perte du narrowing. Anti-pattern écarté : `data: any/unknown`. Types **cross-cutting** → dossier feature `widgets/widgets.types.ts` (pas collé à un composant).
- **Transport de la donnée : props par défaut, Context réservé aux actions** — `<Dashboard>` passe chaque `instance` en prop à `<Widget>`. Context envisagé plus tard *uniquement* pour les actions (add/remove/update) ou le flag « mode édition », jamais pour stocker le `WidgetInstance[]` (Context ne bail-out pas les re-renders, n'est pas un state manager).
- **Data du contenu : option A (Body nourri par le parent)** — tranche la question A/B laissée ouverte le 2026-06-11. Le Body reçoit sa data en props (pur, testable) ; fetch/calcul vit au-dessus. Pas de store (Redux/Zustand) tant qu'il n'y a pas de prop-drilling douloureux.
- **Drag perf : transient-local + commit-on-drop (recommandé, à confirmer)** — pendant le déplacement, la position vit en local (state du hook ou `transform` via ref qui bypasse le render) ; commit dans le state parent au `pointerup`. Évite N re-renders à 60 fps. Pas encore définitivement acté.

### Avancées

- Création de `.xiaobot/decisions.md` (ADR « Architecture système de widgets en 5 couches », daté 2026-06-15).
- Création de `.xiaobot/roadmap.md` (Done / In progress = système de widgets / Next).
- Comparatif des libs de layout livré (react-grid-layout, @dnd-kit, gridstack, react-resizable-panels, react-mosaic) avec angle React 19.
- Squelette de design de la couche 1 (`WidgetType`, `WidgetBase`, `WidgetConfig` union, `WidgetInstance`) présenté — fichier réel à écrire par l'utilisateur (mode coaching).

### TODOs / Suites

- [ ] **Trancher la forme de `WidgetLayout`** — reorder simple (`{ order }` / index) vs resize dès le départ (`{ x, y, w, h }`). Bloque l'écriture du type `WidgetInstance`. (question ouverte en fin de session)
- [ ] **Écrire `widgets/widgets.types.ts`** une fois `WidgetLayout` tranché — discriminated union + `assertNever` pour l'exhaustivité du Registry.
- [ ] **Confirmer définitivement le modèle de drag** : transient-local + commit-on-drop vs fully-controlled (décide si `useDraggable` garde un state interne).
- [ ] **Trancher `bgColor`/CSS** : persisté par widget (→ champ `style` dans `WidgetInstance`) vs apparence fixe partagée (→ Tailwind dans le Shell).
- [ ] Étapes suivantes une fois la couche 1 figée : signature `useDraggable`, Shell `<Widget>` (physique + effets CSS), puis rendu statique → add/remove → persistance → drag (ordre figé dans l'ADR).
- [ ] Toujours ouverts (hérités) : finir le narrowing du titre `MainHeader` (`handle: unknown`, bloque la compilation), unifier la source de vérité des sections, et la dette front 2026-05-20 (fallback Avatar, `eventClickTest`, `SBCategoriePprops`, `grid` sans cols, hoist `categories`, logo cliquable).

---

## 2026-06-16 — Session pédagogie POO→React + écriture couche 1 widgets

### Décisions

- *(rien de structurant de nouveau)* — session surtout pédagogique et de clarification de modèle mental. Confirme sans les modifier les décisions du 2026-06-15 (archi 5 couches, données séparées des composants, hooks plutôt qu'héritage, option A pour la data). Une orientation d'archi reste **ouverte** (cf. TODOs) : où vit le dispatch du Registry — *option 1* `<Widget>` fait le `switch` lui-même (colle à l'ADR `Widget → WidgetBody → ChartBody`) vs *option 2* `<Dashboard>` choisit le Body et le passe en `children` (Widget = pure coquille type `<Card>`).

### Avancées

- **Couche 1 (donnée) écrite** dans `apps/web/src/components/widgets/widgets.types.ts` : `shapeData {x,y,w,h}`, `WidgetData` (stub vide, TODO), `WidgetConfig` (union discriminée `chart | card | inline`), `WidgetBase` (interface, `{ layout: shapeData }`), `WidgetInstance = WidgetBase & WidgetConfig`. → De facto `WidgetLayout` a pris la forme **`{x,y,w,h}`** (resize-ready), mais sous le nom `shapeData` et sans formalisation du choix reorder-vs-resize laissé ouvert le 2026-06-15.
- **Stubs créés** : `Widget.tsx` (carte `rounded shadow`, contenu « TEST WIDGET ») et `Dashboard.tsx` (instancie un `widgetTest: WidgetInstance`, `useState([])`, rend `<Widget instance={widgetTest} />`).
- **Bug diagnostiqué (pas encore corrigé par l'utilisateur)** : `Widget.tsx:5` signe `function Widget(instance: WidgetInstance)` — faux modèle mental. Un composant reçoit **un seul argument = l'objet props** ; `<Widget instance={...} />` appelle `Widget({ instance })`. Il faut typer les props comme `{ instance: WidgetInstance }` et destructurer. Cause racine = réflexe POO (paramètre nu vs enveloppe props). Explication livrée, correction laissée à l'utilisateur (mode coaching).
- **Sessions pédagogiques livrées** : (1) moyens React de partager comportement/état sans héritage (custom hooks, composition, Context, render props, HOC) + table de correspondance OO→React ; (2) `/greatest-strength` sur le mécanisme interne des hooks (slots/fiber, ordre d'appel, règles des hooks, `useState` re-render vs `useRef` non) ; (3) `/greatest-strength` sur `interface` vs `type` (typage structurel vs nominal — clé pour ex-POO, union impossible en interface, declaration merging) ; (4) cartographie complète des objets/types du système (nature DONNÉE/COMPOSANT/HOOK/TABLE), et clarification du lien `WidgetInstance`↔`<Widget>` (= une prop, pas un `new`) et composition `<Widget>`→`<ChartBody>` (imbrication via Registry, pas héritage).

### TODOs / Suites

- [ ] **Corriger la signature de `Widget.tsx:5`** — props `{ instance }: { instance: WidgetInstance }` + destructuration, au lieu du paramètre nu. (bug bloquant le rendu, identifié cette session)
- [ ] **Trancher où vit le dispatch du Registry** : option 1 (`<Widget>` fait le `switch`) vs option 2 (`<Dashboard>` passe le Body en `children`). Penche option 1 (cohérent ADR 15/06).
- [ ] **Formaliser/renommer `shapeData` → `WidgetLayout`** et acter le choix : le code a de facto pris `{x,y,w,h}` (resize-ready) alors que le 15/06 envisageait `{ order }` simple. Trancher si on assume le resize d'emblée. Nom `shapeData` (minuscule + vague) à revoir.
- [ ] **`data` partagé = perte de narrowing** : les 3 branches de `WidgetConfig` pointent toutes vers le même `WidgetData` (stub vide) → l'union discriminée ne discrimine rien côté `data`. Quand on remplira, donner à chaque branche **sa** forme (`ChartData`, `CardData`…) pour retrouver l'intérêt du narrowing (cf. décision 15/06 « data DANS chaque branche »).
- [ ] **Typer `useState<WidgetInstance[]>([])`** dans `Dashboard.tsx:9` (actuellement inféré `never[]`).
- [ ] Étapes suivantes une fois la couche 1 propre : signature `useDraggable`, Shell `<Widget>` complet (titre/✕/hover), rendu statique → add/remove → persistance → drag (ordre figé dans l'ADR).
- [ ] Toujours ouverts (hérités) : narrowing titre `MainHeader` (`handle: unknown`, bloque la compilation), unifier la source de vérité des sections, dette front 2026-05-20.

---

## 2026-09-24 — Session recadrage du système de widgets (grille statique responsive 12 colonnes)

> Note de continuité : les sessions du 2026-09-05 et du 2026-09-16 ne figurent pas dans ce log. La première est dans `Claude outputs/session-log.md` ; l'ADR « géométrie » du 2026-09-16 vivait dans `.xiaobot/decisions.md`, supprimé ce jour (`87a4912`), et ne subsiste que dans l'historique git (`git show 6c2fe62:.xiaobot/decisions.md`). La doc `docs/widgets/01-analyse.md` (CDC du 05/09) et `docs/vol-cookbook/05-widget-framework.md` sont **en partie obsolètes** : cette entrée fait foi en cas de contradiction.

### Décisions

- **Persona XiaoBot et dossier `.xiaobot/` retirés** — `CLAUDE.md` réécrit sans persona. Le cadre coaching (l'utilisateur écrit le code applicatif) est conservé.
- **Système de widgets neutre, sans domaine métier, « prêt à brancher »** — contexte : l'utilisateur ne veut que le visuel et la mécanique complète, branchés plus tard sur des données non encore décidées. Choix : `domain` et `endpoint` sortent du catalogue. Chaque archétype définit un contrat de données (ex. `stat` = `{ value, unit?, caption? }`), et chaque entrée de catalogue fournit une *source* `(signal) => Promise<Data>`, factice en V1. Critère « prêt à brancher » : brancher une vraie donnée = écrire une source + changer une ligne du catalogue, sans toucher à la grille, à la carte ni au dashboard. Révise le CDC du 05/09 (catalogue typé par domaine, endpoint).
- **Périmètre V1 : ajout / suppression seulement, placement automatique ; drag et resize en V2** — confirme le report du drag de l'ADR du 16/09, contredit le CDC du 05/09 (déplacement en V1). Conséquence : le moteur maison V1 se réduit à des fonctions pures (collision AABB, première place libre) ; le vrai moteur (push, drag) arrive en V2.
- **Moteur de disposition maison** (pas de `react-grid-layout`) — tranche la révision 3 du CDC du 05/09.
- **Persistance : `localStorage` derrière une interface `load()` / `save()`** — l'API NestJS est hors périmètre et se branchera plus tard sur la même interface. Révise le CDC du 05/09 (qui excluait `localStorage` et visait directement l'API).
- **Deux archétypes : `stat` et `chart`**, `chart` restant au placard pour l'instant.
- **Coordonnées explicites stockées dès la V1, même placées par la machine** — l'instance porte `{ id, type, size: {width, height}, position: {x, y} }` (déjà migré dans le code par l'utilisateur). Raison : un retour à une liste ordonnée imposerait une migration des dispositions au drag V2. Le même type peut être posé plusieurs fois (retour de l'`id`, abandon de l'unicité par type du 05/09).
- **Taille portée par l'instance** (préparation du resize). Question ouverte sur le rôle du défaut du catalogue, cf. TODOs.
- **Mode édition conservé** (brouillon, Annuler / Enregistrer) ; **les trous restent** après une suppression, l'ajout comble la première place libre (balayage haut → bas, gauche → droite, sinon sous la dernière rangée).
- **12 colonnes** — révise les 5 colonnes de l'ADR du 16/09 (6 avait été envisagé en cours de session). Raison : granularité plus fine des tailles (quarts possibles). **Taille minimale d'un widget : 2×1.**
- **Responsive : pas de mode medium, échelle pure au-dessus du seuil, une colonne en dessous** — un mode intermédiaire à 6 colonnes a été exploré puis écarté : diviser positions et tailles par 2 crée des chevauchements, diviser les seules tailles ne grossit pas les widgets, et un mode sans positions rendrait le drag V2 impossible sur portable. Choix : au-dessus du seuil, 12 colonnes dont les cases grandissent et rétrécissent proportionnellement (« comme une image »), positions et trous identiques ; en dessous, mode téléphone en une colonne, positions ignorées, ordre de lecture `y` puis `x`, hauteur de `h` rangées fixes de 110px.
- **Mécanique CSS de la grille** (fichier `components/widgets/widget-grid.css`, en `@layer components`) :
  - trois niveaux : `.widget-grid-frame` (conteneur de requête `container: grid / inline-size`, **sans padding**) → `.widget-grid` → `.widget-cell` par widget ;
  - la grille possède le placement ; `<Widget>` ne connaît pas sa taille et remplit sa case ;
  - placement par variables CSS posées en inline (`--col = x+1`, `--row = y+1`, `--w`, `--h`), consommées uniquement dans la container query, ce qui permet au mode téléphone de les ignorer ;
  - dimensions en unités `cqi` : gouttière `--gap: 0.6cqi`, rangée = largeur d'une colonne × 1.3 (`calc((100cqi - 11 * var(--gap)) / 12 * 1.3)`) ;
  - seuil de bascule actuel : `min-width: 866px` de cadre (2×1 ≥ 140px de large) ;
  - aucune mesure JS de l'écran, pas de `ResizeObserver`. Pour le drag V2 : mesure de la grille au `pointerdown` pour convertir pixels → cases.
- **Pas de classes Tailwind de grille sur ces éléments** — la couche `utilities` passerait devant `components` et écraserait la container query.

### Avancées

- `CLAUDE.md` réécrit (commandes, architecture front, routage piloté par `sidebarRoutes`, conventions).
- `apps/web/src/components/widgets/widget-grid.css` créé (règles ci-dessus) et importé par `WidgetGrid.tsx`.
- `WidgetGrid.tsx` restructuré en cadre → grille → cases, avec les 4 variables CSS par case.
- `WidgetCard.tsx` : ajout de `h-full` pour remplir la case.
- Rendu vérifié visuellement par l'utilisateur : placement et échelle fonctionnels ; les cases sont jugées petites près du seuil, résultat accepté en l'état.
- Explications livrées : lignes numérotées de CSS Grid et `span`, auto-placement, `inline-size` / `container-type`, unité `cqi`, `@layer`, pourquoi des variables CSS plutôt que des classes ou du style inline.

### TODOs / Suites

- [ ] **Build cassée** : `Dashboard.tsx` importe `useEffect` et déclare `setWidgets` sans les utiliser (tsc + eslint). Sortir la fixture en `const` de module.
- [ ] **Fixture** : les widgets 6 et 7 se superposent en `(10, 0)`, et tous sont en 2×1. Remplacer par des tailles variées avec trous (proposée : 2×1 `(0,0)`, 4×1 `(2,0)`, 4×2 `(8,0)`, 6×2 `(0,1)`, 3×1 `(6,2)`, 12×1 `(0,3)`).
- [ ] **Tri `y` puis `x`** d'une copie des placements dans `WidgetGrid` avant le `map` (indispensable en mode téléphone). Retirer le `key` en double sur `<Widget>`.
- [ ] **Commentaire de formule du seuil** dans `widget-grid.css`. Envisager de monter le minimum 2×1 à 160px → seuil ≈ 990px.
- [ ] **Padding de la carte proportionnel** (`clamp(8px, 1cqi, 16px)`) à la place de `px-4 py-3.5`, pour que la coquille suive l'effet d'échelle.
- [ ] **Question ouverte : défaut de taille du catalogue** — l'utilisateur a proposé un défaut « en fallback » quand l'instance n'a pas de taille. Recommandation : `size` obligatoire dans l'instance, `defaultSize` du catalogue copié uniquement à l'ajout (sinon un changement de défaut crée des chevauchements dans les dispositions persistées). À trancher.
- [ ] **Nettoyage du catalogue et des types** : retirer `domain` / `endpoint`, clés neutres (`demo.*`) au lieu de `nutrition.dailyKcal`, ajouter `defaultSize` ; déplacer `defaultSize` / `defaultPosition` de `shared/styles/defaultProperties.styles.ts` vers `widgets.types.ts` en PascalCase ; supprimer `sizeClasses` (mort).
- [ ] **`Widget.tsx`** : passer au Body le type rétréci par le `switch` (pas `typeWidget`), JSX imbriqué plutôt que `children={...}`, placeholder honnête pour `chart`. Séparer carte (icône + titre) et Body (donnée de l'archétype).
- [ ] **Questions de conception V1 posées mais non tranchées** (recommandation entre parenthèses) : type de l'`id` (`string` via `crypto.randomUUID()`) ; format stocké versionné (`{ version: 1, placements }`) ; données invalides au chargement (écarter individuellement, `console.warn`, jamais d'écran d'erreur) ; premier lancement (dashboard vide) ; signal de modification (simple état modifié, sans compteur) ; quitter l'édition avec des modifications (confirmation via `useBlocker`) ; palette (panneau groupé par archétype, sans recherche) ; sources factices déterministes plutôt qu'aléatoires ; formatage de la valeur dans le Body (`Intl.NumberFormat`, locale `en`) ; rafraîchissement uniquement par « Réessayer » ; organisation (fonctions pures de géométrie hors React, testées par Vitest ; état dans `pages/Dashboard.tsx`).
- [ ] **Écrire `docs/widgets/00-cadrage-v1.md`** une fois ces questions tranchées, et marquer `01-analyse.md` et `vol-cookbook/05-widget-framework.md` comme dépassés.
- [ ] **Leviers reportés** : contenu adaptatif par widget (`container-type` sur `.widget-cell`) le jour où le contenu sera traité ; sidebar repliable (hors périmètre widgets).

---

## 2026-09-25 — Session questions ouvertes du cadrage widgets

> La spec de référence est désormais **`docs/widgets/00-cadrage-v1.md`**. Elle consolide les décisions du 24/09 et celles-ci.

### Décisions

- **Défaut de taille porté par l'archétype, surchargeable par le catalogue** — l'utilisateur propose un `defaultSize` obligatoire sur l'archétype (un chart a besoin de plus de place qu'un stat). Complété par un `minSize` par archétype, qui relève le plancher global 2×1. À l'ajout : `entrée.defaultSize ?? archétype.defaultSize`, **copié dans l'instance**. Tranche la question ouverte du 24/09 : un défaut n'est jamais appliqué à l'affichage. Conséquence : la table des archétypes devient `{ Body, defaultSize, minSize }`.
- **`id` en UUID** (`crypto.randomUUID()`). Le champ `type` existant sert déjà de clé de catalogue (identification de l'indicateur) : rien à ajouter.
- **Format `localStorage` = tableau seul**, sans version pour l'instant (migration future détectable par `Array.isArray`).
- **Chargement : réparer plutôt qu'écarter.** JSON illisible → dashboard vide ; widget illisible ou type inconnu → écarté avec `console.warn` ; géométrie invalide ou chevauchement → taille ramenée dans les bornes, puis replacé **sous le widget le plus bas**, après les widgets valides et dans l'ordre d'origine. La réparation n'est pas enregistrée avant un *Enregistrer* explicite.
- **États d'un widget : `loading | success | error`** en union discriminée, suffisants pour la V1. **Fournis en dur** pour l'instant, pour ne travailler que l'affichage (pas de sources factices). Recommandation : les fournir depuis l'emplacement du futur hook de chargement.
- **Premier lancement = dashboard vide** ; **simple état modifié** sans compteur ; **confirmation** en quittant l'édition (`useBlocker`) ; **palette** en panneau latéral groupé par archétype, qui reste ouverte ; **formatage dans le Body** (données brutes, `Intl.NumberFormat`, locale `en`) ; **organisation** : géométrie pure hors React testée avec Vitest, état dans `pages/Dashboard.tsx`, affichage dans `components/widgets/`.

### Avancées

- `docs/widgets/00-cadrage-v1.md` créé : périmètre, modèle à trois niveaux, grille et responsive, comportement, persistance et réparation, états, critères d'acceptation, options écartées, valeurs à fixer.
- Bandeaux « dépassé » ajoutés en tête de `docs/widgets/01-analyse.md` et de `docs/vol-cookbook/05-widget-framework.md`.
- `CLAUDE.md` : renvoie vers `00-cadrage-v1.md` comme spec, avec le modèle archétype / catalogue / instance.

### TODOs / Suites

- [ ] Valeurs à fixer : `defaultSize` / `minSize` de `stat` et `chart` ; seuil définitif (866px ou ≈ 990px) ; padding proportionnel de la carte.
- [ ] Les TODOs de code du 24/09 restent ouverts (build cassée, fixture, tri, nettoyage du catalogue et des types, `Widget.tsx`), avec en plus : passer `id` en `string`, et créer la table des archétypes `{ Body, defaultSize, minSize }`.
