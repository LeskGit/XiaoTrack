# Fiche 5 — La table de dispatch

> **Taille** : courte · **Dépend de** : fiches 1 et 4 · **Débloque** : le Registry — la couche 4 de l'ADR.

## Pourquoi tu en as besoin

Le Registry répond à une question : *pour cet archétype, quel composant rend le contenu ?* En v1 il n'a qu'une entrée (`stat`), et c'est précisément pour ça qu'il faut soigner sa structure maintenant : quand `chart` et `progress` arriveront, tu ne voudras pas réécrire le mécanisme.

Tu manipules déjà un composant stocké dans une variable — `Icon.tsx:4` reçoit `icon` en prop et le rend. Cette fiche te fait comprendre *pourquoi* ça marche, et comment obtenir en prime la garantie d'exhaustivité.

---

## 1. Un composant est une valeur

C'est le point de départ, et il est moins évident qu'il n'y paraît quand on vient d'un langage où les classes ne se manipulent pas comme des données.

Un composant React est une fonction. Une fonction est une valeur. Donc un composant se range dans une variable, dans un tableau, dans un objet, se passe en argument, se retourne :

```tsx
function Chien() { return <span>Wouf</span>; }
function Chat()  { return <span>Miaou</span>; }

const animal = Chien;     // pas d'appel, pas de JSX : juste la fonction
```

## 2. La règle de la majuscule

Voilà le piège qui coûte dix minutes à tout le monde une fois :

```tsx
const animal = Chien;

<animal />       // ✗ rend <animal></animal> — une balise HTML inconnue
<Animal />       // ✓ si la variable s'appelle Animal
```

JSX distingue les composants des balises HTML **par la casse du premier caractère**. `<div>` minuscule → balise HTML. `<Widget>` majuscule → variable du scope courant.

Corollaire : quand tu sors un composant d'un objet, tu dois le mettre dans une variable capitalisée.

```tsx
const Body = registry[archetype];    // majuscule obligatoire
return <Body value={42} />;
```

Et ceci n'est pas du JSX valide, quelle que soit la casse :

```tsx
<registry[archetype] />              // ✗ erreur de syntaxe
```

C'est pour cette raison qu'`Icon.tsx:4` écrit `{icon: IconComponent}` : il renomme la prop `icon` en `IconComponent` **précisément** pour obtenir une majuscule. Ce que tu as fait par mimétisme a une raison exacte.

## 3. Table de dispatch vs chaîne de conditions

Trois façons de choisir un composant selon une clé :

```tsx
// A — chaîne de conditions
if (archetype === "stat") return <StatBody {...p} />;
if (archetype === "chart") return <ChartBody {...p} />;
return null;

// B — switch
switch (archetype) {
  case "stat":  return <StatBody {...p} />;
  case "chart": return <ChartBody {...p} />;
}

// C — table
const registry = { stat: StatBody, chart: ChartBody };
const Body = registry[archetype];
return <Body {...p} />;
```

Les trois marchent. La différence n'est pas esthétique :

| | A / B | C |
|---|---|---|
| Nature | du **code** | de la **donnée** |
| Lister les archétypes | impossible sans relire | `Object.keys(registry)` |
| Compter | à la main | `.length` |
| Exhaustivité garantie | via `assertNever` (fiche 2) | via le type de la table |
| Ajouter un archétype | modifier une fonction | ajouter une ligne |

Le point décisif : **une table est une donnée, donc elle s'inspecte**. La palette d'ajout peut avoir besoin de savoir quels archétypes existent. Avec un `switch`, il faudrait maintenir la liste ailleurs — et elle divergerait.

## 4. L'exhaustivité par le type

Le mécanisme de la fiche 1, appliqué ici :

```tsx
type Archetype = "stat" | "chart" | "progress";

const registry: Record<Archetype, ComponentType<BodyProps>> = {
  stat: StatBody,
  chart: ChartBody,
  // ✗ Erreur : la propriété 'progress' est manquante
};
```

`Record<K, V>` avec `K` une union finie **impose** toutes les clés. Ajoute un archétype à l'union, oublie son composant : erreur de compilation, immédiate, nommant la clé manquante.

C'est plus fort que l'`assertNever` de la fiche 2, parce que l'erreur apparaît à la **déclaration de la table** plutôt qu'au point d'utilisation. Tu ne peux pas avoir une table incomplète qui traîne.

### Un piège de typage

Les composants d'une même table doivent avoir des props **compatibles**. Si `StatBody` prend `{ value: number }` et `ChartBody` prend `{ series: Point[] }`, aucun type ne les réunit proprement.

Deux sorties :

- **Un contrat commun** : tous les Body prennent la même forme de props, et chacun en utilise ce dont il a besoin. Simple, et suffisant tant que les archétypes se ressemblent.
- **Une table de rendu générique** : au lieu de stocker des composants, tu stockes des fonctions qui prennent l'état et retournent du JSX.

En v1 tu n'as qu'un archétype, donc la question ne se pose pas encore. Mais choisis en connaissance de cause plutôt qu'en découvrant le problème au deuxième Body.

## 5. Où vit le lookup

Question ouverte du CDC (§9.2, point 9) : est-ce `<Widget>` qui consulte le registry, ou `<Dashboard>` qui choisit le Body et le passe en `children` ?

Cette fiche ne tranche pas — elle te donne le mécanisme. Mais garde la question en tête : elle décide si `<Widget>` connaît l'existence des archétypes ou non.

---

## Exercices

### Exercice 1 — Composant dans une variable

Écrire deux composants triviaux, en mettre un dans une variable, le rendre. Puis essayer avec une variable en minuscule et observer ce que produit le rendu (inspecte le DOM).

**Attendu** : tu vois la balise inconnue apparaître dans le DOM, et tu peux expliquer la règle de la casse.

### Exercice 2 — La table

Définir une union de trois clés, une table qui associe chaque clé à un composant, et un composant qui prend une clé en prop et rend le bon.

**Attendu** : les trois clés rendent trois composants différents.

### Exercice 3 — L'exhaustivité

Ajouter une quatrième clé à l'union **sans** l'ajouter à la table.

**Attendu** : erreur de compilation nommant la clé manquante. Si ça compile, ta table n'est pas typée avec `Record<K, V>` — corrige.

### Exercice 4 — La table comme donnée

Écrire, à partir de la table, une liste des clés disponibles rendue à l'écran. Sans écrire la liste à la main.

**Attendu** : ajouter une entrée à la table fait apparaître la ligne correspondante à l'écran, sans autre modification.

### Exercice 5 — Le piège de la syntaxe

Tenter d'écrire `<registry[cle] />` directement dans le JSX. Lire l'erreur. Corriger avec une variable intermédiaire.

**Attendu** : tu sais reconnaître cette erreur quand tu la reverras.

### Exercice 6 — Props incompatibles

Faire volontairement deux composants aux props différentes et essayer de les mettre dans la même table typée. Observer où ça coince, puis résoudre par un contrat commun.

**Attendu** : tu as anticipé le problème qui t'attend à l'arrivée du deuxième archétype.

---

## Réussi quand

- Oublier une entrée dans la table est une erreur de compilation.
- Tu peux lister dynamiquement les clés de la table à l'écran.
- Tu sais expliquer pourquoi `Icon.tsx:4` renomme sa prop.

---

## Les pièges

**La minuscule.** Silencieux : pas d'erreur, juste un élément vide dans le DOM. Quand un composant « ne s'affiche pas », inspecte le DOM avant de chercher ailleurs.

**`<registry[cle] />`.** Erreur de syntaxe, celle-là au moins est bruyante.

**Appeler au lieu de référencer.** `const Body = StatBody()` appelle le composant hors du cycle de rendu de React — les hooks à l'intérieur exploseront. Une table contient des **références** de fonctions, jamais des appels.

**Annoter la table sans `Record<K, V>`.** `const registry = { stat: StatBody }` sans annotation compile parfaitement et ne garantit rien : tu perds exactement ce que la fiche apporte.

**Croire qu'un Registry à une entrée ne sert à rien.** C'est vrai à court terme — un `switch` à une branche aussi. Ce que tu construis, c'est la structure dans laquelle le deuxième archétype se posera sans rien casser.
