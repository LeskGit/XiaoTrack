# Cookbook de vol — React + React Router + État/Persistance + TypeScript

> Doc perso hors-ligne pour construire un **mini framework de widgets** pendant un vol de 17 h sans wifi.
> Format : cookbook. Chaque recette = **problème → explication courte → exemple copiable → pièges**.
> Stack réelle du projet (juillet 2026) : React **19.2**, TypeScript **5.9**, Vite **7**, Tailwind **v4**, React Router **v7**.

---

## ⚠️ Cadre : c'est une doc, pas ton code

Ce projet est un **sandbox d'apprentissage** : tu écris **tout le code applicatif toi-même**. Cette doc ne contient donc **aucun code prêt à coller dans `apps/web`**. Les exemples sont **génériques et illustratifs** (domaines neutres : `Block`, `Panel`, `Task`…), choisis pour te faire comprendre un **pattern**, pas pour te livrer ta feature.

Quand un point touche ton code réel (ex. ta couche `WidgetInstance`, ton `router.tsx`), c'est signalé dans un bloc **« 🔗 Dans ton projet »** sous forme de **note** — à toi de l'implémenter.

Cohérent avec ton ADR : **pas de store (Redux/Zustand)**. La persistance suit **ta pyramide `useState → localStorage → API Nest`** (fichier `04`).

---

## Comment utiliser cette doc

Pas besoin de lire dans l'ordre. Trois usages :

1. **Je bloque sur un truc précis** → va à la recette (sommaire en tête de chaque fichier).
2. **Je découvre une brique** → lis l'intro du fichier, puis pioche.
3. **Je veux avancer le framework** → suis « L'ordre de build » plus bas, il t'envoie à la bonne recette au bon moment.

Les blocs de code sont **autonomes et copiables** pour t'entraîner. L'alias `@` → `apps/web/src` est celui de ton projet.

---

## Les fichiers

| Fichier | Contenu | Quand l'ouvrir |
| --- | --- | --- |
| `00-index.md` | Ce fichier : cadre, setup, ordre de build, carte mentale | Au décollage |
| `01-typescript.md` | TS pour React : `type` vs `interface`, génériques, utility types, typer props/events, **discriminated unions + `assertNever`** | Dès que tu galères à typer |
| `02-react.md` | Composants, tous les hooks, custom hooks, perf, patterns de composition | Le socle |
| `03-react-router.md` | React Router **v7** (data router) : routes, params, nested/`Outlet`, `loader`/`redirect`, `handle`/`useMatches`, routes protégées, lazy | La navigation |
| `04-redux.md` *(→ « État & persistance »)* | **La pyramide `useState → localStorage → API`** : `useReducer`, Context pour les actions, hook `useLocalStorage`, sérialisation, migrations, sync API, pièges | Pour que le dashboard survive au refresh |
| `05-widget-framework.md` | **Le cœur** : les 5 couches (donnée sérialisable, hook headless, shell, registry par `type`, orchestration) en **exemples génériques** | Le gros morceau |
| `06-testing.md` | Vitest + React Testing Library : composants, reducers purs, hooks | Si tu veux sécuriser |

> Note : le fichier `04` s'appelle encore `04-redux.md` sur le disque (résidu d'un premier jet). Son **contenu** est bien « État & persistance sans store ». Renomme-le en `04-persistence.md` si tu veux — je ne touche pas à tes fichiers.

---

## Setup : installer la stack (à faire AVANT le vol, wifi requis)

> ⚠️ `npm install` télécharge depuis le réseau. **Fais tout ça au sol**, sinon tu es coincé. React Router est **déjà** dans le projet.

Depuis la racine du monorepo (tout cible le workspace web) :

```bash
# React Router v7 est déjà présent — rien à installer côté routing/état.
# La persistance = localStorage (natif) + fetch (natif) : zéro dépendance.

# Testing seulement (Vitest s'intègre nativement à Vite, pas Jest ici)
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom -w apps/web
```

Vérifie que c'est là (offline) :

```bash
ls apps/web/node_modules/vitest apps/web/node_modules/@testing-library/react
```

> 🔗 **Dans ton projet** — la config Vitest touche `vite.config.ts` et `tsconfig.app.json`, qui sont **tes fichiers**. Je ne les modifie pas. Le fichier `06-testing.md` te donne le contenu à ajouter **toi-même** (config `test`, `setupFiles`, `types`).

---

## L'ordre de build (le chemin recommandé pendant le vol)

Aligné sur l'ordre figé dans ton ADR (rendu statique → remove → add → persistance → drag). À chaque étape, la recette qui aide.

1. **Poser la couche donnée** — le type sérialisable de l'instance (id, type, layout, data), en **discriminated union** sur `type`. → `01` §7-8 + `05` §1.
2. **Le registry** — table `type → Body`, avec **exhaustivité** (`assertNever`). → `01` §7 + `05` §2-3.
3. **Le rendu statique** — un shell générique qui affiche le bon Body selon `type`. → `05` §3-4.
4. **Remove puis add** — liste d'instances en `useState` chez le parent (immutabilité). → `02` §2 + `05` §5.
5. **La persistance** — hook `useLocalStorage`, sérialisation, rehydration. → `04` en entier.
6. **Le comportement (drag)** — hook headless `useDraggable` (Pointer Events), transient-local + commit-on-drop. → `05` §6.
7. **(Plus tard) API Nest** — remonter la persistance vers le back. → `04` §7.
8. **(Bonus) Tests** — sécuriser le reducer/registry/hook. → `06`.

> Vise un **v1 qui marche à l'étape 5** (widgets affichés + add/remove + persistance). Le drag (6) est l'étape « physique », à attaquer une fois le reste stable.

---

## Carte mentale : qui fait quoi

```
┌──────────────────────────────────────────────────────────────┐
│  TypeScript   → décrit la forme des données (instances, config) │
│  React        → transforme ces données en UI (composants/hooks) │
│  useState     → détient l'état (la liste d'instances) au parent  │
│  localStorage → sauve cet état entre deux visites (via un hook)  │
│  fetch → API  → persistance long terme (back NestJS) — plus tard │
│  React Router → décide QUELLE page/section est affichée          │
└──────────────────────────────────────────────────────────────┘

  Flux de la pyramide de persistance :

  localStorage ──(lecture au montage)──▶ useState(parent) ──▶ props ──▶ <Shell/Body>
        ▲                                     │
        │                                     ▼
     (écriture via useEffect)  ◀──  setState(add/remove/move)  ◀── interaction
        │
        ▼ (plus tard, en bonus)
     API NestJS  ◀── sync explicite (save/load)
```

---

## Conventions des exemples (alignées sur `docs/coding-conventions.md`)

- `type` partout (pas `interface`, sauf extension externe). Props suffixées `Props`, `readonly`.
- `import type` systématique (`verbatimModuleSyntax` est activé).
- Étendre les attributs HTML natifs (`ButtonHTMLAttributes<…>`) plutôt que redéclarer.
- Maps figées en `as const` + type dérivé via `keyof typeof`.
- Handlers internes préfixés `handle`, props d'événements préfixées `on`.
- Pas de `any` → `unknown` + narrowing.
- Icônes SVG suffixées `Icon`, passées à `<Icon />`.

Bon vol. ✈️
