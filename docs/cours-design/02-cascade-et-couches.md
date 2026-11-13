# 02. La cascade et les couches (`@layer`)

> **Prérequis :** chapitre 01. **Lecture :** ~20 min. **Fichiers concernés :** `index.css`, `widget-grid.css`, `modal.css`, `palette.css`, `WidgetPaletteItem.tsx`, `CategorySidebar.tsx`.

## 1. Le problème

Dans la palette de widgets, chaque ligne a une tuile d'icône. Deux règles veulent lui donner un fond :

```css
/* palette.css : un widget déjà ajouté a une tuile grise */
.palette-item.is-placed .palette-item-icon {
    background-color: var(--color-line);
}

/* index.css : la tuile prend la couleur de son domaine */
@utility tone-tile {
    background-color: color-mix(...);
}
```

La première règle a un sélecteur long et précis, la seconde une seule classe. Intuitivement, la plus précise devrait gagner. **Dans XiaoTrack, c'est l'inverse** : `tone-tile` gagne toujours. Il a fallu ne pas poser `tone-tile` sur les widgets déjà ajoutés pour que le gris s'affiche ([WidgetPaletteItem.tsx](../../apps/web/src/components/widgets/palette/WidgetPaletteItem.tsx) l. 22-25).

Pour comprendre pourquoi, il faut savoir comment le navigateur choisit entre deux règles en conflit : c'est **la cascade**, et depuis peu, **les couches**.

## 2. La notion

### 2.1 La cascade

Quand plusieurs règles donnent une valeur à la même propriété du même élément, le navigateur les départage dans cet ordre. On ne passe au critère suivant qu'en cas d'égalité au précédent :

```
1. Importance      une déclaration !important bat une déclaration normale
2. Origine         tes styles battent les styles par défaut du navigateur
3. Inline          style="..." bat toute feuille de style
4. Couche          (@layer, voir plus bas)
5. Spécificité     le sélecteur le plus « précis » gagne
6. Ordre           à égalité, la règle écrite le plus bas gagne
```

La **spécificité** se compte en trois chiffres (a, b, c) :
- a : le nombre d'identifiants (`#menu`) ;
- b : le nombre de classes, d'attributs (`[open]`) et de pseudo-classes (`:hover`) ;
- c : le nombre de balises (`div`) et de pseudo-éléments (`::before`).

On compare a d'abord, puis b, puis c. Exemples :

| Sélecteur | Spécificité |
|---|---|
| `.tone-tile` | (0, 1, 0) |
| `.palette-item-icon` | (0, 1, 0) |
| `.palette-item.is-placed .palette-item-icon` | (0, 3, 0) |
| `.btn:hover:not(:disabled)` | (0, 3, 0) |

Sans couches, `.palette-item.is-placed .palette-item-icon` (0, 3, 0) battrait `.tone-tile` (0, 1, 0).

### 2.2 Les couches : `@layer`

Une **couche** (*cascade layer*) est un groupe nommé de règles :

```css
@layer components {
    .palette-item-icon { ... }
}
```

On déclare l'ordre des couches une fois :

```css
@layer base, components, utilities;
```

**Règle d'or : entre deux couches, la plus tardive dans cet ordre gagne, quelle que soit la spécificité.** La spécificité ne sert plus qu'à départager deux règles **de la même couche**. Une règle `utilities` à une seule classe bat donc une règle `components` à trois classes. C'est exactement ce qui se passe avec `tone-tile`.

Et les règles écrites **hors de toute couche** ? Elles battent toutes les couches. C'est un piège classique (voir §5).

### 2.3 Les couches de Tailwind v4

Tailwind v4 déclare lui-même quatre couches, dans cet ordre :

```
theme  <  base  <  components  <  utilities
```

- **`theme`** : les variables de `@theme` (chapitre 03).
- **`base`** : la remise à zéro des styles du navigateur (*preflight*), plus tes styles de base (`body`...).
- **`components`** : tes classes de composants, par exemple `.btn` ou `.widget-card`.
- **`utilities`** : toutes les classes utilitaires de Tailwind (`flex`, `p-4`, `bg-surface`...) et tes `@utility` (chapitre 04).

Ce choix est volontaire : une classe utilitaire écrite dans le JSX doit pouvoir **corriger** un composant au cas par cas. `<button className="btn btn-ghost rounded-full">` arrondit complètement le bouton, alors que `.btn` impose un `border-radius`. La classe `rounded-full` est dans `utilities`, elle gagne.

## 3. Exemple minimal

```html
<style>
  @layer components, utilities;

  @layer utilities {
    .red { color: red; }
  }
  @layer components {
    body div.box p.text { color: blue; }   /* spécificité (0, 2, 3) : énorme */
  }
  p.free { color: green; }                 /* hors couche */
</style>
<div class="box">
  <p class="text red">Je suis rouge : utilities bat components, malgré la spécificité.</p>
  <p class="text red free">Je suis vert : hors couche bat toutes les couches.</p>
</div>
```

Ouvre le fichier : la première ligne est rouge, la seconde verte. Dans les outils de développement (F12), le panneau Styles regroupe les règles par couche et barre celles qui perdent.

## 4. Dans XiaoTrack

### 4.1 Les feuilles de composants sont dans `@layer components`

Les trois fichiers CSS propres à des composants commencent tous par la même ligne :

- [widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css) l. 1 : `@layer components {`
- [modal.css](../../apps/web/src/components/modals/modal.css) l. 1 : `@layer components {`
- [palette.css](../../apps/web/src/components/widgets/palette/palette.css) l. 1 : `@layer components {`

Tout leur contenu est dans la couche `components`. Deux conséquences :
- ces règles battent la remise à zéro de Tailwind (`base`) : un `<h2 class="widget-card-title">` garde la taille qu'on lui donne ;
- une utility Tailwind ajoutée dans le JSX peut toujours les surcharger.

C'est aussi la règle notée dans CLAUDE.md : « Component-specific styles go in a sibling CSS file in `@layer components` ».

### 4.2 La grille : ne jamais mettre d'utility de grille dessus

CLAUDE.md précise, à propos de `.widget-grid` et `.widget-cell` : *« Don't add Tailwind grid utilities on these elements, because the `utilities` layer would override the CSS. »*

Exemple concret. [widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css) l. 514-517 :

```css
@container grid (min-width: 780px) {
    .widget-grid {
        grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
```

Si quelqu'un ajoute `className="widget-grid grid-cols-2"` dans `WidgetGrid.tsx`, la classe `grid-cols-2` (couche `utilities`) écrase cette règle (couche `components`), y compris sur grand écran : la grille de 12 colonnes devient une grille de 2, et tous les placements calculés par le moteur tombent faux. Rien ne le signale, à part le résultat à l'écran.

### 4.3 Le cas `tone-tile` contre `.is-placed`

Reprenons le problème du §1 avec les bons outils.

[palette.css](../../apps/web/src/components/widgets/palette/palette.css) l. 36-39 (couche `components`) :

```css
.palette-item.is-placed .palette-item-icon {
    background-color: var(--color-line);
    color: var(--color-ink-muted);
}
```

[index.css](../../apps/web/src/assets/css/index.css) l. 123-126 (`@utility`, donc couche `utilities`) :

```css
@utility tone-tile {
    background-color: color-mix(in oklch, var(--tone, var(--color-accent)) 13%, white);
    color: var(--tone, var(--color-accent));
}
```

`utilities` est après `components` : `tone-tile` gagne, malgré sa spécificité trois fois plus faible. Si la tuile d'un widget déjà ajouté portait `tone-tile`, elle resterait colorée au lieu de passer en gris.

La solution retenue est dans [WidgetPaletteItem.tsx](../../apps/web/src/components/widgets/palette/WidgetPaletteItem.tsx) l. 22-27 :

```tsx
{/* Placed: no tone-tile, the grey "already added" look of palette.css applies
    (a utility would win over it, whatever the selector) */}
<span
    className={`palette-item-icon ${isPlaced ? "" : "tone-tile"}`}
    style={tone ? { "--tone": tone } as CSSProperties : undefined}
>
```

- Widget pas encore ajouté : la tuile porte `tone-tile`, elle est colorée.
- Widget ajouté : pas de `tone-tile`, seule la règle grise de `palette.css` s'applique.

On ne se bat pas contre la cascade, on retire la règle qui ne doit pas s'appliquer.

### 4.4 Deux utilities sur le même élément : la tuile active de la sidebar

[CategorySidebar.tsx](../../apps/web/src/layout/Sidebar/CategorySidebar.tsx) l. 17-18 et 35 :

```tsx
const tileBase = "tone-tile flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors duration-200";
const tileActive = "bg-(--tone) text-white";
...
<span className={`${tileBase} ${isActive ? tileActive : ""}`}>
```

Quand l'entrée est active, la tuile porte à la fois `tone-tile` (fond pâle) et `bg-(--tone)` (fond plein), toutes deux dans la couche `utilities`. Là, la couche ne départage plus : spécificité égale (une classe chacune), donc c'est **l'ordre dans la feuille générée** qui décide. Cet ordre n'est pas celui des classes dans `className` : c'est Tailwind qui range ses utilities dans le fichier CSS qu'il produit. Ici, `bg-(--tone)` et `text-white` sortent après `tone-tile`, et la tuile active s'affiche bien pleine, icône blanche (vérifié à l'écran).

Retiens la leçon : **l'ordre des classes dans `className` ne compte pas**. Seul compte l'ordre des règles dans le CSS.

### 4.5 `@layer base` : le fond de page

[index.css](../../apps/web/src/assets/css/index.css) l. 247-259 :

```css
@layer base {
    body {
        background-color: var(--color-canvas);
        background-image:
            radial-gradient(...),
            radial-gradient(...);
        background-attachment: fixed;
        color: var(--color-ink);
        font-size: var(--text-body);
        ...
    }
```

Le style du `body` est dans `base`, au même niveau que la remise à zéro de Tailwind : c'est un style par défaut de la page, que n'importe quel composant ou utility peut remplacer. Les dégradés eux-mêmes sont expliqués au chapitre 06.

La même couche contient la règle `prefers-reduced-motion` (l. 263-272), qui utilise `!important` : l'importance passe avant les couches (critère 1 de la cascade), donc elle coupe les animations de toutes les couches à la fois. Voir chapitre 16.

### 4.6 Où vit chaque type de règle

| Couche | Ce qu'on y met dans XiaoTrack | Exemples |
|---|---|---|
| `theme` | Les tokens (`@theme`) | `--color-accent`, `--text-label` |
| `base` | Les styles par défaut de la page | `body`, `prefers-reduced-motion` |
| `components` | Les classes réutilisables et les feuilles de composants | `.btn`, `.widget-card`, `.modal`, `.palette-item` |
| `utilities` | Les classes Tailwind et les `@utility` maison | `flex`, `text-label`, `bg-brand`, `tone-tile` |

Les variables de `:root` (`--shadow-tint`, `--motion-*`, l. 91-105) sont hors couche, mais ce ne sont que des déclarations de variables sur `<html>` : aucun composant ne les redéfinit, il n'y a donc pas de conflit.

## 5. Pièges

- **Écrire une règle hors couche dans une feuille de composant.** Une règle hors de `@layer components {...}` bat toutes les couches, y compris les utilities : plus aucune classe du JSX ne pourra la corriger. Dans XiaoTrack, chaque feuille de composant ouvre `@layer components` à la ligne 1 et le referme à la fin : ajoute tes règles **à l'intérieur**.
- **Monter la spécificité pour gagner contre une utility.** Ça ne marche pas, la couche passe avant. Soit on retire l'utility (comme pour `tone-tile`), soit on met la règle dans la bonne couche.
- **Compter sur l'ordre des classes dans `className`.** `"bg-red-500 bg-blue-500"` et `"bg-blue-500 bg-red-500"` donnent le même résultat : c'est l'ordre des règles dans le CSS généré qui décide. Ne mets jamais deux utilities en conflit sur le même élément sans vérifier.
- **Ajouter `!important` pour « réparer ».** Ça marche, mais ça sort la règle du système de couches et rend toute surcharge future impossible. Dans XiaoTrack, seule la règle d'accessibilité `prefers-reduced-motion` l'utilise, et c'est voulu.

## 6. À retenir

- La cascade départage les règles : importance, origine, inline, **couche**, spécificité, puis ordre.
- Entre deux couches, la plus tardive gagne toujours : `utilities` > `components` > `base`, quelle que soit la spécificité.
- Les feuilles de composants de XiaoTrack sont dans `@layer components`, pour que les classes du JSX puissent les ajuster.
- Une utility bat toujours une règle de composant : pour qu'une règle de composant s'applique, retire l'utility (cas `tone-tile` / `.is-placed`).

## 7. Exercice

Lance l'app, passe en mode édition et ouvre la palette.

1. Dans [WidgetPaletteItem.tsx](../../apps/web/src/components/widgets/palette/WidgetPaletteItem.tsx) l. 25, remplace temporairement `${isPlaced ? "" : "tone-tile"}` par `tone-tile` (toujours présent). Ajoute un widget. Sa tuile passe-t-elle au gris ?
2. Ouvre F12, sélectionne cette tuile : quelle règle `background-color` est barrée, et dans quelle couche est-elle ?
3. Annule le changement : `git checkout -- apps/web/src/components/widgets/palette/WidgetPaletteItem.tsx`.

<details><summary>Solution</summary>

1. Non : la tuile reste colorée, alors que le badge « Added » apparaît. `tone-tile` (couche `utilities`) bat `.palette-item.is-placed .palette-item-icon` (couche `components`).
2. Dans le panneau Styles, la règle de `palette.css` apparaît sous la couche `components`, avec son `background-color` barré. La règle `.tone-tile`, sous `utilities`, est active. Les outils montrent que c'est la couche qui a tranché, pas le sélecteur.
3. Après le `git checkout`, le comportement normal revient : tuile grise pour un widget ajouté.

</details>
