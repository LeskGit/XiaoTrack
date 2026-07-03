# 02 — React 19 (cookbook)

> Le socle. Composants + hooks. Tout le reste (Router, persistance, framework) se pose par-dessus.
> React 19 apporte quelques nouveautés (`ref` en prop, `<Context>` provider) signalées quand elles comptent.

## Sommaire

1. [Un composant, mentalement](#1)
2. [`useState`](#2)
3. [`useEffect` (et quand NE PAS l'utiliser)](#3)
4. [`useRef`](#4)
5. [`useMemo` / `useCallback`](#5)
6. [`useReducer`](#6)
7. [`useContext`](#7)
8. [Custom hooks](#8)
9. [Listes & rendu conditionnel](#9)
10. [Composants génériques](#10)
11. [Patterns de composition](#11)
12. [Performance : l'essentiel](#12)
13. [Nouveautés React 19 utiles](#13)

---

<a id="1"></a>
## 1. Un composant, mentalement

Un composant = **une fonction** qui prend des props et retourne du JSX. React le **ré-exécute** quand son état ou ses props changent. Le rendu doit être **pur** : mêmes entrées → même sortie, aucun effet de bord pendant le rendu.

```tsx
function Greeting({ name }: { name: string }) {
  return <p>Bonjour {name}</p>;
}
```

- **State** = mémoire du composant entre deux rendus.
- **Props** = arguments venus du parent (lecture seule).
- **Effet** = synchronisation avec le monde extérieur (réseau, DOM, timers), **après** le rendu.

> ⚠️ **Piège ex-POO (ton bug du 2026-06-16) :** un composant reçoit **un seul argument = l'objet props**. `<Widget instance={x} />` appelle `Widget({ instance: x })`. Il faut typer `{ instance }: { instance: WidgetInstance }` et **destructurer**, jamais `function Widget(instance: WidgetInstance)` (paramètre nu = faux modèle mental).

---

<a id="2"></a>
## 2. `useState`

Garder une valeur qui, quand elle change, re-rend l'UI.

```tsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0); // type inféré : number
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Updater fonctionnel** — obligatoire quand le nouvel état dépend de l'ancien :

```tsx
setCount((c) => c + 1); // ✅ toujours à jour
```

**Objet/tableau — immutabilité obligatoire** (crée une nouvelle référence, ne mute jamais) :

```tsx
const [blocks, setBlocks] = useState<Block[]>([]); // ← typer explicitement, sinon inféré never[]

setBlocks((prev) => [...prev, newBlock]);                                   // add
setBlocks((prev) => prev.filter((b) => b.id !== id));                        // remove
setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, title } : b)));   // update
```

> 🔗 **Dans ton projet** — `Dashboard.tsx` a `useState([])` inféré `never[]`. Type-le `useState<WidgetInstance[]>([])` (ton TODO du 2026-06-16). C'est la **source de vérité** de la disposition (couche 5 de ton ADR).

**State qui commence vide/nullable :**

```tsx
const [selected, setSelected] = useState<Block | null>(null);
```

**Piège :** `setState` ne change pas la variable locale immédiatement. Lire `count` juste après `setCount` donne l'ancienne valeur — normal, elle sera à jour au prochain rendu.

---

<a id="3"></a>
## 3. `useEffect` (et quand NE PAS l'utiliser)

Synchroniser le composant avec quelque chose d'**externe** (timer, abonnement, `localStorage`, titre du document).

```tsx
import { useEffect, useState } from "react";

function Clock() {
  const [now, setNow] = useState(() => new Date()); // init paresseux : la fn n'est appelée qu'au 1er rendu

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id); // ← cleanup : indispensable (timer/abonnement)
  }, []); // [] = une seule fois au montage

  return <time>{now.toLocaleTimeString()}</time>;
}
```

Tableau de dépendances : `[]` = au montage ; `[a, b]` = quand `a`/`b` changent ; absent = à chaque rendu (rare).

**⚠️ Quand NE PAS utiliser useEffect** (erreur la plus fréquente) :
- Pour **transformer des données pour l'affichage** → calcule pendant le rendu (ou `useMemo`).
- Pour **réagir à un clic** → mets la logique dans le `onClick`.
- Pour **synchroniser deux states** → dérive l'un de l'autre.

```tsx
// ❌ effet inutile
useEffect(() => setFull(`${first} ${last}`), [first, last]);
// ✅ dérivation directe
const full = `${first} ${last}`;
```

Règle : un effet parle au **monde extérieur**, pas à l'état interne. (La persistance `localStorage` EST un usage légitime — cf. `04`.)

> ⚠️ **StrictMode** (ton `main.tsx`) monte/démonte deux fois en dev : ton effet s'exécute deux fois. C'est voulu — ça révèle les cleanups manquants. D'où l'importance du `return () => …`.

---

<a id="4"></a>
## 4. `useRef`

Valeur mutable qui **ne déclenche PAS** de re-rendu, ou accès à un nœud DOM.

```tsx
import { useRef, useEffect } from "react";

function SearchBox() {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  return <input ref={inputRef} />;
}
```

Valeur persistante sans re-render (id d'interval, position transiente pendant un drag) :

```tsx
const dragOrigin = useRef<{ x: number; y: number } | null>(null);
```

**ref vs state :** changer `state` → re-render ; changer `ref.current` → pas de re-render. C'est **la clé du drag perf** (§`05` §6 : bouger via ref pendant le geste, committer en state au drop).

---

<a id="5"></a>
## 5. `useMemo` / `useCallback`

Éviter de recalculer une valeur coûteuse / de recréer une fonction à chaque rendu.

```tsx
import { useMemo, useCallback } from "react";

const visible = useMemo(() => blocks.filter((b) => b.visible), [blocks]); // mémorise une VALEUR

const handleAdd = useCallback((b: Block) => {
  setBlocks((prev) => [...prev, b]);
}, []); // mémorise une FONCTION (référence stable)
```

**Ne sur-optimise pas** (ta convention §4.7). Utile seulement si : calcul réellement lourd, OU valeur/fonction passée à un enfant `React.memo`, OU dépendance d'un autre hook. Sinon laisse tomber.

> 🔗 **Dans ton projet** — les callbacks d'actions (`addWidget`, `removeWidget`) mis dans un Context doivent être `useCallback` pour rester stables (sinon re-render en cascade). Cf. §7.

---

<a id="6"></a>
## 6. `useReducer`

State complexe avec transitions claires. **C'est le modèle mental d'un store, en local** : action → reducer pur → nouvel état. Parfait pour la logique add/remove/move/update de ton dashboard sans introduire de lib.

```tsx
import { useReducer } from "react";

type State = { blocks: Block[]; selectedId: string | null };
type Action =
  | { type: "add"; block: Block }
  | { type: "remove"; id: string }
  | { type: "move"; id: string; x: number; y: number }
  | { type: "select"; id: string | null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add":    return { ...state, blocks: [...state.blocks, action.block] };
    case "remove": return { ...state, blocks: state.blocks.filter((b) => b.id !== action.id) };
    case "move":   return { ...state, blocks: state.blocks.map((b) => b.id === action.id ? { ...b, x: action.x, y: action.y } : b) };
    case "select": return { ...state, selectedId: action.id };
    default:       return state;
  }
}

function Dashboard() {
  const [state, dispatch] = useReducer(reducer, { blocks: [], selectedId: null });
  return <button onClick={() => dispatch({ type: "add", block: make() })}>Ajouter</button>;
}
```

`Action` est une **discriminated union** (cf. `01` §7) → narrowing automatique dans le reducer. C'est **le même modèle qu'un slice**, mais 100 % React, sans dépendance. Tu passes à `useReducer` quand plusieurs `useState` liés deviennent pénibles à coordonner.

---

<a id="7"></a>
## 7. `useContext`

Passer une valeur à des composants profonds sans « prop drilling ».

```tsx
import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

type ThemeCtx = { theme: "light" | "dark"; toggle: () => void };
const ThemeContext = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);
  return <ThemeContext value={{ theme, toggle }}>{children}</ThemeContext>;
  // React 19 : <Context> suffit, plus besoin de <Context.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme doit être utilisé dans <ThemeProvider>");
  return ctx;
}
```

**Context ≠ gestionnaire d'état.** C'est un **tuyau de transport** (évite le prop drilling), pas un state manager optimisé : tout consommateur se re-rend quand la valeur change, il ne « bail-out » pas les re-renders. Deux conséquences pour un dashboard de widgets :

- **Ne mets JAMAIS la liste d'instances (`WidgetInstance[]`) dans un Context.** Elle change souvent → tout re-rend. Garde-la en `useState`/`useReducer` chez le parent, passée en **props**.
- **Réserve le Context aux choses stables ou aux actions** : thème, flag « mode édition », ou les *callbacks* `add/remove/update` (stables via `useCallback` → pas de cascade).

> 🔗 **Dans ton projet** — c'est exactement ta décision du 2026-06-15 : « transport = props par défaut, Context réservé aux actions, jamais pour stocker le `WidgetInstance[]` ». Ton ADR exclut un store ; ce combo est le plafond prévu. Persistance de cet état → `04`.

---

<a id="8"></a>
## 8. Custom hooks

Réutiliser une logique à état. Un custom hook = une fonction `useXxx` qui appelle d'autres hooks (ta convention de nommage §2.1).

```tsx
import { useState, useEffect } from "react";

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
```

Le hook **le plus utile pour ton v1** — `useLocalStorage` — est détaillé dans `04` §3 (c'est le palier 2 de ta pyramide de persistance).

Règle : dès que tu copies-colles une logique `useState`+`useEffect` d'un composant à l'autre, extrais un hook. C'est aussi la façon React de partager du **comportement** sans héritage (ta session du 2026-06-16). Ton `useDraggable` sera un custom hook **headless** (cf. `05` §6).

---

<a id="9"></a>
## 9. Listes & rendu conditionnel

```tsx
<ul>
  {blocks.map((b) => (
    <li key={b.id}>{b.title}</li> // key = id STABLE, jamais l'index si l'ordre change
  ))}
</ul>

{isLoading && <Spinner />}
{error ? <ErrorView msg={error} /> : <Content />}
{blocks.length === 0 && <EmptyState />}
```

**Piège key :** `key={i}` casse l'état local et les animations au reorder/filtre. Toujours une clé métier stable (`b.id`) — **crucial pour ton drag/reorder**.
**Piège `&&` avec un nombre :** `{count && <X/>}` affiche `0` si `count === 0`. Écris `{count > 0 && <X/>}`.

---

<a id="10"></a>
## 10. Composants génériques

Une `<List>` réutilisable qui garde le type de ses items.

```tsx
import type { ReactNode } from "react";

type ListProps<T> = {
  readonly items: readonly T[];
  readonly getKey: (item: T) => string;
  readonly renderItem: (item: T) => ReactNode;
};

function List<T>({ items, getKey, renderItem }: ListProps<T>) {
  return <ul>{items.map((item) => <li key={getKey(item)}>{renderItem(item)}</li>)}</ul>;
}

// Usage — T inféré à Block
<List items={blocks} getKey={(b) => b.id} renderItem={(b) => <strong>{b.title}</strong>} />;
```

---

<a id="11"></a>
## 11. Patterns de composition

**Slots via props** — plutôt qu'un composant à 15 props, accepte des morceaux de JSX :

```tsx
import type { ReactNode } from "react";

type PanelProps = {
  readonly header: ReactNode;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
};
function Panel({ header, children, footer }: PanelProps) {
  return (
    <section className="rounded shadow">
      <div className="border-b">{header}</div>
      <div>{children}</div>
      {footer && <div className="border-t">{footer}</div>}
    </section>
  );
}
```

C'est **le pattern de ton Shell `<Widget>`** : une coquille (titre, ✕, hover) qui reçoit en `children` le contenu spécifique produit par le registry. Sépare le **chrome** (commun) du **contenu** (par type). Voir `05` §3-4.

---

<a id="12"></a>
## 12. Performance : l'essentiel

Par ordre d'importance : (1) **bonnes keys** dans les listes ; (2) **garde le state au plus près** de là où il sert (sinon tout l'arbre re-rend) ; (3) **`React.memo`** pour un enfant coûteux aux props stables ; (4) **`useMemo`** pour les calculs lourds.

```tsx
const BlockCard = React.memo(function BlockCard({ block }: { block: Block }) {
  return <div>{block.title}</div>;
});
```

`memo` ne sert que si les props sont **référentiellement stables** → d'où `useCallback`/`useMemo` côté parent. N'optimise qu'après avoir constaté une lenteur (Profiler). C'est aussi pour ça que le drag committe au `pointerup` et pas à chaque frame (cf. `05` §6).

---

<a id="13"></a>
## 13. Nouveautés React 19 utiles

- **`ref` est une prop normale** : plus de `forwardRef`.
  ```tsx
  function Input({ ref, ...props }: { ref?: React.Ref<HTMLInputElement> } & React.ComponentPropsWithoutRef<"input">) {
    return <input ref={ref} {...props} />;
  }
  ```
- **`<Context>` comme provider** (§7).
- **`use()`**, **Actions / `useActionState`** : avancé, pas nécessaire pour le v1.

Pour le v1, retiens surtout : immutabilité du state (§2), reducer pour la logique (§6), Context pour les actions seulement (§7), ref pour le transient du drag (§4).
