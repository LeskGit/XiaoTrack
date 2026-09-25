# Système de widgets — Plan de développement V1

> **Pour qui** : toi seul, clavier en main. **Spec de référence** : [`00-cadrage-v1.md`](00-cadrage-v1.md) (les renvois `§` pointent vers lui).
> **Point de départ** : le code au 2026-09-25 (grille CSS fonctionnelle, build qui passe, fixture uniquement en 2×1).
> **Règle d'or** : chaque étape laisse une app **qui compile et qui tourne**. Ne passe à l'étape suivante que quand le « Terminé quand » est vrai. Un commit par étape.
> **Pas de corrigé** : chaque étape dit *quoi* faire, *où*, *quel piège* éviter et *comment savoir que c'est fini*. Le *comment* est à toi. Les fiches `prerequis/NN` expliquent les notions.

---

## Vue d'ensemble

```
PHASE 0 ─ Remise à plat          types propres, constantes, Vitest prêt
   │
PHASE 1 ─ Grille statique        tri, fixture variée, réglages visuels
   │
PHASE 2 ─ Archétypes & catalogue table des archétypes, catalogue neutre, carte ≠ Body
   │
PHASE 3 ─ États en dur           loading / success / error affichés, formatage
   │
PHASE 4 ─ Moteur pur (Vitest)    collision, place libre, tri — sans React
   │
PHASE 5 ─ Édition en mémoire     mode édition, ajout, suppression, vide, confirmation
   │
PHASE 6 ─ Persistance            load/save, localStorage, réparation au chargement
   │
PHASE 7 ─ Recette                les 11 critères du §9
```

Les phases 3 et 4 sont indépendantes : tu peux faire la 4 avant la 3 si tu as envie de logique pure plutôt que d'UI. La 5 a besoin des deux.

---

## Les schémas de référence

### A. Arborescence cible

```
src/
├─ pages/
│  └─ Dashboard.tsx                ← orchestration : disposition enregistrée, brouillon, mode édition
│
└─ components/widgets/
   ├─ index.ts                     ← barrel (ré-exports uniquement)
   ├─ widgets.types.ts             ← GridSize, GridPosition, WidgetInstance, WidgetArchetype…
   ├─ widget-data.types.ts         ← StatData, WidgetDataState<T>
   ├─ grid.constants.ts            ← GRID_COLS = 12, MIN_SIZE = { 2, 1 }
   ├─ archetypes.ts                ← table { stat, chart } → { Body, defaultSize, minSize }
   ├─ catalog.ts                   ← entrées demo.* → { title, icon, archetype, defaultSize? }
   │
   ├─ WidgetGrid.tsx               ← cadre → grille → cases (+ tri)
   ├─ widget-grid.css
   ├─ Widget.tsx                   ← relie instance → catalogue → archétype → état → carte
   ├─ WidgetCard.tsx               ← coquille : en-tête (icône, titre, ✕), 3 états
   ├─ WidgetPalette.tsx            ← panneau d'ajout
   ├─ DashboardToolbar.tsx         ← Éditer / Annuler / Enregistrer
   ├─ EmptyDashboard.tsx           ← « Ajouter mon premier widget »
   ├─ useWidgetData.ts             ← V1 : renvoie un état en dur
   │
   ├─ bodies/                      ← (renommé depuis catalog/ : évite la confusion avec catalog.ts)
   │  ├─ StatBody.tsx
   │  └─ ChartBody.tsx             ← placeholder honnête
   │
   ├─ engine/                      ← TypeScript pur, zéro React, testé avec Vitest
   │  ├─ geometry.ts   + geometry.test.ts
   │  └─ repair.ts     + repair.test.ts
   │
   └─ storage/
      ├─ layoutStorage.ts          ← le type de l'interface load/save
      └─ localLayoutStorage.ts     ← l'implémentation localStorage
```

Les noms sont des propositions. Seule la **séparation** compte : l'affichage, le moteur pur et le stockage ne se mélangent pas.

### B. Arbre des composants (état final V1)

```
<Dashboard>                            state : saved, draft, isEditing, isPaletteOpen
 ├─ <DashboardToolbar>                 Éditer | Annuler · Enregistrer   (caché en mode téléphone)
 ├─ <EmptyDashboard>                   si aucune instance
 ├─ <WidgetGrid instances isEditing onRemove>
 │   └─ div.widget-cell  ×N            --col --row --w --h
 │       └─ <Widget instance isEditing onRemove>
 │           │   catalogue[instance.type]    → titre, icône, archétype
 │           │   archetypes[archétype]       → Body
 │           │   useWidgetData(instance)     → { status, … }
 │           └─ <WidgetCard title icon onRemove? state>
 │               └─ <StatBody data> | <ChartBody data>   (seulement si success)
 └─ <WidgetPalette onAdd>              si isEditing && isPaletteOpen
```

### C. Qui connaît quoi

```
            CODE (jamais persisté)                     DONNÉES (persistées)
 ┌───────────────────────────────┐          ┌────────────────────────────────┐
 │ archetypes                    │          │ WidgetInstance[]               │
 │  stat → Body, defaultSize,    │          │  { id, type, size, position }  │
 │         minSize               │          └───────────────┬────────────────┘
 │ catalog                       │                          │
 │  demo.x → title, icon,        │  type  ◄─────────────────┘  (seule jointure)
 │           archetype,          │
 │           defaultSize?        │
 └───────────────────────────────┘

 À L'AJOUT seulement :  size = entrée.defaultSize ?? archétype.defaultSize  → copiée dans l'instance
 À L'AFFICHAGE :        la grille lit size + position ; le Widget lit type ; personne ne relit un défaut
```

### D. Mode édition

```
                 ┌──────────── Annuler (draft ← saved) ───────────┐
                 ▼                                                │
         ┌──────────────┐    Éditer (draft ← saved)       ┌───────┴──────┐
         │   LECTURE    │ ──────────────────────────────► │   ÉDITION    │ ◄─┐ ajouter / ✕
         │ affiche saved│                                 │ affiche draft│ ──┘ (draft change)
         └──────────────┘ ◄────────────────────────────── └───────┬──────┘
                 ▲            Enregistrer (save(draft),           │ quitter la page
                 │             saved ← draft)                     ▼ si modifié
                 │                                         confirm() via useBlocker
```

### E. Chargement et réparation (phase 6)

```
 localStorage ──► texte ──► JSON.parse ──✗──► []                (dashboard vide)
                               │ ✓
                               ▼
                           unknown ──► pas un tableau ? ──► []
                               │
                               ▼  pour chaque élément
                  lisible ? (id string, nombres…) ──✗──► écarté + warn
                               │
                  type dans le catalogue ? ────────✗──► écarté + warn
                               │
                  géométrie valide et libre ? ──✓──► VALIDES
                               │ ✗
                               ▼
                           À RÉPARER (ordre d'origine)
                               │
      VALIDES posés d'abord, puis chaque À RÉPARER : taille bornée, y = max(y + h)
                               │
                               ▼
                    WidgetInstance[] affichés    (rien n'est réécrit dans le stockage)
```

---

## PHASE 0 — Remise à plat

### Étape 0.1 — Vitest opérationnel
- **Fichiers** : aucun fichier applicatif ; un `src/components/widgets/engine/geometry.test.ts` jetable.
- **À faire** : `vitest` est déjà déclaré dans `package.json`. Vérifie que `npm test` (dans `apps/web`) le trouve ; sinon, `npm install` à la racine. Écris un test trivial, puis un test qui importe via `@/`.
- **Notions** : fiche 0.
- **Piège** : l'alias `@/` doit fonctionner dans les tests. Vérifie-le maintenant, pas à la phase 4.
- **Terminé quand** : un test vert, un test rouge lisible quand tu casses l'assertion, et un import `@/` qui passe.

### Étape 0.2 — Les types de géométrie à leur place
- **Fichiers** : `widgets.types.ts`, `shared/styles/defaultProperties.styles.ts`, `catalog.ts`.
- **À faire** :
  - déplacer `defaultSize` / `defaultPosition` dans `widgets.types.ts`, renommés en PascalCase (proposition : `GridSize`, `GridPosition`) ;
  - supprimer `sizeClasses`, qui est mort ;
  - déplacer `WidgetInstance` de `catalog.ts` vers `widgets.types.ts` : c'est un type de données, pas du catalogue ;
  - passer `id` en `string`.
- **Piège** : `WidgetType` est dérivé du catalogue, et `WidgetInstance` en a besoin. `widgets.types.ts` importera donc le **type** depuis `catalog.ts` (`import type`), jamais l'inverse pour une valeur. Surveille les imports circulaires.
- **Terminé quand** : la build passe, et `shared/styles` ne contient plus que des styles.

### Étape 0.3 — Les constantes de la grille
- **Fichiers** : `grid.constants.ts`.
- **À faire** : `GRID_COLS = 12` et `MIN_SIZE = { width: 2, height: 1 }`. Ce sont les seules valeurs géométriques partagées entre JS et CSS : mets en commentaire que `widget-grid.css` dépend de `12`.
- **Terminé quand** : aucun `12` en dur ne traîne dans le TS.

---

## PHASE 1 — Grille statique complète

### Étape 1.1 — Le tri en ordre de lecture
- **Fichiers** : `WidgetGrid.tsx`.
- **À faire** : rendre une **copie** triée par `position.y`, puis `position.x`.
- **Piège** : `.sort()` modifie le tableau d'origine, qui est ta prop. Deux voies :
  - **(a)** passer `lib` (et `target`) à `ES2023` dans `tsconfig.app.json`, puis utiliser `toSorted()`, qui trie une copie. `toSorted()` date d'ES2023 ; les navigateurs visés l'ont, puisque la grille utilise déjà des container queries, plus récentes ;
  - **(b)** rester en ES2022 et écrire `[...widgets].sort(...)`.
- **Terminé quand** : en mode téléphone, l'ordre d'empilement suit la lecture, même avec une fixture volontairement mélangée.

### Étape 1.2 — Une vraie fixture
- **Fichiers** : `Dashboard.tsx`, ou un `dashboard.fixture.ts` à côté.
- **À faire** : remplacer les 7 widgets en 2×1 par des tailles variées, avec des trous, et **dans le désordre** (pour tester l'étape 1.1).

  | id | x | y | w | h |
  |---|---|---|---|---|
  | "a" | 0 | 0 | 2 | 1 |
  | "b" | 2 | 0 | 4 | 1 |
  | "c" | 8 | 0 | 4 | 2 |
  | "d" | 0 | 1 | 6 | 2 |
  | "e" | 6 | 2 | 3 | 1 |
  | "f" | 0 | 3 | 12 | 1 |

  Trous attendus : colonnes 6 et 7 sur les rangées 0 et 1 ; colonnes 9 à 11 sur la rangée 2.
- **Terminé quand** : les trous sont visibles, et le badge `grid` de l'inspecteur Chrome montre chaque widget sur les bonnes lignes.

### Étape 1.3 — Les réglages visuels
- **Fichiers** : `widget-grid.css`, `WidgetCard.tsx`.
- **À faire** :
  - écrire la formule du seuil en commentaire ;
  - choisir le seuil définitif (866px, ou ≈ 990px pour un 2×1 de 160px minimum) ;
  - remplacer `px-4 py-3.5 gap-2.5` de la carte par un padding proportionnel (`clamp(8px, 1cqi, 16px)`), dans une classe de `widget-grid.css`.
- **Piège** : si tu laisses les classes Tailwind de padding sur la carte, elles battent ta classe (couche `utilities`).
- **Terminé quand** : en rétrécissant la fenêtre, le padding rétrécit avec les cases, et la bascule en une colonne tombe au seuil choisi.

---

## PHASE 2 — Archétypes et catalogue (§3)

### Étape 2.1 — La table des archétypes
- **Fichiers** : `archetypes.ts`, `bodies/StatBody.tsx` (déplacé depuis `catalog/`), `bodies/ChartBody.tsx`.
- **À faire** : une entrée par valeur de `WidgetArchetype`, avec `Body`, `defaultSize` et `minSize`. `stat` en 2×1 minimum ; `chart` avec un défaut plus grand (4×2 ?) et un Body qui affiche honnêtement « Chart — not implemented ».
- **Notions** : fiches 1 et 5.
- **Piège n°1** : type la table avec `satisfies Record<WidgetArchetype, …>`. Ajouter un archétype sans l'y mettre doit **casser la compilation**. C'est ton filet d'exhaustivité.
- **Piège n°2** : chaque Body attend une donnée différente (`StatData`, `ChartData`). Quand tu écris `archetypes[archetype].Body` avec une clé variable, TypeScript perd la correspondance entre la clé et la donnée. Si le typage résiste, garde un `switch` exhaustif sur l'archétype pour choisir le Body (avec un `never` dans le `default`). La table sert alors aux tailles, et le `switch` au rendu. C'est un compromis honnête, pas un échec.
- **Terminé quand** : supprimer l'entrée `chart` de la table fait échouer `tsc`.

### Étape 2.2 — Le catalogue neutre
- **Fichiers** : `catalog.ts`, `widgets.types.ts` (`WidgetDefinition`).
- **À faire** :
  - retirer `domain`, `endpoint` et `unit` (l'unité appartient à la **donnée** `StatData`, pas au catalogue) ;
  - `defaultSize` optionnel ;
  - 3 ou 4 entrées `demo.*`, dont une qui surcharge sa taille et une en `chart` ;
  - retirer l'import de `MainDomain`.
- **Terminé quand** : `widgets.types.ts` n'importe plus rien de `shared/types/domain.types`, et `WidgetType` propose tes clés `demo.*` en autocomplétion.

### Étape 2.3 — La carte et le Body se séparent
- **Fichiers** : `Widget.tsx`, `WidgetCard.tsx`, `StatBody.tsx`.
- **À faire** :
  - la **carte** affiche l'en-tête (icône et titre du catalogue) et reçoit le Body en `children` ;
  - le **Body** ne reçoit que la donnée de son archétype. Pour l'instant, une valeur en dur, par exemple `{ value: 1840, unit: "kcal" }` ;
  - `Widget` fait les recherches (catalogue, puis archétype) ;
  - écrire le JSX imbriqué, pas `children={...}`.
- **Piège** : l'ancien `switch` passait `typeWidget` au lieu de la variable rétrécie. Passe la valeur que le `switch` a rétrécie, sinon il ne sert à rien.
- **Terminé quand** : `StatBody` n'importe plus rien du catalogue, et toutes les cartes ont le même en-tête.

---

## PHASE 3 — États en dur (§7)

### Étape 3.1 — Le type des états
- **Fichiers** : `widget-data.types.ts`.
- **À faire** : `StatData`, et un `WidgetDataState<T>` en union discriminée sur `status` : `loading` (rien), `success` (`data: T`), `error` (`message`).
- **Notions** : fiche 2.
- **Piège** : `{ isLoading, error, data }` avec trois champs optionnels. C'est justement ce qu'on s'interdit : ça autorise `isLoading: true` avec une erreur en même temps.
- **Terminé quand** : dans un `if (state.status === "success")`, `state.data` est accessible, et ailleurs `tsc` refuse d'y accéder.

### Étape 3.2 — Le hook de chargement factice
- **Fichiers** : `useWidgetData.ts`.
- **À faire** : `useWidgetData(instance)` renvoie un état **en dur**. Le plus simple : une petite table `type → état` dans le hook, pour que `demo.loading` soit toujours en chargement, `demo.broken` toujours en erreur, etc.
- **Pourquoi un hook dès maintenant** : le jour du branchement, seul l'intérieur de ce fichier changera (source, `useEffect`, `AbortController`). `Widget` ne bougera pas.
- **Terminé quand** : `Widget` obtient son état uniquement par ce hook.

### Étape 3.3 — Afficher les trois états
- **Fichiers** : `WidgetCard.tsx` (ou `Widget.tsx`).
- **À faire** :
  - `loading` : un squelette qui remplit toute la carte ;
  - `error` : un message court et un bouton « Retry » (sans effet pour l'instant) ;
  - `success` : le Body.
- **Piège** : le squelette doit occuper la **taille finale**. Grâce à la grille, c'est gratuit, à condition que le squelette fasse `h-full` et ne dépende pas d'un contenu.
- **Terminé quand** : la fixture montre les trois états côte à côte, et aucune case ne change de taille selon son état.

### Étape 3.4 — Le formatage
- **Fichiers** : `StatBody.tsx`.
- **À faire** : formater `value` avec `Intl.NumberFormat("en")`. L'unité vient de la donnée.
- **Piège** : créer le formateur **hors** du composant (une constante de module). Le recréer à chaque rendu coûte pour rien (conventions §4.7).
- **Terminé quand** : `1840` s'affiche `1,840`.

---

## PHASE 4 — Le moteur pur (Vitest)

Tout ici est du **TypeScript sans React** dans `engine/geometry.ts`, écrit **test d'abord** : tu écris le tableau de cas, tu le vois échouer, puis tu codes.

### Étape 4.1 — La collision
- **À faire** : `overlaps(a, b)` sur deux rectangles.
- **Notions** : fiche 3.
- **Cas obligatoires** :
  - éloignés → non ;
  - identiques → oui ;
  - superposition partielle sur les deux axes → oui ;
  - adjacents en largeur (`x 0 w 2` et `x 2 w 2`) → **non** ;
  - adjacents en hauteur → **non** ;
  - chevauchement horizontal seulement → non.
- **Piège** : les comparaisons doivent être **strictes** (`<`, `>`). Avec `<=`, deux widgets qui se touchent sont déclarés en collision.
- **Terminé quand** : tous les cas sont verts.

### Étape 4.2 — Les bornes
- **À faire** : `isInsideGrid(p)` (x ≥ 0, y ≥ 0, x + w ≤ 12) et `clampSize(size, min)` (entre le minimum et 12 colonnes).
- **Cas** : widget pile au bord droit (`x 10 w 2`) → dedans ; `x 11 w 2` → dehors ; taille 1×1 avec un minimum 2×1 → 2×1 ; largeur 20 → 12.

### Étape 4.3 — La première place libre
- **À faire** : `findFirstFreeSpot(placements, size)` : balayer les rangées de haut en bas, puis les colonnes de gauche à droite, et renvoyer la première position où le rectangle tient sans chevauchement. Si rien ne tient, sous le widget le plus bas.
- **Cas** :
  - grille vide → `(0, 0)` ;
  - un trou assez grand en haut → le trou ;
  - un trou trop petit → le trou est sauté ;
  - grille pleine sur 12 colonnes → sous la dernière rangée ;
  - un widget de 12 de large → toujours en `x = 0`.
- **Piège** : le balayage doit s'arrêter à `x ≤ 12 - w`, pas à `x < 12`. Et il faut une borne de rangées pour ne pas boucler à l'infini : `max(y + h)` suffit, puisque sous cette ligne tout est libre.
- **Terminé quand** : tous les cas sont verts. Tu as maintenant tout ce qu'il faut pour l'ajout.

### Étape 4.4 — Les utilitaires
- **À faire** :
  - `bottomY(placements)`, qui vaut `max(y + h)`, ou 0 si la liste est vide ;
  - `sortReadingOrder(placements)`, qui renvoie une copie ;
  - déplacer le tri de l'étape 1.1 dans cette fonction et l'utiliser dans `WidgetGrid`.
- **Terminé quand** : `WidgetGrid` n'a plus de logique de tri en ligne.

---

## PHASE 5 — Édition en mémoire (§5)

La disposition vit en `useState` dans `Dashboard`, et part de la fixture. Pas encore de stockage.

### Étape 5.1 — Les états du Dashboard
- **Fichiers** : `Dashboard.tsx`.
- **À faire** : `saved`, `draft`, `isEditing`, `isPaletteOpen`. En lecture, la grille affiche `saved` ; en édition, `draft`.
- **Notions** : fiche 4.
- **Piège** : le « modifié » se **déduit**, il ne se stocke pas : `isDirty = draft !== saved`. Ça marche parce que tu ne mutes jamais les tableaux : chaque ajout ou suppression crée un nouveau tableau, et Annuler remet la même référence. Un booléen stocké à part finirait par se désynchroniser. Si tu préfères, extrais tout ça dans un hook `useDashboardLayout`.
- **Terminé quand** : l'état est en place, même sans boutons.

### Étape 5.2 — La barre d'outils
- **Fichiers** : `DashboardToolbar.tsx`.
- **À faire** : en lecture, « Edit ». En édition, « Add widget », « Cancel » et « Save » (« Save » désactivé si rien n'a changé). Suis le schéma D pour les transitions.
- **Astuce** : pour cacher la barre en mode téléphone **sans JS**, place-la **à l'intérieur** de `.widget-grid-frame` et cache-la dans le CSS, sous le même seuil de container query. Le seuil reste ainsi à un seul endroit.
- **Terminé quand** : Edit → Cancel restaure exactement la même disposition, et la barre disparaît sous le seuil.

### Étape 5.3 — Supprimer
- **Fichiers** : `WidgetGrid.tsx`, `Widget.tsx`, `WidgetCard.tsx`.
- **À faire** : un `✕` dans l'en-tête de la carte, seulement quand `isEditing`. `onRemove(id)` remonte jusqu'au Dashboard, qui filtre `draft`.
- **Piège** : le `✕` est un `<button>` avec un `aria-label` (conventions §8). Deux niveaux de props à faire descendre, c'est acceptable : pas besoin de Context ici.
- **Terminé quand** : la suppression laisse un trou, et Cancel fait revenir le widget.

### Étape 5.4 — Ajouter
- **Fichiers** : `WidgetPalette.tsx`, `Dashboard.tsx`.
- **À faire** :
  - la palette liste le catalogue, regroupé par archétype ;
  - un clic appelle `onAdd(type)` ;
  - le Dashboard construit l'instance : `id` via `crypto.randomUUID()`, taille par la règle §3.4, position via `findFirstFreeSpot` ;
  - la palette reste ouverte.
- **Piège** : la taille est **résolue une fois, ici**, puis copiée. Si tu la calcules dans `WidgetGrid`, tu as réintroduit le défaut appliqué à l'affichage.
- **Terminé quand** : ajouter un 2×1 après une suppression remplit le trou s'il y tient, et un widget trop grand va en bas.

### Étape 5.5 — Le dashboard vide
- **Fichiers** : `EmptyDashboard.tsx`, `Dashboard.tsx`.
- **À faire** : aucune instance → écran d'accueil. Son bouton passe en édition **et** ouvre la palette.
- **Terminé quand** : après avoir supprimé tous les widgets puis enregistré, l'écran d'accueil apparaît.

### Étape 5.6 — Confirmer avant de quitter
- **Fichiers** : `Dashboard.tsx`.
- **À faire** : `useBlocker` (React Router), actif quand `isEditing && isDirty`. Il demande confirmation avant une navigation vers une autre page de l'app.
- **Piège** : `useBlocker` ne marche qu'avec un data router. Tu en as un (`createBrowserRouter`). Il ne couvre pas la fermeture de l'onglet (c'est `beforeunload`), hors périmètre V1.
- **Terminé quand** : cliquer sur « Nutrition » dans la sidebar pendant une édition modifiée demande confirmation.

---

## PHASE 6 — Persistance (§6)

### Étape 6.1 — L'interface
- **Fichiers** : `storage/layoutStorage.ts`.
- **À faire** : un type avec `load()` et `save(instances)`.
- **Piège, et décision à prendre ici** : localStorage est synchrone, une API ne l'est pas. Déclare **dès maintenant** `load(): Promise<…>` et `save(): Promise<void>`, même si l'implémentation locale répond tout de suite. Sinon, le branchement de l'API changera tous les appelants, et c'est exactement ce que l'interface doit éviter.
- **Terminé quand** : le type existe et ne mentionne pas `localStorage`.

### Étape 6.2 — La réparation, test d'abord
- **Fichiers** : `engine/repair.ts` et `repair.test.ts`.
- **À faire** : `repairLayout(raw: unknown): WidgetInstance[]`, qui suit le schéma E.
- **Notions** : un gardien de type (*type guard*) sur `unknown`, pour vérifier la forme d'un élément avant de lui faire confiance.
- **Cas obligatoires** :
  - pas un tableau → `[]` ;
  - un élément sans `id` → écarté ;
  - un type inconnu → écarté ;
  - `x 11 w 2` → replacé en bas ;
  - taille 1×1 → ramenée à 2×1 et replacée si besoin ;
  - deux widgets qui se chevauchent → le second en bas ;
  - deux invalides → replacés dans leur ordre d'origine ;
  - un JSON entièrement valide → rendu **identique**.
- **Piège** : ne pas faire le `JSON.parse` ici. `repairLayout` reçoit un `unknown` déjà parsé : la fonction reste pure et se teste sans chaîne JSON. Le parse (et son `try/catch`) va dans l'étape 6.3.
- **Terminé quand** : tous les cas sont verts.

### Étape 6.3 — L'implémentation localStorage
- **Fichiers** : `storage/localLayoutStorage.ts`.
- **À faire** : une clé de stockage en constante. `load` = lire → `JSON.parse` dans un `try/catch` (échec → `[]`) → `repairLayout`. `save` = `JSON.stringify`.
- **Terminé quand** : tu écris un JSON cassé à la main dans l'onglet Application des DevTools, et l'app s'affiche vide sans planter.

### Étape 6.4 — Brancher le Dashboard
- **Fichiers** : `Dashboard.tsx`.
- **À faire** : au montage, `load()` remplit `saved`. « Save » appelle `save(draft)`, puis `saved ← draft`. Pendant le chargement, rien ou un squelette de grille ; ensuite, la grille ou l'écran vide. La fixture ne sert plus que pour le développement.
- **Notions** : fiche 6 (effet au montage, et pourquoi StrictMode le lance deux fois en développement).
- **Piège** : StrictMode monte le composant deux fois en dev, donc l'effet de chargement part deux fois. Avec localStorage c'est sans conséquence, mais c'est l'occasion de prendre l'habitude d'ignorer le résultat d'un effet nettoyé.
- **Terminé quand** : tu ajoutes un widget, tu enregistres, tu recharges la page, et il est là.

---

## PHASE 7 — Recette

Reprends les **11 critères du §9 du cadrage**, un par un, sur l'app réelle. Chaque critère qui échoue renvoie à une étape de ce plan. Une fois les 11 validés, la V1 est finie. Ensuite seulement : branchement d'une vraie donnée, puis V2 (drag).

---

## Si tu bloques

- **Tu débogues une géométrie depuis plus d'une heure** → sors la fonction, écris le cas qui échoue en test Vitest, et regarde-le tout seul. C'est pour ça que le moteur est pur.
- **Un comportement CSS bizarre** → inspecteur, badge `grid`, puis l'onglet des styles calculés de la `.widget-cell`. Une déclaration barrée veut dire qu'elle a été rejetée ou battue.
- **Tu hésites sur l'endroit où va un calcul** → relis le schéma C. Si le calcul lit un défaut, il va à l'ajout. S'il lit `size` ou `position`, il va dans la grille. S'il lit `type`, il va dans le Widget.
