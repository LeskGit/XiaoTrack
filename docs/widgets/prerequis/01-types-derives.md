# Fiche 1 — Dériver des types depuis de la donnée

> **Taille** : courte · **Dépend de** : rien · **Débloque** : le catalogue de widgets, et l'exhaustivité de la fiche 5.

## Pourquoi tu en as besoin

Le catalogue est **la** pièce centrale du moteur : une entrée par indicateur, et le type `WidgetType` qui en découle. Si tu maintiens l'union des types à la main à côté du catalogue, les deux divergeront au premier ajout. L'objectif de cette fiche : ajouter un widget = ajouter une ligne, et **rien d'autre**.

Tu as déjà appliqué ce mécanisme à `sidebarRoutes` le 11/06. Cette fiche le consolide et te fait voir ce qui casse quand on s'en écarte.

---

## 1. `as const` : figer les littéraux

Par défaut, TypeScript élargit. Il suppose qu'une variable va changer :

```ts
const planete = { nom: "Mars", lunes: 2 };
// type inféré : { nom: string; lunes: number }
```

`nom` est `string`, pas `"Mars"`. C'est raisonnable pour une variable, mais catastrophique pour une table de référence : tu perds l'information que la seule valeur possible est `"Mars"`.

```ts
const planete = { nom: "Mars", lunes: 2 } as const;
// type inféré : { readonly nom: "Mars"; readonly lunes: 2 }
```

`as const` dit : *cette valeur ne changera pas, garde les types littéraux*. Il agit en profondeur — objets imbriqués, tableaux — et ajoute `readonly` partout.

## 2. `keyof typeof` : passer d'une valeur à un type

Deux opérateurs qui se lisent de droite à gauche :

```ts
const planetes = {
  mercure: { lunes: 0, gravite: 3.7 },
  mars:    { lunes: 2, gravite: 3.7 },
  jupiter: { lunes: 95, gravite: 24.8 },
} as const;

type Planete = keyof typeof planetes;
// "mercure" | "mars" | "jupiter"
```

- `typeof planetes` : « le type de cette valeur ». On passe du monde des valeurs à celui des types.
- `keyof ...` : « l'union des clés de ce type ».

Le résultat est une union de littéraux que **tu n'as pas écrite**. Ajoute `saturne` à l'objet, `Planete` s'élargit tout seul. C'est exactement ce qu'on veut pour `WidgetType`.

Et l'accès indexé te donne le reste :

```ts
type InfoPlanete = typeof planetes[Planete];
// { lunes: 0; gravite: 3.7 } | { lunes: 2; gravite: 3.7 } | ...
```

## 3. `satisfies` : vérifier sans élargir

Voilà le point qui fait toute la différence, et le piège qu'il évite.

Tu veux garantir que chaque entrée a bien la forme attendue. Le réflexe est d'annoter :

```ts
type Info = { lunes: number; gravite: number };

// ✗ Ça vérifie, mais ça détruit ce qu'on cherchait
const planetes: Record<string, Info> = {
  mercure: { lunes: 0, gravite: 3.7 },
  mars:    { lunes: 2, gravite: 3.7 },
};

type Planete = keyof typeof planetes;  // string  ← catastrophe
```

L'annotation **impose** le type déclaré à la variable. TypeScript oublie ce qu'il savait de la valeur réelle : les clés deviennent `string`, et `Planete` ne vaut plus rien.

```ts
// ✓ Vérifie ET conserve
const planetes = {
  mercure: { lunes: 0, gravite: 3.7 },
  mars:    { lunes: 2, gravite: 3.7 },
} as const satisfies Record<string, Info>;

type Planete = keyof typeof planetes;  // "mercure" | "mars"
```

`satisfies` **contrôle** que la valeur est compatible, puis s'efface : le type inféré reste celui de la valeur écrite. Une faute de frappe dans un champ est toujours signalée, mais les clés survivent.

La règle : **annoter contraint, `satisfies` vérifie.** Pour une table de référence, tu veux vérifier.

## 4. `Record<K, V>` et l'exhaustivité

Quand `K` est une union finie, `Record` t'oblige à fournir **toutes** les clés :

```ts
type Planete = "mercure" | "mars" | "jupiter";

const couleurs: Record<Planete, string> = {
  mercure: "gris",
  mars: "rouge",
  // ✗ Erreur : la propriété 'jupiter' est manquante
};
```

C'est le mécanisme d'exhaustivité que tu réutiliseras au Registry (fiche 5) : ajouter un archétype à l'union et oublier son composant devient une erreur de compilation.

## 5. Typer un composant stocké dans un objet

Le catalogue contient des icônes, qui sont des composants React. Tu l'as déjà écrit correctement dans `routes.types.ts:19` :

```ts
import type { ComponentType, SVGProps } from "react";

type Info = {
  nom: string;
  icone: ComponentType<SVGProps<SVGSVGElement>>;
};
```

`ComponentType<P>` : « une fonction (ou classe) qui accepte des props `P` et rend du JSX ». `SVGProps<SVGSVGElement>` : les props que SVGR expose sur les composants générés — `className`, `width`, `stroke`, etc.

À noter : `layout.types.ts:5` déclare `icon: React.ComponentType` sans paramètre, ce qui ne couvre pas ces props. C'est une des incohérences ouvertes du projet.

## 6. `import type`, obligatoire ici

`apps/web` active `verbatimModuleSyntax`. Un import de type doit être marqué :

```ts
import type { ComponentType } from "react";   // ✓
import { ComponentType } from "react";        // ✗ ne compile pas
```

Raison : avec cette option, TypeScript n'efface plus les imports « devinés » — ce qui est écrit comme une valeur est émis comme une valeur, et `ComponentType` n'existe pas à l'exécution.

---

## Exercices

### Exercice 1 — Observer l'élargissement

Écrire un objet à trois entrées **sans** `as const`, en dériver `keyof typeof`, et survoler le type. Puis ajouter `as const` et comparer.

**Attendu** : tu peux énoncer précisément ce que `as const` a changé.

### Exercice 2 — Le piège de l'annotation

Reprendre l'objet, l'annoter avec `Record<string, X>`. Observer ce que devient `keyof typeof`. Puis remplacer par `as const satisfies Record<string, X>`.

**Attendu** : tu constates de tes yeux que l'annotation détruit les clés littérales et que `satisfies` les conserve, et tu sais dire pourquoi.

### Exercice 3 — Le mini-catalogue

Écrire un catalogue de trois entrées avec la forme : un titre, un composant d'icône, une chaîne d'endpoint, une largeur et une hauteur numériques. En dériver le type des clés.

Puis écrire une fonction qui prend une clé du catalogue et retourne le titre correspondant.

**Attendu** : l'autocomplétion propose les trois clés à l'appel, et `laFonction("nimporte")` est une erreur de compilation.

### Exercice 4 — Le test qui compte

Ajouter une quatrième entrée au catalogue. **Ne toucher à rien d'autre.**

**Attendu** : le type des clés s'est élargi tout seul, la fonction accepte la nouvelle clé, aucun autre fichier n'a été modifié. Si tu as dû mettre à jour une union quelque part, l'exercice 3 est raté.

### Exercice 5 — Exhaustivité

Définir un `Record<Cle, string>` sur les clés du catalogue, en oublier une volontairement.

**Attendu** : erreur de compilation nommant la clé manquante.

---

## Réussi quand

Ajouter une entrée au catalogue suffit — aucun type, aucune union, aucune liste à mettre à jour ailleurs. Et tu peux expliquer à quelqu'un pourquoi `satisfies` n'est pas juste une façon plus moderne d'annoter.

---

## Les pièges

**L'annotation par réflexe.** `const catalogue: Record<string, WidgetDefinition> = {...}` est le geste naturel, il vérifie bien ce que tu voulais vérifier, et il ruine silencieusement tout l'intérêt. C'est la raison exacte pour laquelle la décision du 11/06 dit « ne PAS rétrograder vers une annotation `: RouteConfig[]` ».

**`as const` sans `satisfies`.** Tu conserves les littéraux mais tu ne vérifies plus rien : une entrée à laquelle il manque `endpoint` passera, et tu le découvriras à l'exécution.

**`satisfies` sans `as const`.** Ça vérifie, mais les valeurs restent élargies (`w: number` au lieu de `w: 3`). Pour le catalogue ce n'est pas grave — tu veux surtout les clés — mais sache que les deux ne font pas le même travail. L'ordre est toujours `as const satisfies X`.

**Croire que `readonly` est un problème.** `as const` rend tout en lecture seule, ce qui est correct : un catalogue ne se modifie pas à l'exécution. Si tu te bats contre `readonly`, c'est probablement que tu essaies de muter quelque chose qui ne devrait pas l'être.
