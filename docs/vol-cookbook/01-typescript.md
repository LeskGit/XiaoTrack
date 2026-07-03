# 01 — TypeScript pour React (cookbook)

> Le typage rend ton framework sûr : un widget mal configuré doit **refuser de compiler**, pas planter à l'exécution.
> La recette reine pour un framework de widgets est la **§7 (discriminated unions + `assertNever`)** — lis-la même si tu sautes le reste.
> Conventions du projet respectées : `type` partout, props `readonly` + suffixe `Props`, `import type`, `as const`, pas de `any`.

## Sommaire

1. [`type` vs `interface`](#1)
2. [Utility types (Partial, Pick, Omit, Record…)](#2)
3. [Génériques](#3)
4. [Typer les props d'un composant](#4)
5. [Typer `children`](#5)
6. [Typer les events](#6)
7. [**Discriminated unions + `assertNever`**](#7)
8. [`as const`, `satisfies`, littéraux](#8)
9. [Typage à partir d'une valeur (`typeof`, `keyof`)](#9)
10. [Récap des règles d'or](#10)

---

<a id="1"></a>
## 1. `type` vs `interface`

**Ta convention projet : `type` partout.** `interface` seulement si extension externe par déclaration nécessaire (rare). Le *pourquoi* :

- `type` peut exprimer une **union** (`A | B`), une intersection, un tuple, un alias de fonction. `interface` non.
- Deux `interface` de même nom **fusionnent** silencieusement (declaration merging) ; deux `type` de même nom → **erreur** (te prévient d'une collision).

```ts
// type : union (impossible en interface) — la base de ton registry
type Theme = "light" | "dark" | "system";

// type : dérivation
type WidgetId = string;

// interface : réservé à l'extension externe (ex. augmenter un type de lib)
interface Base { id: string }
interface Extended extends Base { label: string }
```

> Nuance de ton code : `WidgetBase` est une `interface` et l'union `WidgetConfig` un `type`, puis `WidgetInstance = WidgetBase & WidgetConfig`. C'est un cas légitime : la **base** partagée en interface, l'**union** obligatoirement en `type`.

---

<a id="2"></a>
## 2. Utility types

Dériver un type d'un autre sans le réécrire.

```ts
type Block = { id: string; title: string; x: number; y: number; visible: boolean };

type BlockPatch = Partial<Block>;              // tout optionnel → parfait pour un "update"
type BlockPosition = Pick<Block, "x" | "y">;   // { x: number; y: number }
type BlockNoPos = Omit<Block, "x" | "y">;      // sans x/y
type FrozenBlock = Readonly<Block>;            // lecture seule
type BlocksById = Record<string, Block>;       // dictionnaire id → Block
```

Sur les unions :

```ts
type Kind = "chart" | "card" | "inline";
type NonInline = Exclude<Kind, "inline">; // "chart" | "card"
```

**Cas concret :** une action « update » prend un `Partial` — pas besoin de repasser tout l'objet :

```ts
function update(id: string, patch: Partial<Block>) { /* ... */ }
update("b1", { title: "Nouveau" }); // ✅
```

> Ta convention §3.5 : préfère ces utilitaires built-in plutôt que redéclarer un type proche. Exemple réel de ton code : `Omit<IconProps, "className"> & ButtonHTMLAttributes<…>`.

---

<a id="3"></a>
## 3. Génériques

Écrire une fonction/type qui marche pour n'importe quel type sans perdre l'info.

```ts
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
first([1, 2, 3]);   // number | undefined
first(["a", "b"]);  // string | undefined

// Contraindre avec extends
function getProp<T, TKey extends keyof T>(obj: T, key: TKey): T[TKey] {
  return obj[key];
}
getProp({ id: "b1", x: 10 }, "x"); // number, typé exactement
```

Type générique réutilisable :

```ts
type ApiResponse<T> = { data: T; error: string | null; loading: boolean };
type BlocksResponse = ApiResponse<Block[]>;
```

> Ta convention §3.7 : un seul param = `T` ; plusieurs = préfixe `T` (`TKey`, `TValue`). Pas de `<T = unknown>` par défaut sans raison.

---

<a id="4"></a>
## 4. Typer les props d'un composant

```tsx
type ButtonProps = {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly variant?: "primary" | "ghost"; // union de littéraux = autocomplétion
};

export default function Button({ label, onClick, disabled = false, variant = "primary" }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled} data-variant={variant}>{label}</button>;
}
```

**Étendre les attributs HTML natifs** (ta convention §3.3) plutôt que réinventer une API parallèle :

```tsx
import type { ButtonHTMLAttributes } from "react";

type ButtonProps = {
  readonly variant?: "primary" | "ghost";
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({ variant = "primary", ...rest }: ButtonProps) {
  return <button data-variant={variant} {...rest} />;
}
// <Button type="submit" className="w-full" aria-label="Envoyer" /> ✅ tout est typé
```

> N'utilise **pas** `React.FC` (désuet). Type les props directement, comme ci-dessus et comme dans ton `Icon.tsx`.

---

<a id="5"></a>
## 5. Typer `children`

```tsx
import type { ReactNode, ReactElement } from "react";

type CardProps = { readonly title: string; readonly children: ReactNode };
```

- `ReactNode` → tout ce qui est affichable (JSX, string, number, null…). Le choix par défaut.
- `ReactElement` → **un seul** élément JSX (plus strict — c'est ce que ton `compound.types.ts` utilise).
- `(x: T) => ReactNode` → children **fonction** (render prop) :

```tsx
type ProviderProps<T> = { readonly value: T; readonly children: (value: T) => ReactNode };
```

---

<a id="6"></a>
## 6. Typer les events

```tsx
import type { MouseEvent, ChangeEvent, FormEvent, KeyboardEvent } from "react";

const handleClick = (e: MouseEvent<HTMLButtonElement>) => {};
const handleChange = (e: ChangeEvent<HTMLInputElement>) => { console.log(e.target.value); };
const handleSubmit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); };
const handleKey = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") {} };
```

**Astuce :** un handler **inline** dans le JSX est typé automatiquement — pas besoin d'annoter :

```tsx
<input onChange={(e) => setValue(e.target.value)} /> // e déjà typé ✅
```

Tu n'annotes que si tu déclares le handler **séparément**. (Ta convention : handler défini ici = préfixe `handle` ; prop callback reçue = préfixe `on`.)

---

<a id="7"></a>
## 7. Discriminated unions + `assertNever` — LE pattern du framework

**Problème :** plusieurs types de widgets, chacun avec sa propre `data`. Un `chart` a des `series`, une `card` a un `value`. Comment garantir qu'on ne lit jamais `series` sur une card ?

**Solution :** une union où chaque membre a un champ **discriminant** littéral commun (ici `type`).

```ts
type ChartBlock = { type: "chart"; id: string; series: number[] };
type CardBlock  = { type: "card";  id: string; value: number; label: string };
type InlineBlock = { type: "inline"; id: string; text: string };

type Block = ChartBlock | CardBlock | InlineBlock; // union discriminée sur `type`
```

TS **rétrécit** (narrowing) selon `type` :

```ts
function describe(b: Block): string {
  switch (b.type) {
    case "chart":  return `Graphe de ${b.series.length} points`; // b = ChartBlock
    case "card":   return `${b.label}: ${b.value}`;              // b = CardBlock
    case "inline": return b.text;                                // b = InlineBlock
  }
}
// Lire b.series dans le case "card" → ERREUR de compilation. C'est le but.
```

**`assertNever` — l'exhaustivité (exactement ce que ton ADR prévoit pour le Registry).** Ajoute une variante sans gérer son cas → le compilateur te crie dessus :

```ts
function assertNever(x: never): never {
  throw new Error(`Variante non gérée: ${JSON.stringify(x)}`);
}

function render(b: Block) {
  switch (b.type) {
    case "chart":  return renderChart(b);
    case "card":   return renderCard(b);
    case "inline": return renderInline(b);
    default:       return assertNever(b); // si un `type` n'est pas géré, b n'est pas `never` → erreur
  }
}
```

> ⚠️ **Piège à connaître (ton TODO du 2026-06-16) :** si toutes les branches pointent vers le **même** type de `data` (ex. un `WidgetData` stub commun), l'union « ne discrimine rien » côté `data` → tu perds le narrowing. Donne à **chaque branche sa propre forme** de data (`ChartData`, `CardData`…) pour que `assertNever` et le narrowing servent vraiment.

---

<a id="8"></a>
## 8. `as const`, `satisfies`, littéraux

```ts
// Sans as const : type élargi
const a = { type: "chart" };          // { type: string } ❌
const b = { type: "chart" } as const; // { readonly type: "chart" } ✅

// Figer un tableau en tuple de littéraux
const KINDS = ["chart", "card", "inline"] as const;
type Kind = typeof KINDS[number]; // "chart" | "card" | "inline"
```

**`satisfies`** — valide une valeur contre un type **sans élargir** son type inféré. Idéal pour un registry/table :

```ts
type Meta = { label: string; icon: string };

const REGISTRY = {
  chart: { label: "Graphe", icon: "chart" },
  card:  { label: "Carte",  icon: "card" },
} satisfies Record<string, Meta>;

REGISTRY.chart.label; // ✅ clés exactes préservées ; REGISTRY.foo → erreur
```

> Ta convention §3.6 + ton `routes.ts` réel : `as const satisfies ReadonlyArray<RouteConfig>` — ça préserve les littéraux (tu peux dériver `type SectionId = typeof sidebarRoutes[number]["id"]`) tout en validant la forme. Ne rétrograde jamais vers `: RouteConfig[]` (ça tuerait cette dérivation).

---

<a id="9"></a>
## 9. Typage à partir d'une valeur

Éviter de dupliquer entre valeur runtime et type.

```ts
export const sizeMapTW = {
  sm: "w-5 h-5",
  md: "w-10 h-10",
  lg: "w-15 h-15",
  custom: "",
} as const;

export type SizeKey = keyof typeof sizeMapTW; // "sm" | "md" | "lg" | "custom"
```

C'est **le pattern exact de ton `defaultProperties.styles.ts`** : une seule source de vérité, le type suit la map.

---

<a id="10"></a>
## 10. Récap des règles d'or

- `type` partout ; `interface` seulement pour extension externe (§1).
- Pas de `any` → `unknown` puis narrowing (ta convention §3.4).
- N'annote pas ce que TS infère (locales, handlers inline).
- Annote **toujours** les frontières : props, retours exportés, formes de données.
- Ensemble fermé de variantes → **discriminated union + `assertNever`** (§7).
- Table/registry → `as const satisfies …` (§8).
- « Update partiel » → `Partial<T>` (§2).
- Props : `readonly` + suffixe `Props` ; étends les attributs HTML natifs (§4).
