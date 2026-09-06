# Fiche 7 — CSS Grid explicite

> **Taille** : courte · **Dépend de** : rien · **Débloque** : la traduction de `{x, y, w, h}` en pixels.

## Pourquoi tu en as besoin

Ton modèle est une grille d'entiers. L'écran est en pixels. CSS Grid est le pont, et c'est un bon pont : tu lui donnes des indices de colonnes, il calcule les largeurs, gère les gouttières et se redimensionne tout seul. Tu n'écris aucun calcul de pixels.

Deux pièges seulement, mais tous les deux silencieux.

---

## 1. Le substrat

```css
display: grid;
grid-template-columns: repeat(12, minmax(0, 1fr));
grid-auto-rows: 60px;
gap: 16px;
```

- `repeat(12, ...)` : douze colonnes.
- `1fr` : une fraction de l'espace libre. Douze colonnes en `1fr` se partagent la place également.
- `grid-auto-rows: 60px` : toute rangée créée implicitement fait 60px. C'est la hauteur de rangée du CDC.
- `gap: 16px` : la gouttière, entre les colonnes **et** entre les rangées.

Point important pour ton arithmétique : la gouttière n'existe **qu'entre** les pistes. Douze colonnes ont onze gouttières, pas douze. Tu en auras besoin à la fiche 8 pour convertir des pixels en indice de colonne.

## 2. `minmax(0, 1fr)` — premier piège

`1fr` seul ne veut pas dire « un douzième de la largeur ». Il veut dire « un douzième de l'espace **libre**, mais au moins la taille minimale du contenu ».

Cette taille minimale par défaut (`min-width: auto`) est celle du contenu le plus large qui ne peut pas être coupé — un mot très long, un tableau, une image non contrainte.

Résultat : une colonne contenant un long mot **s'élargit**, vole la place des autres, et ta grille de 12 colonnes égales devient une grille de 12 colonnes inégales. Sans erreur, sans avertissement.

```css
grid-template-columns: repeat(12, 1fr);              /* ✗ colonnes déformables */
grid-template-columns: repeat(12, minmax(0, 1fr));   /* ✓ minimum forcé à 0 */
```

`minmax(0, 1fr)` dit : « minimum zéro, maximum une fraction ». Le contenu débordera ou sera tronqué selon ton `overflow`, mais la **grille** garde ses proportions.

Sur un dashboard où l'utilisateur place des widgets à des positions précises, une grille qui se déforme selon le contenu est inacceptable : le widget en colonne 4 ne serait plus au même endroit selon la valeur affichée.

## 3. Le placement explicite

Par défaut, les enfants se placent automatiquement dans l'ordre du document. Tu ne veux pas ça : tu veux dire exactement où.

```css
grid-column: 4 / span 3;    /* commence à la ligne 4, occupe 3 colonnes */
grid-row: 1 / span 2;       /* commence à la ligne 1, occupe 2 rangées */
```

Deux notations pour la même chose :

```css
grid-column: 4 / span 3;    /* début + nombre de pistes */
grid-column: 4 / 7;         /* début + fin (exclusive) */
```

Préfère `span` : il correspond directement à ton `w`, alors que la seconde forme t'oblige à calculer `x + w` et à te tromper d'un cran une fois sur deux.

## 4. L'indexation — second piège

**CSS Grid numérote les lignes de séparation à partir de 1. Ton modèle numérote les colonnes à partir de 0.**

```
    ligne 1   ligne 2   ligne 3   ligne 4
      │  col 0  │  col 1  │  col 2  │
      ├─────────┼─────────┼─────────┤
```

Un widget en `x = 0` commence à la **ligne 1**. Un widget en `x = 3` commence à la **ligne 4**.

La conversion est une addition. Le danger n'est pas sa difficulté, c'est sa **dispersion** : écrite à trois endroits, elle sera oubliée au quatrième. Isole-la dans une seule fonction qui prend `{x, y, w, h}` et retourne les propriétés de style. Un seul endroit où le `+1` existe.

Le symptôme quand tu te trompes : tout est décalé d'une colonne, de façon parfaitement régulière. Invisible avec un seul widget, évident avec quatre.

## 5. Tailwind v4 et les valeurs calculées

Ton projet n'a pas de `tailwind.config.js` : Tailwind v4 se configure en CSS, via `@import "tailwindcss"` dans `index.css`.

Pour la grille elle-même, les classes suffisent — tu utilises déjà `grid`, `md:grid-cols-[16rem_1fr]` et `grid-rows-[auto_1fr]` dans `MainLayout.tsx:10`.

Pour le **placement des widgets**, non :

```tsx
className={`col-start-${x + 1}`}    // ✗ ne marchera jamais
```

Tailwind analyse ton code source **statiquement**, comme du texte. Il cherche des chaînes qui ressemblent à des classes. `col-start-${x + 1}` n'existe nulle part dans ton fichier — seulement `col-start-` suivi d'une interpolation que Tailwind ne peut pas évaluer. La classe n'est jamais générée, et l'élément n'a aucun style.

C'est silencieux : pas d'erreur de build, pas d'avertissement. Juste un widget mal placé.

Les positions calculées passent donc par `style` :

```tsx
<div style={{ gridColumn: `${x + 1} / span ${w}`, gridRow: `${y + 1} / span ${h}` }} />
```

Ce n'est pas un contournement sale, c'est le cas d'usage prévu : Tailwind pour ce qui est connu à la compilation, `style` pour ce qui est calculé à l'exécution.

## 6. Le responsive

Sous le breakpoint `md`, le CDC (§3.6) dit : positions ignorées, empilement une colonne, largeur pleine.

Concrètement, il suffit que le conteneur cesse d'être une grille à 12 colonnes et que les enfants perdent leur placement explicite. Le tri par ordre de lecture (`y` croissant, puis `x`) se fait côté données, avant le rendu — pas en CSS.

---

## Exercices

### Exercice 1 — La grille nue

Une grille de 12 colonnes avec des gouttières, et douze blocs colorés d'une colonne chacun. Vérifier visuellement qu'ils sont de largeur égale.

**Attendu** : douze colonnes régulières.

### Exercice 2 — Le placement

Placer trois blocs à des positions choisies, par exemple `{x:0,y:0,w:3,h:2}`, `{x:3,y:0,w:6,h:2}`, `{x:0,y:2,w:4,h:1}`. Écrire ces positions comme des données, et une fonction qui les convertit en style.

**Attendu** : les trois blocs sont exactement là où le modèle le dit. Vérifie en comptant les colonnes à l'écran.

### Exercice 3 — Le décalage

Retirer volontairement le `+1` de la conversion. Observer.

**Attendu** : tu reconnais le symptôme (tout décalé d'un cran, régulièrement) et tu sauras l'identifier immédiatement quand il reviendra.

### Exercice 4 — `1fr` contre `minmax(0, 1fr)`

Mettre dans un bloc un mot très long sans espaces (une centaine de caractères). Comparer le rendu avec `repeat(12, 1fr)` et avec `repeat(12, minmax(0, 1fr))`.

**Attendu** : tu vois la grille se déformer dans le premier cas, tenir dans le second, et tu peux expliquer pourquoi.

### Exercice 5 — Le trou

Placer deux blocs en laissant délibérément une zone vide entre eux, sans utiliser d'élément vide invisible.

**Attendu** : le placement explicite suffit — les trous ne coûtent rien en CSS Grid. C'est ce qui rend la grille 2D libre possible.

### Exercice 6 — Le piège Tailwind

Tenter le placement avec une classe Tailwind interpolée. Inspecter l'élément dans le navigateur pour constater qu'aucune classe n'a été générée. Corriger avec `style`.

**Attendu** : tu sais reconnaître ce mode de panne — la classe est bien dans l'attribut `class` du DOM, mais aucune règle CSS ne lui correspond.

### Exercice 7 — L'empilement

Faire en sorte que sous une certaine largeur, les blocs s'empilent en une colonne pleine largeur, sans toucher aux données.

**Attendu** : redimensionner la fenêtre bascule d'un mode à l'autre.

---

## Réussi quand

- Un `{x: 3, y: 1, w: 3, h: 2}` atterrit exactement où tu l'attends.
- Un contenu trop large ne déforme pas la grille.
- La conversion modèle → CSS existe à **un seul endroit** dans ton code.

---

## Les pièges

**L'indexation à 1.** Régulier, silencieux, et d'autant plus vicieux qu'un décalage d'une colonne peut passer pour un choix de design tant que la grille est peu remplie.

**`1fr` au lieu de `minmax(0, 1fr)`.** Ne se manifeste que le jour où un widget affiche une valeur inhabituellement longue — donc en production, avec de vraies données.

**Les classes Tailwind interpolées.** Aucune erreur, aucune classe. Réflexe de diagnostic : si un style Tailwind « ne s'applique pas », cherche la classe dans le CSS généré avant de chercher ailleurs.

**Disperser la conversion.** Trois `x + 1` dans trois fichiers, et le jour où tu changes de convention, tu en oublies un. Une fonction, un endroit.

**Utiliser `grid-column: x / y` au lieu de `span`.** Ça marche, mais tu calcules `x + w` à la main partout, et l'erreur de borne est très facile.
