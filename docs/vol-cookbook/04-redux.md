# 04 — État & persistance (la pyramide, sans store)

> ⚠️ Ce fichier s'appelle encore `04-redux.md` sur le disque (résidu d'un premier jet). Son **contenu** est la persistance **sans Redux/Zustand**, conforme à ton ADR : **`useState → localStorage → API Nest`**. Renomme le fichier en `04-persistence.md` si tu veux.
> Idée directrice : **une seule source de vérité** (la liste d'instances en `useState`/`useReducer` chez le parent), qu'on **sauve** dans `localStorage`, qu'on **remonte** plus tard vers l'API.

## Sommaire

1. [La pyramide, en un coup d'œil](#1)
2. [Palier 1 — `useState`/`useReducer` (la source de vérité)](#2)
3. [Palier 2 — `useLocalStorage` (le hook clé)](#3)
4. [Sérialisation : ce qui passe / ne passe pas](#4)
5. [Rehydration & valeurs par défaut](#5)
6. [Versionner & migrer le state persistant](#6)
7. [Palier 3 — sync API NestJS (plus tard)](#7)
8. [Pièges & checklist](#8)

---

<a id="1"></a>
## 1. La pyramide, en un coup d'œil

```
Palier 1  useState / useReducer   ← source de vérité en mémoire (vit tant que l'onglet est ouvert)
   │  (sauvegarde/lecture)
Palier 2  localStorage            ← survit au refresh / fermeture d'onglet (par navigateur)
   │  (sync explicite, plus tard)
Palier 3  API NestJS              ← survit partout, multi-appareils (source long terme)
```

Chaque palier est un **sur-ensemble** du précédent en durabilité. Tu montes d'un palier **quand le besoin apparaît**, pas avant (principe de ton ADR). Pour le v1 : paliers 1 + 2 suffisent.

---

<a id="2"></a>
## 2. Palier 1 — la source de vérité

La liste d'instances vit en **un seul endroit** : le parent orchestrateur. Deux choix selon la complexité de la logique :

- **`useState`** si les mutations sont simples.
- **`useReducer`** dès que tu as plusieurs transitions liées (add/remove/move/update/select) — cf. `02` §6. C'est le modèle « store » mais 100 % React.

```tsx
// Version useReducer (recommandée dès qu'il y a >2 actions)
const [state, dispatch] = useReducer(reducer, { blocks: [], selectedId: null });
```

Peu importe le choix, **le state est immutable** : chaque mutation produit un **nouveau** tableau/objet (cf. `02` §2). C'est ce qui rend la sauvegarde fiable (une nouvelle référence = un `useEffect` de save qui se déclenche).

---

<a id="3"></a>
## 3. Palier 2 — `useLocalStorage` (le hook clé du v1)

Le pattern : lire `localStorage` **une fois** au montage (init paresseux), puis **écrire** à chaque changement via un effet.

```tsx
import { useState, useEffect } from "react";

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    // init paresseux : ne lit le storage qu'au 1er rendu
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial; // JSON corrompu, storage indisponible (mode privé)… → fallback
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota dépassé ou storage bloqué : on ignore silencieusement (ou log)
    }
  }, [key, value]);

  return [value, setValue] as const; // tuple typé [T, setter]
}
```

Usage — la persistance devient **transparente** :

```tsx
const [blocks, setBlocks] = useLocalStorage<Block[]>("dashboard.blocks", []);
// setBlocks(...) met à jour l'UI ET sauve. Au prochain refresh, blocks est rechargé.
```

**Combiner avec un reducer** (le meilleur des deux : logique claire + persistance) :

```tsx
import { useReducer, useEffect } from "react";

const KEY = "dashboard.state";

function init(fallback: State): State {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as State) : fallback;
  } catch {
    return fallback;
  }
}

function useDashboard() {
  const [state, dispatch] = useReducer(reducer, { blocks: [], selectedId: null }, init);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);
  return { state, dispatch };
}
```

> Le 3ᵉ argument de `useReducer(reducer, initialArg, init)` est une **fonction d'init paresseuse** : elle lit le storage une seule fois. Propre et sans `useEffect` de lecture.

---

<a id="4"></a>
## 4. Sérialisation : ce qui passe / ne passe pas

`localStorage` ne stocke **que des strings** → on passe par `JSON.stringify`/`JSON.parse`. Conséquence : **seule la donnée sérialisable survit**.

| Passe ✅ | Ne passe pas ❌ (perdu ou cassé) |
| --- | --- |
| string, number, boolean, null | `undefined` (la clé disparaît) |
| objets & tableaux imbriqués | fonctions, classes, refs DOM |
| (dates → deviennent des **strings**) | `Date`, `Map`, `Set`, `RegExp` |

> 🔗 **Dans ton projet** — c'est **précisément pourquoi** ton ADR impose que `WidgetInstance` soit **« JSON pur, aucune fonction ni ref DOM »**. La couche donnée est sérialisable *par conception* → elle tombe dans `localStorage` sans transformation. Si un jour tu stockes une `Date`, re-parse-la à la rehydration (`new Date(str)`), ou stocke un timestamp `number`.

---

<a id="5"></a>
## 5. Rehydration & valeurs par défaut

**Rehydration** = reconstruire le state en mémoire depuis le storage au démarrage. Deux règles de survie :

1. **Toujours un fallback** si la clé est absente (premier lancement) ou le JSON illisible → cf. le `try/catch` du hook.
2. **Ne fais pas confiance à la forme stockée.** Une version précédente de ton app a pu écrire une forme différente. Valide/normalise au chargement :

```tsx
function rehydrate(raw: string | null): Block[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // normalisation minimale : garde ce qui a la forme attendue
    return parsed.filter((b): b is Block => typeof b?.id === "string" && typeof b?.type === "string");
  } catch {
    return [];
  }
}
```

---

<a id="6"></a>
## 6. Versionner & migrer le state persistant

Dès que la forme de ta donnée peut évoluer, **stocke un numéro de version** à côté. Sinon un vieux storage cassera la nouvelle app.

```tsx
type Persisted = { version: number; blocks: Block[] };
const CURRENT = 2;

function load(): Block[] {
  const raw = localStorage.getItem("dashboard");
  if (!raw) return [];
  const data = JSON.parse(raw) as Persisted;

  let blocks = data.blocks;
  // migrations successives
  if (data.version < 2) {
    blocks = blocks.map((b) => ({ ...b, visible: b.visible ?? true })); // v1→v2 : champ ajouté
  }
  return blocks;
}

function save(blocks: Block[]) {
  const payload: Persisted = { version: CURRENT, blocks };
  localStorage.setItem("dashboard", JSON.stringify(payload));
}
```

C'est l'équivalent maison des « migrations » qu'offrent les libs de persistance — mais explicite et sans dépendance, cohérent avec ton choix.

---

<a id="7"></a>
## 7. Palier 3 — sync API NestJS (plus tard)

Quand tu veux la persistance **multi-appareils / long terme**, `localStorage` devient un **cache** et l'API la source. Pattern minimal :

```tsx
// Chargement initial : API si dispo, sinon cache local
async function loadRemote(): Promise<Block[]> {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Error("load failed");
  return res.json();
}

// Sauvegarde (débounce conseillé pour ne pas spammer)
async function saveRemote(blocks: Block[]): Promise<void> {
  await fetch("/api/dashboard", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(blocks),
  });
}
```

Stratégies (du plus simple au plus robuste) :
- **Save explicite** : bouton « Enregistrer ». Simple, prévisible. Bon point de départ.
- **Autosave débounce** : `useDebounce(blocks, 800)` → `saveRemote` dans un effet. Évite un PUT par frame.
- **Optimistic UI** : tu mets à jour le state **tout de suite**, tu appelles l'API en fond, et tu **rollback** si elle échoue.

> Garde le même **contrat de données** (`Block`/`WidgetInstance`) du client jusqu'à l'API. Comme il est déjà JSON-pur, le `body` de la requête, c'est littéralement ton state. C'est le bénéfice caché de la couche donnée sérialisable.

---

<a id="8"></a>
## 8. Pièges & checklist

**Pièges fréquents :**
- **`JSON.parse` qui throw** → toujours `try/catch`, toujours un fallback.
- **`undefined` dans l'objet** → la clé disparaît du JSON. Utilise `null` ou des valeurs par défaut.
- **Écrire à chaque frame pendant un drag** → n'écris dans `localStorage` **qu'au commit** (`pointerup`), pas pendant le geste (cf. `05` §6). `localStorage` est synchrone → il bloque le thread.
- **Deux onglets** → chaque onglet a sa copie en mémoire ; le dernier qui écrit gagne. (L'event `storage` permet de se synchroniser entre onglets — avancé, hors v1.)
- **Clé non versionnée** → un vieux state casse la nouvelle app (§6).
- **StrictMode** double les effets en dev : le save s'exécutera deux fois au montage — sans conséquence ici (idempotent), mais garde-le en tête.

**Checklist v1 :**
- [ ] Source de vérité unique (`useReducer` chez le parent).
- [ ] `useLocalStorage` (ou init paresseux + effet de save).
- [ ] `try/catch` + fallback partout où on lit/parse.
- [ ] Donnée 100 % sérialisable (pas de fonction/Date/ref).
- [ ] Numéro de version stocké si la forme peut bouger.
- [ ] Save au **commit**, pas pendant le drag.
- [ ] (Plus tard) endpoint Nest + stratégie save (explicite → débounce → optimistic).
