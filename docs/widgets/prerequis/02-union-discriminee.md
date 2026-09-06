# Fiche 2 — Union discriminée et narrowing

> **Taille** : courte · **Dépend de** : fiche 1 · **Débloque** : `WidgetDataState`, et le rendu conditionnel de tout widget.

## Pourquoi tu en as besoin

Un widget est dans exactement un état : il charge, il a échoué, ou il a sa valeur. Trois cas, **mutuellement exclusifs**.

La façon naïve de modéliser ça produit des états impossibles :

```ts
type Etat = { chargement: boolean; erreur: string | null; valeur: number | null };
```

Ce type autorise `{ chargement: true, erreur: "boom", valeur: 42 }`. Ça ne veut rien dire, et pourtant rien ne l'empêche. Tu passeras la v1 à écrire des gardes défensives (`if (!chargement && !erreur && valeur !== null)`) pour compenser un type qui ment.

L'union discriminée rend l'état illégal **non représentable**. C'est le gain — pas l'élégance.

Note l'ironie : tu as passé trois sessions à vouloir mettre une union discriminée dans `WidgetInstance`, où elle n'avait rien à faire. Sa vraie place est ici.

---

## 1. L'anatomie

Une union de plusieurs formes d'objet, chacune portant un champ commun dont la valeur est un **littéral différent** :

```ts
type EtatLecteur =
  | { statut: "arrete" }
  | { statut: "lecture"; piste: string; secondes: number }
  | { statut: "pause"; piste: string; secondes: number }
  | { statut: "erreur"; message: string };
```

Le champ `statut` est le **discriminant**. Trois conditions pour qu'il fonctionne :

1. Il est présent dans **toutes** les branches.
2. Sa valeur est un **type littéral** (`"lecture"`), pas `string`.
3. Chaque branche a une valeur **différente**.

Si `statut` était typé `string`, TypeScript ne pourrait pas distinguer les branches, et rien de ce qui suit ne marcherait.

## 2. Le narrowing

C'est le mécanisme qui rend l'union utile. À l'intérieur d'un test sur le discriminant, TypeScript **restreint** le type :

```ts
function afficher(e: EtatLecteur): string {
  if (e.statut === "lecture") {
    // ici, e est exactement { statut: "lecture"; piste: string; secondes: number }
    return `▶ ${e.piste} — ${e.secondes}s`;
  }
  // ici, e est { statut: "arrete" } | { statut: "pause"; ... } | { statut: "erreur"; ... }
  return "…";
}
```

Hors du `if`, `e.piste` est une erreur de compilation : l'état arrêté n'a pas de piste. Tu ne *peux pas* afficher une piste inexistante. C'est ça, l'état illégal non représentable.

Le narrowing fonctionne avec `if`, `switch`, l'opérateur ternaire, et le retour anticipé. La forme la plus lisible pour trois branches et plus est le `switch` :

```ts
function afficher(e: EtatLecteur): string {
  switch (e.statut) {
    case "arrete":  return "⏹";
    case "lecture": return `▶ ${e.piste}`;
    case "pause":   return `⏸ ${e.piste}`;
    case "erreur":  return `⚠ ${e.message}`;
  }
}
```

## 3. L'exhaustivité — le vrai bénéfice à long terme

Le code ci-dessus a une propriété qui vaut à elle seule le déplacement : **ajoute une branche à l'union, et il cesse de compiler.**

```ts
type EtatLecteur =
  | { statut: "arrete" }
  | { statut: "lecture"; piste: string; secondes: number }
  | { statut: "pause"; piste: string; secondes: number }
  | { statut: "erreur"; message: string }
  | { statut: "tampon"; piste: string };        // ← nouvelle branche
```

→ `Function lacks ending return statement`. TypeScript sait qu'un chemin ne retourne rien.

**Mais cette garantie tient à une condition** : le type de retour doit être annoté (`: string`). Sans annotation, TypeScript infère `string | undefined`, considère que c'est ton intention, et te laisse passer.

La méthode explicite, qui marche même sans annotation de retour :

```ts
function assertNever(x: never): never {
  throw new Error(`Cas non traité : ${JSON.stringify(x)}`);
}

switch (e.statut) {
  case "arrete":  return "⏹";
  // ... les autres cas
  default:        return assertNever(e);
}
```

Le principe : si tous les cas sont couverts, le type de `e` dans le `default` est `never` — l'ensemble vide. Il est donc assignable au paramètre `never`. Dès qu'une branche manque, `e` vaut cette branche restante, qui n'est pas assignable à `never`, et la compilation échoue en nommant le cas oublié.

C'est le mécanisme qui te protégera quand tu ajouteras l'archétype `chart` dans six mois.

## 4. Pourquoi une `interface` ne peut pas faire ça

Tu as creusé le sujet le 16/06. Le rappel qui compte ici : une `interface` décrit **une** forme d'objet. Elle peut en étendre d'autres, fusionner avec elle-même, mais elle ne peut pas exprimer « soit ceci, soit cela ».

L'union est une opération sur les types, réservée à `type`. D'où la règle pratique : **une forme unique → `interface` ou `type`, au choix ; une alternative → `type`, obligatoirement.**

## 5. La forme pour les widgets

```ts
type WidgetDataState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; value: number; unit?: string; caption?: string };
```

Remarque ce que la branche `loading` ne contient pas : ni `value`, ni `message`. Elle est vide, et c'est correct — il n'y a rien à savoir sur un chargement en cours à part qu'il est en cours.

---

## Exercices

### Exercice 1 — Construire l'union

Modéliser l'état d'une commande en ligne : en attente de paiement, payée (avec un numéro de suivi), annulée (avec une raison), remboursée (avec un montant et une date).

**Attendu** : quatre branches, un discriminant littéral, aucun champ optionnel utilisé pour simuler l'absence.

### Exercice 2 — Narrowing

Écrire une fonction qui prend cet état et retourne le texte à afficher à l'utilisateur, en traitant les quatre cas.

Puis essayer d'accéder au numéro de suivi **en dehors** de la branche « payée ».

**Attendu** : la fonction compile ; l'accès hors branche est une erreur de compilation dont tu sais lire le message.

### Exercice 3 — Exhaustivité par le type de retour

Ajouter une cinquième branche à l'union **sans** toucher à la fonction.

**Attendu** : erreur de compilation. Si ça compile, c'est que ton type de retour n'est pas annoté — corrige et recommence.

### Exercice 4 — Exhaustivité par `assertNever`

Écrire `assertNever` et l'utiliser dans le `default` du `switch`. Retirer l'annotation de type de retour de la fonction. Ajouter une sixième branche.

**Attendu** : erreur de compilation **malgré** l'absence d'annotation de retour, et le message nomme la branche oubliée.

### Exercice 5 — Le contre-exemple

Écrire délibérément la version « trois champs indépendants » (`chargement`, `erreur`, `valeur`), et compter combien d'états impossibles elle autorise. Puis écrire la fonction d'affichage correspondante et comparer sa longueur à celle de l'exercice 2.

**Attendu** : tu peux nommer au moins trois combinaisons absurdes que le type accepte, et tu constates que la version défensive est plus longue *et* moins sûre.

### Exercice 6 — L'union des widgets

Écrire `WidgetDataState` et une fonction qui, pour chaque état, retourne ce qu'il faut afficher. Vérifier que `state.value` est inaccessible hors de la branche `success`.

**Attendu** : impossible d'afficher une valeur pendant un chargement, même par erreur.

---

## Réussi quand

Oublier une branche est une erreur de compilation, pas un bug d'exécution. Et tu peux expliquer pourquoi `{ chargement: boolean; erreur: string | null }` est un mauvais type — en nommant les états impossibles qu'il autorise.

---

## Les pièges

**Le discriminant élargi.** Si le champ est typé `string` (souvent parce que l'objet vient d'un `JSON.parse` ou d'une annotation trop large), le narrowing ne se déclenche pas et rien ne fonctionne. Vérifie toujours que le discriminant est bien un littéral.

**Le `switch` sans annotation de retour.** Le piège de l'exercice 3. Sans `: string`, tu crois avoir l'exhaustivité et tu ne l'as pas. Annote, ou utilise `assertNever` — idéalement les deux.

**Le champ optionnel comme substitut.** `{ status: string; value?: number }` a l'air plus souple. Il l'est, et c'est le problème : tu devras tester `value !== undefined` partout, et le compilateur ne t'aidera jamais.

**Nommer le discriminant différemment selon les branches.** `{ type: "a" } | { kind: "b" }` n'est pas une union discriminée : il n'y a pas de champ commun sur lequel discriminer.

**Vouloir factoriser les champs communs.** `piste` apparaît dans « lecture » et « pause ». La tentation est d'extraire un `{ piste: string }` commun et de l'intersecter. Tu *peux* (`type Base = {...}; type Etat = Base & (...)`) mais tu perds en lisibilité pour deux champs. Attends d'en avoir cinq.
