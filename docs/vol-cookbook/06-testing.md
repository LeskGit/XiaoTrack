# 06 — Testing : Vitest + React Testing Library

> **Vitest** (pas Jest) car il s'intègre nativement à Vite/TS — même config, même transform, instantané.
> Philosophie **RTL** : teste **le comportement observable** (ce que l'utilisateur voit/fait), pas l'implémentation. Un test qui casse au moindre refactor interne est un mauvais test.
> Sans store à tester : on teste des **reducers purs**, des **hooks**, et des **composants**. Parfait pour ton archi.

## Sommaire

1. [Config (à ajouter toi-même)](#1)
2. [Tester une fonction pure (reducer)](#2)
3. [Tester le dispatch + `assertNever`](#3)
4. [Tester un composant (RTL)](#4)
5. [Tester une interaction (user-event)](#5)
6. [Tester un custom hook](#6)
7. [Tester la persistance (localStorage)](#7)
8. [Quoi tester en priorité](#8)

---

<a id="1"></a>
## 1. Config (à ajouter toi-même)

> 🔗 **Dans ton projet** — ces changements touchent **tes** fichiers (`vite.config.ts`, `tsconfig.app.json`, `package.json`). Je ne les modifie pas ; voici le contenu à ajouter **toi-même**.

`vite.config.ts` — ajoute le bloc `test` :

```ts
/// <reference types="vitest/config" />
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,          // describe/it/expect sans import
    environment: "jsdom",   // simule le DOM
    setupFiles: "./src/test/setup.ts",
  },
});
```

`src/test/setup.ts` :

```ts
import "@testing-library/jest-dom/vitest"; // active toBeInTheDocument, toHaveTextContent…
```

`tsconfig.app.json` — pour typer les globals et les matchers :

```jsonc
{ "compilerOptions": { "types": ["vitest/globals", "@testing-library/jest-dom"] } }
```

`package.json` (workspace web) :

```jsonc
"scripts": { "test": "vitest", "test:run": "vitest run" }
```

---

<a id="2"></a>
## 2. Tester une fonction pure (reducer)

Le plus rentable : **aucun DOM, aucun mock**, juste entrée → sortie. Ton reducer (add/remove/move) est l'endroit idéal.

```ts
import { describe, it, expect } from "vitest";
import { reducer } from "./dashboardReducer";

const block = { id: "b1", type: "text", layout: { x: 0, y: 0, w: 1, h: 1 }, data: { text: "hi" } } as const;

describe("dashboard reducer", () => {
  it("ajoute un block", () => {
    const next = reducer({ blocks: [] }, { type: "add", block });
    expect(next.blocks).toHaveLength(1);
  });

  it("ne mute pas l'état d'origine (immutabilité)", () => {
    const state = { blocks: [] };
    reducer(state, { type: "add", block });
    expect(state.blocks).toHaveLength(0); // l'original est intact
  });

  it("retire par id", () => {
    const next = reducer({ blocks: [block] }, { type: "remove", id: "b1" });
    expect(next.blocks).toHaveLength(0);
  });
});
```

> Le test d'immutabilité est précieux : il attrape la faute classique (muter au lieu de recréer).

---

<a id="3"></a>
## 3. Tester le dispatch + `assertNever`

Vérifie que chaque `type` rend le bon Body — et documente l'exhaustivité.

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import BlockBody from "./BlockBody";

describe("BlockBody dispatch", () => {
  it("rend le texte pour type=text", () => {
    render(<BlockBody block={{ id: "1", type: "text", layout: { x:0,y:0,w:1,h:1 }, data: { text: "Bonjour" } }} />);
    expect(screen.getByText("Bonjour")).toBeInTheDocument();
  });

  it("rend le compteur pour type=counter", () => {
    render(<BlockBody block={{ id: "2", type: "counter", layout: { x:0,y:0,w:1,h:1 }, data: { value: 42, step: 1 } }} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });
});
```

> `assertNever` est vérifié **à la compilation**, pas au runtime — tu n'as pas à le tester, TS le garantit. Le test ci-dessus couvre juste le mapping visible.

---

<a id="4"></a>
## 4. Tester un composant (RTL)

Priorise les requêtes **accessibles** (dans l'ordre) : `getByRole` > `getByLabelText` > `getByText`. Évite `getByTestId` sauf dernier recours.

```tsx
import { render, screen } from "@testing-library/react";
import { it, expect } from "vitest";
import WidgetShell from "./WidgetShell";

it("affiche le titre et un bouton fermer accessible", () => {
  render(<WidgetShell title="Notes" onClose={() => {}}>contenu</WidgetShell>);
  expect(screen.getByText("Notes")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /fermer notes/i })).toBeInTheDocument(); // teste l'aria-label
});
```

> Le `getByRole("button", { name: … })` vérifie **en même temps** que ton a11y (nom accessible, ta règle §8.1) est respectée. Bon test = bon design.

---

<a id="5"></a>
## 5. Tester une interaction (user-event)

`@testing-library/user-event` simule un vrai utilisateur (focus, clavier, clic). Toujours `async/await`.

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, expect, vi } from "vitest";

it("appelle onClose au clic sur ✕", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();                       // spy Vitest
  render(<WidgetShell title="Notes" onClose={onClose}>x</WidgetShell>);

  await user.click(screen.getByRole("button", { name: /fermer/i }));
  expect(onClose).toHaveBeenCalledOnce();
});
```

`vi.fn()` = l'équivalent Vitest de `jest.fn()`. `vi.mock(...)` pour mocker un module.

---

<a id="6"></a>
## 6. Tester un custom hook

`renderHook` monte le hook dans un composant jetable. `act` entoure les mises à jour d'état.

```tsx
import { renderHook, act } from "@testing-library/react";
import { it, expect } from "vitest";
import { useLocalStorage } from "./useLocalStorage";

it("persiste la valeur dans localStorage", () => {
  const { result } = renderHook(() => useLocalStorage("k", 0));

  act(() => { result.current[1](5); });          // setValue(5)
  expect(result.current[0]).toBe(5);
  expect(JSON.parse(localStorage.getItem("k")!)).toBe(5);
});
```

---

<a id="7"></a>
## 7. Tester la persistance (localStorage)

jsdom fournit un `localStorage`. **Nettoie-le entre les tests** pour éviter les fuites d'état.

```ts
import { beforeEach, it, expect } from "vitest";

beforeEach(() => { localStorage.clear(); });

it("rehydrate depuis un storage existant", () => {
  localStorage.setItem("dashboard.blocks", JSON.stringify([{ id: "b1" }]));
  // … monte le composant/hook et vérifie qu'il a chargé b1
});

it("tombe sur le fallback si le JSON est corrompu", () => {
  localStorage.setItem("dashboard.blocks", "{pas du json");
  // … vérifie qu'on obtient [] sans crash (ton try/catch, 04 §3)
});
```

> Le 2ᵉ test verrouille le comportement défensif de `04` : un storage pourri ne doit **jamais** crasher l'app.

---

<a id="8"></a>
## 8. Quoi tester en priorité

Rentabilité décroissante — pour un v1, arrête-toi où le temps de vol le dicte :

1. **Le reducer** (add/remove/move + immutabilité) — pur, rapide, attrape les vrais bugs de logique. **Commence ici.**
2. **La rehydration/persistance** (fallback sur JSON corrompu) — verrouille le défensif.
3. **Le dispatch du registry** (chaque type → bon Body).
4. **Le Shell** (titre + ✕ accessible + `onClose`).
5. **`useDraggable`** — plus délicat (Pointer Events en jsdom sont limités) ; teste plutôt la **logique de calcul** de position extraite en fonction pure que le geste complet.

Ne vise pas 100 % de couverture. Teste ce qui **casserait silencieusement** : la logique d'état et la persistance. Le CSS/hover ne se teste pas ici.
