# 01. Les variables CSS

> **Prérequis :** aucun, c'est le point de départ du cours. **Lecture :** ~20 min. **Fichiers concernés :** `index.css`, `widget-grid.css`, `WidgetGrid.tsx`, `CategorySidebar.tsx`, `WidgetCard.tsx`, `ChartBody.tsx`, `WidgetPaletteItem.tsx`.

## 1. Le problème

Imagine la grille de widgets sans variables CSS. Chaque widget a une position (`x`, `y`) et une taille (`width`, `height`) qui viennent de React. Pour placer une cellule dans une grille CSS, il faut écrire quelque chose comme :

```css
grid-column: 3 / span 4;
grid-row: 2 / span 2;
```

Mais ces nombres changent pour chaque widget, et ils changent pendant le drag. Deux mauvaises solutions s'offrent à toi :

- **Écrire tout le style en `style={{ ... }}` dans React.** Tu perds les media queries, les container queries, les `:hover` : rien de tout ça ne s'écrit en inline style. La grille passe en une colonne sur téléphone, et ça, c'est du CSS pur (voir chapitre 08).
- **Générer une classe par combinaison** (`.col-3-span-4`...). Il en faudrait des centaines.

Deuxième problème, plus général : la couleur indigo de l'accent apparaît dans des dizaines de règles. Si elle est recopiée partout en dur, la changer devient une chasse au trésor.

Les variables CSS résolvent les deux : **React fournit les nombres, le CSS garde la logique**, et une valeur partagée n'est écrite qu'une fois.

## 2. La notion

Une **variable CSS** (le nom officiel est *custom property*, « propriété personnalisée ») est une propriété CSS dont le nom commence par deux tirets. Elle se déclare comme n'importe quelle propriété :

```css
.widget-cell {
    --w: 4;            /* déclaration : nom avec --, puis une valeur */
}
```

et se lit avec la fonction `var()` :

```css
.widget-cell {
    grid-column: span var(--w);   /* lecture : vaut "span 4" */
}
```

Quatre choses à comprendre.

**1. Une variable est une propriété comme une autre, donc elle s'hérite.** Si tu déclares `--tone` sur un élément, tous ses descendants peuvent la lire avec `var(--tone)`, sauf si l'un d'eux la redéclare. C'est ce qui permet de poser une variable sur un parent et de la lire dans un enfant.

```
<a style="--tone: orange">        ← déclarée ici
  └─ <span class="tone-tile">     ← lue ici : var(--tone) = orange
       └─ <svg>                    ← et ici aussi, si besoin
```

Une variable déclarée sur `:root` (l'élément `<html>`) est donc visible **partout** : c'est l'endroit des valeurs globales.

**2. `var()` accepte une valeur de repli.** `var(--tone, indigo)` vaut `indigo` si `--tone` n'est déclarée nulle part au-dessus de l'élément. La valeur de repli peut elle-même être une variable : `var(--tone, var(--color-accent))`.

**3. La valeur est du texte, interprété au moment de l'utilisation.** `--w: 4` ne « sait » pas qu'il est un nombre. C'est la propriété qui le lit (`grid-column`) qui décide si le résultat a un sens. Conséquence : une variable peut contenir un nombre, une durée (`150ms`), une couleur, une ombre complète, un dégradé entier, ou même un morceau de valeur (`49 46 129`, trois nombres qu'on glisse ensuite dans `rgb()`).

**4. `calc()` sait calculer avec.** `calc(var(--col-w) + var(--gap))` additionne deux longueurs. Pour transformer un nombre nu en longueur, on multiplie : `calc(var(--n) * 1px)`.

**Depuis React**, on pose une variable sur un élément avec l'attribut `style`. React accepte les noms qui commencent par `--`, mais le type TypeScript `CSSProperties` ne les connaît pas, d'où le cast :

```tsx
<div style={{ "--w": 4 } as CSSProperties} />
```

React écrit alors `style="--w: 4"` dans le DOM, et le CSS fait le reste.

## 3. Exemple minimal

Colle ceci dans un fichier `test.html` et ouvre-le :

```html
<style>
  .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
  .cell { grid-column: var(--col) / span var(--w); background: var(--tone, gray); height: 40px; }
</style>
<div class="grid">
  <div class="cell" style="--col: 1; --w: 2; --tone: orange"></div>
  <div class="cell" style="--col: 4; --w: 3"></div>
</div>
```

Tu dois voir un bloc orange sur les colonnes 1 et 2, et un bloc gris sur les colonnes 4 à 6. Le second n'a pas de `--tone` : la valeur de repli `gray` s'applique. Ouvre les outils de développement (F12), sélectionne un bloc et modifie `--w` dans le panneau Styles : la largeur change en direct.

## 4. Dans XiaoTrack

### 4.1 Placer les widgets : `--col`, `--row`, `--w`, `--h`

[WidgetGrid.tsx](../../apps/web/src/components/widgets/WidgetGrid.tsx) (l. 110-117) pose les variables sur chaque cellule :

```tsx
style={{
    "--col": shownWidget.position.x + 1,
    "--row": shownWidget.position.y + 1,
    "--w":   w.size.width,
    "--h":   w.size.height,
    "--enter-delay": `${enterDelay}ms`,
    ...(isDragged && { "--dx": `${dragDelta?.x}px`, "--dy": `${dragDelta?.y}px` })
} as CSSProperties}
```

- `--col` / `--row` : la position du widget. Le `+ 1` est là parce que les positions sont comptées à partir de 0 dans le modèle, alors que les lignes de grille CSS commencent à 1.
- `--w` / `--h` : la taille, en nombre de cases.
- `--enter-delay` : une durée, avec son unité (`"120ms"`). On l'écrit en chaîne parce qu'une durée sans unité ne veut rien dire en CSS.
- La dernière ligne n'ajoute `--dx` / `--dy` que pour le widget tenu pendant un drag. `...(false && {...})` n'ajoute rien, c'est une astuce JavaScript pour une clé conditionnelle.

Le CSS les lit dans [widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css). Sur grand écran (l. 560-564) :

```css
.widget-cell,
.widget-placeholder {
    grid-column: var(--col) / span var(--w);
    grid-row: var(--row) / span var(--h);
}
```

`grid-column: 3 / span 4` veut dire « commence à la ligne de colonne 3 et occupe 4 colonnes ». Sur téléphone, cette règle n'existe pas (elle est dans un `@container`, voir chapitre 08) : seule `grid-row: span var(--h)` (l. 24) s'applique, et les cellules s'empilent. **Les mêmes variables servent deux mises en page différentes**, c'est tout l'intérêt.

Le marqueur pointillé `.widget-placeholder` reçoit les mêmes quatre variables (WidgetGrid.tsx l. 128-133) : il se place avec exactement la même règle.

### 4.2 La cascade d'entrée : `--enter-delay`

[widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css) l. 33 :

```css
animation-delay: var(--enter-delay, 0ms);
```

Chaque cellule attend `--enter-delay` avant de jouer son animation d'entrée. WidgetGrid calcule ce délai (l. 103) : `index * 40ms`, plafonné à `360ms`. Résultat : les widgets apparaissent l'un après l'autre. Le repli `0ms` sert si la variable manque. Les animations elles-mêmes sont au chapitre 11.

### 4.3 Le drag : `--dx`, `--dy`

l. 357-358 :

```css
.widget-cell.is-dragging {
    translate: var(--dx) var(--dy);
```

Pendant un drag, React met à jour `--dx` / `--dy` à chaque mouvement du pointeur, et le CSS décale la cellule d'autant. React ne touche jamais à `translate` directement : il change deux nombres, le CSS sait quoi en faire. `translate` est expliqué au chapitre 09.

### 4.4 Des variables calculées : `--gap`, `--col-w`, `--cols`

l. 9-12 :

```css
.widget-grid {
    --gap: 0.6cqi;
    /* One column (= one row, the cells are square), in desktop mode */
    --col-w: calc((100cqi - (var(--cols) - 1) * var(--gap)) / var(--cols));
```

Ici, c'est le CSS qui déclare ses propres variables, pour ne pas répéter un calcul :
- `--cols` vient de React (WidgetGrid.tsx l. 95, `style={{"--cols": GRID_COLS}}`, soit 12). La constante TypeScript et le CSS partagent ainsi une seule source.
- `--col-w` est la largeur d'une colonne : la largeur totale (`100cqi`, voir chapitre 08), moins les 11 espaces entre colonnes, divisée par 12. Elle est réutilisée pour la hauteur des lignes, les guides en pointillés et la marge du bas en mode édition (l. 517, 523-524, 537-540).

### 4.5 La couleur de domaine : `--tone`

C'est l'usage le plus instructif, parce qu'il repose sur l'**héritage** et la **valeur de repli**.

La règle est dans [index.css](../../apps/web/src/assets/css/index.css) (l. 123-126) :

```css
@utility tone-tile {
    background-color: color-mix(in oklch, var(--tone, var(--color-accent)) 13%, white);
    color: var(--tone, var(--color-accent));
}
```

- L'icône prend la couleur `--tone`, ou l'accent indigo si aucune n'est fournie.
- Le fond est la même couleur, mélangée à 13 % avec du blanc (`color-mix`, voir chapitre 05).

Trois composants fournissent `--tone`, de trois façons :

- **Sur un parent, par héritage.** [CategorySidebar.tsx](../../apps/web/src/layout/Sidebar/CategorySidebar.tsx) l. 29 pose la variable sur le lien entier : `style={{ "--tone": tone } as CSSProperties}`. La tuile (l. 35) est un enfant : elle l'hérite. La valeur vient de `domainToneMap` ([domainTone.styles.ts](../../apps/web/src/shared/styles/domainTone.styles.ts), l. 8-15), qui contient des chaînes comme `"var(--color-domain-nutrition)"` : **la valeur d'une variable peut être un `var()`**, résolu plus tard.
- **Sur la tuile elle-même, conditionnellement.** [WidgetCard.tsx](../../apps/web/src/components/widgets/WidgetCard.tsx) l. 39 : `style={definition.tone ? { "--tone": definition.tone } as CSSProperties : undefined}`. Pas de `tone` dans le catalogue ? Pas de variable, et le repli indigo s'applique.
- **Pareil dans la palette** : [WidgetPaletteItem.tsx](../../apps/web/src/components/widgets/palette/WidgetPaletteItem.tsx) l. 26.

La tuile active de la sidebar utilise aussi la variable directement en classe Tailwind : `bg-(--tone)` (CategorySidebar.tsx l. 18), qui veut dire `background-color: var(--tone)` (voir chapitre 03).

### 4.6 Le point du graphique : `--dot-x`, `--dot-y`

[ChartBody.tsx](../../apps/web/src/components/widgets/bodies/ChartBody.tsx) l. 65-68 calcule où tombe le dernier point de la courbe, en pourcentage, et le transmet :

```tsx
<span
    className="chart-body-dot"
    style={{ "--dot-x": `${last.x}%`, "--dot-y": `${last.y}%` } as CSSProperties}
/>
```

[widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css) l. 286-295 :

```css
.chart-body-dot {
    position: absolute;
    left: var(--dot-x);
    top: var(--dot-y);
    ...
    translate: -50% -50%;
```

`left` / `top` placent le coin haut-gauche du point ; `translate: -50% -50%` recentre le point sur la coordonnée.

### 4.7 La mini-carte de la palette : `--cols`, `--w`, `--h` encore

[WidgetPaletteItem.tsx](../../apps/web/src/components/widgets/palette/WidgetPaletteItem.tsx) l. 38 pose `--cols`, `--w`, `--h` sur un petit schéma. [palette.css](../../apps/web/src/components/widgets/palette/palette.css) l. 42-57 :

```css
.palette-size {
    display: grid;
    grid-template-columns: repeat(var(--cols), 4px);
    grid-template-rows: repeat(var(--h), 4px);
    ...
}

.palette-size-fill {
    grid-column: 1 / span var(--w);
    grid-row: 1 / span var(--h);
```

Une grille de 12 colonnes de 4 px, et un rectangle qui en occupe `w × h` : la taille par défaut du widget, dessinée en miniature avec les mêmes noms de variables que la vraie grille.

### 4.8 Les valeurs globales : `--shadow-tint`, `--motion-*`

[index.css](../../apps/web/src/assets/css/index.css) l. 91-105 déclare des variables sur `:root`, donc visibles partout :

```css
:root {
    --shadow-tint: 49 46 129;
    ...
    --motion-fast: 150ms;   /* hovers, presses */
    --motion-base: 250ms;   /* state changes */
    --motion-slow: 400ms;   /* entrances, exits */
}
```

- `--shadow-tint` n'est pas une couleur complète, juste trois nombres. Les ombres l'insèrent dans `rgb()` en ajoutant une opacité différente à chaque fois : `rgb(var(--shadow-tint) / 0.05)` (l. 79). Le jour du mode sombre, cette seule ligne changera.
- `--motion-*` sont les durées partagées : `transition: color var(--motion-fast)` (l. 146, widget-grid.css l. 155...). Une durée change à un seul endroit.

Les variables de `@theme` (couleurs, tailles de texte...) sont aussi des variables CSS sur `:root`, avec un bonus : Tailwind en tire des classes. C'est le sujet du chapitre 03.

## 5. Pièges

- **Oublier l'unité.** `--enter-delay: 120` puis `animation-delay: var(--enter-delay)` donne une valeur invalide : la propriété est ignorée en silence. Les durées et longueurs passées depuis React doivent porter leur unité (`` `${enterDelay}ms` ``, `` `${x}px` ``).
- **Une variable invalide ne déclenche pas le repli.** Le repli de `var(--x, 10px)` ne sert que si `--x` n'est **pas définie**. Si `--x` vaut `"bonjour"`, `var()` renvoie `"bonjour"`, la propriété devient invalide, et elle prend sa valeur par défaut, pas `10px`.
- **Les fautes de frappe ne lèvent pas d'erreur.** `var(--colw)` au lieu de `var(--col-w)` n'affiche rien dans la console. Le panneau Styles des outils de développement barre la propriété ou affiche la valeur calculée : c'est là qu'on vérifie.
- **Le cast `as CSSProperties` est obligatoire** dans `style`, sinon TypeScript refuse les clés `--...`. Il ne vérifie rien : une variable mal nommée passera la compilation.
- **L'héritage traverse tout.** Une `--tone` posée sur un lien de la sidebar est visible par tous ses descendants. Si un enfant doit avoir une autre valeur, il faut la redéclarer sur lui.

## 6. À retenir

- Une variable CSS se déclare `--nom: valeur` et se lit `var(--nom, repli)` ; elle s'hérite comme `color`.
- Sa valeur est du texte, interprété par la propriété qui la lit : nombre, durée, couleur, ombre, morceau de valeur.
- Dans XiaoTrack, **React fournit des nombres via `style`** (`--col`, `--w`, `--dx`, `--tone`...) et **le CSS garde toute la logique** de mise en page.
- Les valeurs partagées (`--shadow-tint`, `--motion-*`, les tokens de `@theme`) vivent sur `:root` et ne s'écrivent qu'une fois.

## 7. Exercice

Lance l'app (`npm run dev:web`), ajoute deux ou trois widgets, puis ouvre les outils de développement (F12).

1. Sélectionne une `div.widget-cell` dans l'onglet Elements. Dans le panneau Styles, attribut `style`, change `--w` de sa valeur à `6`. Que se passe-t-il ?
2. Sur une entrée de la sidebar (le `<a>`), change `--tone` en `red`. Que devient la tuile d'icône ?
3. Supprime complètement la déclaration `--tone` de ce même `<a>`. Quelle couleur prend la tuile, et pourquoi ?

Rien n'est enregistré : un rechargement de page annule tout.

<details><summary>Solution</summary>

1. Le widget s'élargit à 6 colonnes à l'instant, sans React : `grid-column: var(--col) / span var(--w)` est recalculé par le navigateur. Il peut chevaucher un voisin, parce que la règle de non-chevauchement vit dans le moteur TypeScript, pas dans le CSS.
2. L'icône devient rouge et le fond rose pâle (rouge mélangé à 13 % avec du blanc par `color-mix`). La tuile hérite de la variable posée sur son parent.
3. La tuile redevient indigo : `--tone` n'est plus définie, donc `var(--tone, var(--color-accent))` prend sa valeur de repli, l'accent.

</details>
