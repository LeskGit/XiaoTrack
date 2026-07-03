# 05 — Mini framework de widgets : les 5 couches (exemples génériques)

> Le cœur. On construit la même **architecture 5 couches que ton ADR**, mais sur un domaine **générique et neutre** (`Block` = `text | counter | image`) pour illustrer les **patterns** — pas pour te livrer ton code. À toi de transposer sur `WidgetInstance` (`chart | card | inline`).
> Ordre d'attaque (celui de ton ADR) : donnée → registry/rendu statique → remove/add → persistance → drag.

## Les 5 couches (rappel)

```
Couche 1  Donnée         WidgetInstance sérialisable (JSON pur)          → ici: Block
Couche 2  Comportement   hook headless useDraggable (Pointer Events)     → §6
Couche 3  Présentation   Shell <Widget> (carte: titre, ✕, hover)         → §4
Couche 4  Contenu        Body par type via Registry (+ assertNever)      → §2-3
Couche 5  Orchestration  <Dashboard> détient la liste + add/remove/persist → §5
```

Règle d'or de l'archi : **chaque couche ignore les autres**. La donnée ne sait rien du DOM. Le hook ne rend aucun JSX. Le Shell ne connaît pas les types de contenu. Le Registry ne connaît pas la position. C'est ce qui rend l'ensemble testable et évolutif.

## Sommaire

1. [Couche 1 — la donnée sérialisable](#1)
2. [Couche 4 — le Registry (type → Body)](#2)
3. [Le rendu statique (dispatch + `assertNever`)](#3)
4. [Couche 3 — le Shell `<Widget>`](#4)
5. [Couche 5 — l'orchestration (`<Dashboard>`)](#5)
6. [Couche 2 — le hook headless `useDraggable`](#6)
7. [Où vit le dispatch ? (les 2 options de ton TODO)](#7)
8. [Récap de l'ordre de build](#8)

---

<a id="1"></a>
## 1. Couche 1 — la donnée sérialisable

Une **discriminated union** sur le champ `type` (cf. `01` §7). Chaque variante porte **sa propre** forme de `data` (sinon perte du narrowing — ton piège du 2026-06-16). La base commune (id, layout) est partagée.

```ts
// block.types.ts (générique — analogue de ton widgets.types.ts)
export type BlockLayout = { x: number; y: number; w: number; h: number };

// une forme de data PAR variante
type TextData    = { text: string };
type CounterData = { value: number; step: number };
type PictureData = { url: string; alt: string }; // ⚠️ PAS "ImageData" : collision avec un type global du DOM

type BlockBase = { id: string; layout: BlockLayout };

export type BlockConfig =
  | { type: "text";    data: TextData }
  | { type: "counter"; data: CounterData }
  | { type: "image";   data: PictureData };

export type Block = BlockBase & BlockConfig; // intersection distribuée → union préservée
```

Pourquoi `Base & Config` et pas tout dans un objet plat : TS **distribue** l'intersection sur chaque membre de l'union → tu gardes une union discriminée (`Block` a bien 3 formes), tout en factorisant `id`/`layout`. C'est exactement ton `WidgetInstance = WidgetBase & WidgetConfig`.

> ⚠️ **Piège de nommage (vérifié au compilateur) :** n'appelle pas un type `ImageData` — c'est un **type global du DOM** (`lib.dom.d.ts`), collision garantie. Même vigilance avec `Text`, `Event`, `Location`, `Selection`, `Range`… Préfixe/renomme (`PictureData`, `AppEvent`).

> 🔗 **Dans ton projet** — remplace `text/counter/image` par `chart/card/inline`, `BlockLayout` par ton `shapeData` (que tu comptes renommer `WidgetLayout`), et donne à chaque branche sa vraie data (`ChartData`, `CardData`, `InlineData`) au lieu du `WidgetData` stub commun. **Reste JSON-pur** (aucune fonction/ref) → persistance gratuite (`04` §4).

**Point de décision à trancher (ton TODO 2026-06-15) :** `layout` = **reorder simple** (`{ order: number }`) ou **resize-ready** (`{ x, y, w, h }`) ? Le reorder est trivial à builder (drag = échanger deux index) ; le x/y/w/h ouvre le resize mais demande une vraie géométrie. Ton code a de facto pris `{x,y,w,h}`. Assume-le seulement si tu veux le resize tôt ; sinon commence en `{ order }` et migre (tu sais versionner, `04` §6).

---

<a id="2"></a>
## 2. Couche 4 — le Registry (`type → Body`)

Le Registry est un **annuaire** : à chaque `type` il associe le composant qui sait afficher ce contenu. Chaque Body est **pur** : il reçoit sa `data` en props (option A de ton ADR — « Body nourri par le parent »).

```tsx
// bodies (chacun pur et testable — reçoit sa data typée)
function TextBody({ data }: { data: TextData })       { return <p>{data.text}</p>; }
function CounterBody({ data }: { data: CounterData }) { return <strong>{data.value}</strong>; }
function ImageBody({ data }: { data: PictureData })   { return <img src={data.url} alt={data.alt} />; }
```

Le Registry comme **table figée** (cf. `01` §8, ton pattern `as const`) — utile pour les **métadonnées** (label, icône du catalogue) :

```ts
export const BLOCK_META = {
  text:    { label: "Texte" },
  counter: { label: "Compteur" },
  image:   { label: "Image" },
} as const satisfies Record<Block["type"], { label: string }>;
```

> Distinction clé (ta décision 2026-06-11) : **type** = entrée du catalogue (statique, dans le registry) ; **instance** = un `Block` posé sur le dashboard (dynamique, dans la liste). Le registry mappe des *types*, la liste contient des *instances*.

---

<a id="3"></a>
## 3. Le rendu statique — dispatch + `assertNever`

Le point où on choisit le Body selon `type`. Le `switch` **narrow** l'instance → chaque Body reçoit la `data` exactement typée. `assertNever` garantit qu'ajouter un type sans Body **ne compile pas**.

```tsx
function assertNever(x: never): never {
  throw new Error(`Type de block non géré: ${JSON.stringify(x)}`);
}

function BlockBody({ block }: { block: Block }) {
  switch (block.type) {
    case "text":    return <TextBody data={block.data} />;    // block.data: TextData
    case "counter": return <CounterBody data={block.data} />; // block.data: CounterData
    case "image":   return <ImageBody data={block.data} />;   // block.data: PictureData
    default:        return assertNever(block);                // exhaustivité vérifiée à la compilation
  }
}
```

C'est **le** mécanisme central du framework : une seule union, un seul `switch`, exhaustivité garantie. Ajoute `"chart"` à l'union → TS te force à ajouter le `case` ici. Zéro oubli silencieux.

---

<a id="4"></a>
## 4. Couche 3 — le Shell `<Widget>`

Le Shell est la **carte générique** : bordure, ombre, barre de titre, bouton ✕, effets hover. Il ne connaît **pas** les types de contenu : il reçoit le Body en `children` (ou fait le dispatch — cf. §7) et une poignée de drag. Composant « bête » (cf. `02` §11).

```tsx
import type { ReactNode } from "react";

type WidgetShellProps = {
  readonly title: string;
  readonly onClose?: () => void;
  readonly dragHandleProps?: React.HTMLAttributes<HTMLDivElement>; // brancher les handlers du hook
  readonly children: ReactNode;
};

export default function WidgetShell({ title, onClose, dragHandleProps, children }: WidgetShellProps) {
  return (
    <section className="rounded shadow bg-white flex flex-col">
      <header
        {...dragHandleProps}
        className="flex items-center justify-between px-2 py-1 border-b cursor-move select-none"
      >
        <span className="font-medium">{title}</span>
        {onClose && (
          <button onClick={onClose} aria-label={`Fermer ${title}`}>✕</button>
        )}
      </header>
      <div className="p-2 flex-1">{children}</div>
    </section>
  );
}
```

Notes de conception :
- `dragHandleProps` = **le point de branchement** entre couche 3 (présentation) et couche 2 (comportement). Le hook produit ces handlers, le Shell les pose sur la barre de titre. Les couches restent découplées.
- Le ✕ a un **nom accessible** (`aria-label`) — ta règle a11y §8.1.
- Apparence en Tailwind (statique). Si une couleur doit être **persistée par widget**, elle vit dans `style` du `Block` (ton TODO `bgColor`) et passe en `style={{ background }}` (valeur dynamique = `style`, ta convention §6.1). Sinon, Tailwind fixe dans le Shell.

---

<a id="5"></a>
## 5. Couche 5 — l'orchestration (`<Dashboard>`)

Le parent **détient la liste** (source de vérité, `useReducer`), la **map** en un `<Widget>` par instance, et expose **add/remove/move**. Il branche la **persistance** (`04`).

```tsx
import { useReducer, useEffect } from "react";
import type { Block } from "./block.types";

type State = { blocks: Block[] };
type Action =
  | { type: "add"; block: Block }
  | { type: "remove"; id: string }
  | { type: "move"; id: string; layout: Block["layout"] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add":    return { blocks: [...state.blocks, action.block] };
    case "remove": return { blocks: state.blocks.filter((b) => b.id !== action.id) };
    case "move":   return { blocks: state.blocks.map((b) => b.id === action.id ? { ...b, layout: action.layout } : b) };
    default:       return state;
  }
}

const KEY = "dashboard.blocks";

function Dashboard() {
  const [state, dispatch] = useReducer(reducer, { blocks: [] }, () => {
    try { return { blocks: JSON.parse(localStorage.getItem(KEY) ?? "[]") as Block[] }; }
    catch { return { blocks: [] }; }
  });

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(state.blocks)); }, [state.blocks]);

  return (
    <div className="grid grid-cols-3 gap-3">
      {state.blocks.map((block) => (
        <WidgetShell
          key={block.id}                                   // key STABLE (02 §9)
          title={BLOCK_META[block.type].label}
          onClose={() => dispatch({ type: "remove", id: block.id })}
        >
          <BlockBody block={block} />
        </WidgetShell>
      ))}
    </div>
  );
}
```

C'est le v1 « qui marche » : rendu statique + add/remove + persistance. Le drag (§6) se pose **par-dessus**, sans toucher aux couches 1/3/4.

> 🔗 **Dans ton projet** — c'est ta couche 5 (« `<Dashboard>` détient `WidgetInstance[]` »). Les actions `add/remove/move` peuvent être passées aux enfants **en props**, ou via un **Context d'actions** si le prop-drilling fait mal (jamais la liste elle-même dans le Context — cf. `02` §7).

---

<a id="6"></a>
## 6. Couche 2 — le hook headless `useDraggable`

**Headless** = il gère la **physique** (Pointer Events → position) et retourne des données + handlers, **sans rendre de JSX**. La présentation reste au Shell. C'est la façon React de partager du comportement (cf. `02` §8).

**Stratégie perf (ta décision 2026-06-15) : transient-local + commit-on-drop.** Pendant le geste, la position bouge via une **ref / un state local** (pas de re-render du parent à 60 fps) ; au `pointerup`, on **committe** dans le state parent (un seul dispatch).

```tsx
import { useRef, useState, useCallback } from "react";

type Point = { x: number; y: number };

export function useDraggable(initial: Point, onCommit: (p: Point) => void) {
  const [pos, setPos] = useState<Point>(initial);       // position transiente (locale)
  const origin = useRef<{ pointer: Point; start: Point } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId); // garde le pointeur même hors de l'élément
    origin.current = { pointer: { x: e.clientX, y: e.clientY }, start: pos };
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!origin.current) return;
    const dx = e.clientX - origin.current.pointer.x;
    const dy = e.clientY - origin.current.pointer.y;
    setPos({ x: origin.current.start.x + dx, y: origin.current.start.y + dy }); // local only
  }, []);

  const onPointerUp = useCallback(() => {
    if (!origin.current) return;
    origin.current = null;
    onCommit(pos); // ← UN seul commit dans le state parent (→ persistance)
  }, [pos, onCommit]);

  return {
    position: pos,
    handlers: { onPointerDown, onPointerMove, onPointerUp }, // à brancher via dragHandleProps
  };
}
```

Branchement (couche 2 → couche 3 → couche 5) :

```tsx
function DraggableWidget({ block, onMove, onClose, children }: {
  block: Block; onMove: (layout: Block["layout"]) => void; onClose: () => void; children: ReactNode;
}) {
  const { position, handlers } = useDraggable(
    { x: block.layout.x, y: block.layout.y },
    (p) => onMove({ ...block.layout, x: p.x, y: p.y }) // commit → dispatch move → persist
  );
  return (
    <div style={{ transform: `translate(${position.x}px, ${position.y}px)` }}>
      <WidgetShell title={BLOCK_META[block.type].label} onClose={onClose} dragHandleProps={handlers}>
        <BlockBody block={block} />
      </WidgetShell>
    </div>
  );
}
```

Points clés :
- **`setPointerCapture`** : le drag continue même si le curseur sort de l'élément (bien plus fiable que les listeners `window` manuels).
- Pendant le move : on ne met à jour que `pos` (local) et un `transform` CSS → **pas** de dispatch parent → pas de re-render de toute la liste.
- Au `pointerup` : **un** commit → dispatch `move` → persistance (`04` §8 : n'écris dans `localStorage` qu'ici).
- `transform` (valeur dynamique) va dans `style`, pas en classe (ta convention §6.1).

> ⚠️ **StrictMode / React 19** (`02` §3) : pas de `findDOMNode` ici, tout est Pointer Events + refs → compatible, contrairement aux vieilles libs de grid. C'est l'argument de ton ADR pour le « fait maison ».

---

<a id="7"></a>
## 7. Où vit le dispatch ? (les 2 options de ton TODO 2026-06-16)

Ton TODO ouvert : **qui** fait le `switch` du registry ?

- **Option 1 — `<Widget>` fait le `switch` lui-même** (`Widget → BlockBody → TextBody…`). Colle à ton ADR (`Widget → WidgetBody → ChartBody`). Le Shell est un peu moins « pur » mais l'API est simple : `<Widget block={block} />`.
- **Option 2 — `<Dashboard>` choisit le Body et le passe en `children`** (`<Widget><TextBody …/></Widget>`). Le Shell devient une pure coquille type `<Card>`, réutilisable hors widgets. Le dispatch remonte à l'orchestrateur.

Compromis : Option 1 centralise le mapping type→UI au même endroit (plus cohérent quand les types se multiplient) ; Option 2 rend le Shell totalement agnostique (plus réutilisable). Ton ADR **penche Option 1**. Tranche selon : « est-ce que je veux réutiliser le Shell pour autre chose que des widgets ? » Si non → Option 1.

Dans les exemples ci-dessus j'ai montré les deux : `BlockBody` isolé (dispatch réutilisable), branché soit dans le Shell (option 1) soit depuis le Dashboard (option 2).

---

<a id="8"></a>
## 8. Récap de l'ordre de build

1. **Couche 1** — écris l'union `Block`/`WidgetInstance` (data par branche). Compile à vide. → §1
2. **Couche 4** — les Body purs + `BlockBody` avec `assertNever`. → §2-3
3. **Rendu statique** — le Dashboard map une liste **en dur** vers des Shells. → §4-5
4. **Remove** — bouton ✕ → dispatch `remove`. → §5
5. **Add** — un bouton « + type » → construit une instance (id via `crypto.randomUUID()`) → dispatch `add`. → §5
6. **Persistance** — `useReducer` + init paresseux + effet de save. → `04`
7. **Drag** — `useDraggable`, transient-local + commit-on-drop. → §6
8. **(Plus tard)** resize, responsive, sync API. → `04` §7

Chaque étape laisse une app **qui tourne**. Ne saute pas à la 7 avant que 1→6 soient stables — c'est l'ordre figé de ton ADR, et il t'évite de « débugger ta géométrie au lieu de construire des widgets ».
