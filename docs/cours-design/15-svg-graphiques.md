# 15. SVG pour les graphiques

> **Prérequis :** chapitres 01 (variables CSS), 05 (couleurs modernes) et 11 (`@keyframes`). **Lecture :** ~20 min. **Fichiers concernés :** `bodies/ChartBody.tsx`, `widget-grid.css`, `icons/library.ts`, `assets/icons/*.svg`, `vite.config.ts`.

## 1. Le problème

Le widget chart devait afficher une courbe, sans installer de bibliothèque de graphiques (une grosse dépendance pour une simple ligne). Il y a trois contraintes :

- la courbe doit **remplir le widget**, quelle que soit sa taille (4×3, 8×2, 12×2...) ;
- le trait doit garder **la même épaisseur** dans un petit et dans un grand widget ;
- la couleur doit venir **des tokens CSS** (`--color-data-1`), pas être écrite en dur dans le composant.

Une image (PNG) serait floue une fois agrandie, et sa couleur serait figée. Le format adapté est le **SVG**.

## 2. La notion

### Le SVG, c'est du dessin décrit en texte

SVG (*Scalable Vector Graphics*) décrit un dessin avec des balises, comme le HTML décrit une page. Au lieu de pixels, on donne des formes et des coordonnées : le navigateur les redessine nettement à n'importe quelle taille. Un SVG peut être écrit directement dans le JSX, et React le gère comme du HTML (avec les attributs en camelCase : `strokeWidth` au lieu de `stroke-width`).

### viewBox : le repère interne

```html
<svg viewBox="0 0 100 100"> ... </svg>
```

`viewBox="x y largeur hauteur"` définit un **repère imaginaire** à l'intérieur du SVG. Ici, il va de 0 à 100 dans les deux sens, quelle que soit la taille réelle du SVG à l'écran. Si le SVG fait 400 px de large, une unité vaut 4 px ; s'il en fait 200, une unité vaut 2 px. On dessine dans le repère, le navigateur met à l'échelle.

Attention au sens de l'axe vertical : comme en CSS, **y descend**. `(0, 0)` est le coin en haut à gauche, `(100, 100)` le coin en bas à droite.

```
(0,0) ─────────── x ──────────► (100,0)
  │
  y
  │
  ▼
(0,100)                         (100,100)
```

### path : tracer avec des commandes

`<path d="...">` trace une forme avec de petites commandes :

| Commande | Signification | Exemple |
|---|---|---|
| `M x y` | *Move to* : lever le crayon et le poser en (x, y) | `M 0 50` |
| `L x y` | *Line to* : tracer un trait droit jusqu'à (x, y) | `L 50 20` |
| `Z` | fermer la forme en revenant au point de départ | `Z` |

`M 0 80 L 50 20 L 100 40` trace une ligne brisée à trois points. Un `path` a un **contour** (`stroke`, sa couleur, `strokeWidth`, son épaisseur) et un **remplissage** (`fill`). Pour une courbe seule, on met `fill="none"`, sinon le navigateur remplit le polygone en noir.

### preserveAspectRatio="none" : étirer

Par défaut, si le SVG n'a pas les mêmes proportions que son `viewBox` (le repère est carré, le widget est large), le navigateur **garde les proportions** et laisse des bandes vides, comme un film 4/3 sur un écran 16/9. Avec `preserveAspectRatio="none"`, il **étire** le repère pour remplir toute la boîte, au prix de déformer le dessin. Pour une courbe, c'est exactement ce qu'on veut : elle épouse le widget.

### vector-effect="non-scaling-stroke" : un trait qui ne s'étire pas

L'étirement a un défaut : il étire aussi le trait. Dans un widget très large, une ligne d'épaisseur 2 deviendrait épaisse à plat et fine en montée. `vectorEffect="non-scaling-stroke"` dit au navigateur de calculer l'épaisseur en **pixels d'écran**, après la mise à l'échelle : 2 px partout.

### Un dégradé : linearGradient, defs et url(#id)

```html
<defs>
  <linearGradient id="fondu" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="currentColor" stop-opacity="0.22" />
    <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
  </linearGradient>
</defs>
<path d="..." fill="url(#fondu)" />
```

- `<defs>` contient des définitions qui ne s'affichent pas seules.
- `<linearGradient>` décrit un dégradé. `x1 y1 x2 y2` donnent sa direction, en proportion de la forme remplie : `(0,0)` vers `(0,1)`, c'est de haut en bas.
- Chaque `<stop>` fixe une couleur à une position. Ici, la même couleur passe de 22 % d'opacité en haut à 0 % en bas : un voile qui s'efface.
- On l'utilise avec `fill="url(#id)"`. Les `id` d'un document HTML sont **globaux** : si deux graphiques utilisent tous les deux `id="fondu"`, le second risque de prendre le dégradé du premier.

### useId : un identifiant unique par composant

`useId()` est un hook React qui renvoie un identifiant **différent pour chaque instance** du composant, stable d'un rendu à l'autre. Avec lui, chaque widget chart a son propre dégradé, sans collision.

### currentColor : la couleur vient du CSS

`currentColor` est un mot-clé CSS (utilisable aussi dans les attributs SVG) qui veut dire « la valeur de la propriété `color` de l'élément ». Si un parent a `color: var(--color-data-1)`, tout ce qui utilise `currentColor` à l'intérieur prend le turquoise. Le SVG ne connaît aucune couleur : c'est le CSS qui décide, et un changement de token se répercute partout.

## 3. Exemple minimal

Colle ceci dans `courbe.html`, puis redimensionne la fenêtre :

```html
<div style="width: 60vw; height: 160px; color: #14b8a6; border: 1px dashed #aaa">
  <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width: 100%; height: 100%; overflow: visible">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="currentColor" stop-opacity="0.25" />
        <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path d="M 0 80 L 25 60 L 50 70 L 75 30 L 100 40 L 100 100 L 0 100 Z" fill="url(#g)" />
    <path d="M 0 80 L 25 60 L 50 70 L 75 30 L 100 40" fill="none" stroke="currentColor"
          stroke-width="2" vector-effect="non-scaling-stroke" />
  </svg>
</div>
```

Ce que tu dois observer : la courbe remplit toujours le cadre, et son trait garde la même épaisseur. Retire `vector-effect="non-scaling-stroke"` et élargis la fenêtre : le trait s'épaissit sur les plats. Retire `preserveAspectRatio="none"` : la courbe reste carrée et laisse du vide sur les côtés. Change le `color` du `div` : la courbe et son voile changent ensemble.

## 4. Dans XiaoTrack

### Les données en coordonnées : [ChartBody.tsx](../../apps/web/src/components/widgets/bodies/ChartBody.tsx) (l. 8-25)

```ts
// Small vertical margin (in %) so the line never touches the top or bottom edge
const PADDING_Y = 8;

function toCoordinates(values: readonly number[]): Point[] {
    const min: number = Math.min(...values);
    const max: number = Math.max(...values);
    const range: number = max - min;
    const lastIndex: number = Math.max(values.length - 1, 1);

    return values.map((value, i) => ({
        x: (i / lastIndex) * 100,
        y: range === 0 ? 50 : PADDING_Y + (1 - (value - min) / range) * (100 - 2 * PADDING_Y),
    }));
}
```

- Le contrat de données du chart n'est qu'une liste de nombres (`points`). Cette fonction les transforme en points du repère 100×100.
- **x** : les points sont répartis régulièrement de 0 à 100. Le premier est à 0, le dernier à 100. `Math.max(…, 1)` évite une division par zéro s'il n'y a qu'un point.
- **y** : `(value - min) / range` ramène chaque valeur entre 0 (la plus petite) et 1 (la plus grande). Comme l'axe y descend, on inverse avec `1 - …` : la plus grande valeur va en haut. Puis on comprime entre 8 et 92 (`PADDING_Y`), pour que la ligne ne colle jamais au bord.
- Une série plate (`range === 0`) est dessinée au milieu, à 50, au lieu de diviser par zéro.

### La ligne et l'aire (l. 38-43)

```ts
const coords: Point[] = toCoordinates(data.points);
const line: string = coords.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
// The same line, closed along the bottom edge: the filled area under the curve
const area: string = `${line} L 100 100 L 0 100 Z`;
const last: Point = coords[coords.length - 1];
```

- `line` : `M` pour le premier point, `L` pour les suivants. Par exemple `"M 0 62 L 16.6 40 L 33.3 71 ..."`.
- `area` : la même ligne, prolongée jusqu'au coin en bas à droite (`L 100 100`), puis au coin en bas à gauche (`L 0 100`), puis refermée (`Z`). On obtient la surface sous la courbe.
- `last` : le dernier point, pour placer la pastille finale.

### Le dessin (l. 51-69)

```tsx
<div className="chart-body-plot">
    {/* preserveAspectRatio="none": the chart stretches to any widget size */}
    <svg className="chart-body-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        {/* non-scaling-stroke: the line keeps its thickness when the SVG is stretched */}
        <path d={line} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
    {/* In HTML, not in the SVG: a circle would be stretched into an ellipse */}
    <span
        className="chart-body-dot"
        style={{ "--dot-x": `${last.x}%`, "--dot-y": `${last.y}%` } as CSSProperties}
    />
</div>
```

- `gradientId` vient de `useId()` (l. 32) : chaque widget chart a son propre dégradé.
- `aria-hidden="true"` : un lecteur d'écran ne sait rien faire d'une courbe ; la dernière valeur est donnée en texte juste au-dessus (l. 47-50).
- L'aire est dessinée **avant** la ligne : en SVG, le dernier élément est dessiné par-dessus.
- `strokeLinejoin="round"` et `strokeLinecap="round"` arrondissent les angles et les extrémités du trait.
- **La pastille finale est un `<span>` HTML, pas un `<circle>` SVG.** Avec `preserveAspectRatio="none"`, un cercle serait étiré comme le reste et deviendrait une ellipse. Le `span` est posé par-dessus le SVG, en pourcentages : comme le repère fait 100 unités, une unité vaut exactement 1 % de la boîte. Le point `(100, 31)` devient `left: 100%; top: 31%`. Les deux valeurs passent par des variables CSS (chapitre 01).

### Le CSS : [widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css)

```css
/* l. 260-267 */
.chart-body-plot {
    position: relative;
    flex: 1;
    min-height: 0;
    color: var(--color-data-1);   /* data colour, not the interface accent (charter §2.3) */
    /* Drawn from left to right on first display */
    animation: chart-reveal 900ms var(--ease-out-soft) 150ms backwards;
}
```

- `color: var(--color-data-1)` : c'est **ici** que la courbe devient turquoise. Le SVG, son dégradé et la pastille utilisent tous `currentColor`.
- `position: relative` : la référence de positionnement de la pastille (`position: absolute`).
- L'animation `chart-reveal` dévoile la courbe de gauche à droite avec un `clip-path` (chapitre 11).

```css
/* l. 279-296 */
.chart-body-svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
}

.chart-body-dot {
    position: absolute;
    left: var(--dot-x);
    top: var(--dot-y);
    width: 0.5rem;
    height: 0.5rem;
    translate: -50% -50%;
    border-radius: 9999px;
    background-color: var(--color-surface);
    box-shadow: 0 0 0 2px currentColor;
}
```

- `overflow: visible` : par défaut, un SVG coupe ce qui dépasse de sa boîte. Le trait de 2 px centré sur les bords x = 0 et x = 100 serait rogné de moitié.
- `display: block` : un SVG est en ligne par défaut, comme du texte, et laisse un petit espace dessous. En bloc, il remplit proprement sa boîte.
- `translate: -50% -50%` : `left` et `top` placent le **coin** de la pastille sur le point ; ce décalage de la moitié de sa propre taille la **centre** dessus (chapitre 09).
- `box-shadow: 0 0 0 2px currentColor` : un anneau de 2 px de la couleur de la courbe, autour d'un disque blanc.

### Les icônes : des SVG importés comme composants

Toutes les icônes de l'app sont des fichiers `.svg` dans `src/assets/icons/`, transformés en composants React par le plugin **vite-plugin-svgr**. Le suffixe `?react` à l'import le déclenche. Dans [library.ts](../../apps/web/src/components/icons/library.ts) (l. 12-14), les trois icônes ajoutées par la refonte :

```ts
export { default as CheckIcon } from '@/assets/icons/check.svg?react'
export { default as GripIcon } from '@/assets/icons/grip-vertical.svg?react'
export { default as AlertIcon } from '@/assets/icons/alert.svg?react'
```

- `check.svg` : la coche du badge « Added » de la palette. C'est un `path` à `stroke="currentColor"`, dont le tracé est animé avec `stroke-dasharray` (chapitre 11).
- `grip-vertical.svg` : la poignée à six points des widgets en mode édition. Six `<circle>` avec `fill="currentColor"` : ici, c'est le remplissage qui prend la couleur du texte, pas le contour.
- `alert.svg` : le cercle avec un point d'exclamation de `WidgetError`.

Deux réglages rendent ces icônes pilotables par le CSS :

1. **`stroke="currentColor"`** (ou `fill="currentColor"`) dans le fichier : l'icône prend la couleur du texte de son parent. C'est ce qui permet à `tone-tile` (chapitre 04) de colorer une icône en orange simplement en changeant `color`.
2. **La configuration de [vite.config.ts](../../apps/web/vite.config.ts)** (l. 15-28) : l'optimiseur `svgo` retire les attributs `stroke-width` et `class` des fichiers. L'épaisseur du trait est alors donnée par le CSS, via `iconWeightMap` dans `shared/styles` (par exemple `[&>svg]:stroke-[1.5]`, une classe Tailwind qui cible le `<svg>` enfant). C'est ce que règle la prop `iconWeight="regular"` ou `"bold"` des composants `<Icon>`.

## 5. Pièges

- **Oublier `fill="none"` sur une courbe** : le navigateur remplit le polygone formé par la ligne, en noir.
- **Deux SVG avec le même `id` de dégradé** : le second peut prendre le dégradé du premier, ou rien du tout s'il est masqué. `useId` règle ça.
- **Mettre du texte ou des cercles dans un SVG à `preserveAspectRatio="none"`** : ils sont déformés. Tout ce qui doit rester rond ou lisible se met en HTML par-dessus.
- **Oublier `vector-effect="non-scaling-stroke"`** : l'épaisseur du trait varie selon la forme du widget.
- **Écrire une couleur en dur dans un SVG** (`stroke="#14b8a6"`) : on perd le pilotage par les tokens. Toujours `currentColor`.
- **L'axe y descend** : sans le `1 - …` de `toCoordinates`, la courbe serait à l'envers.

## 6. À retenir

- `viewBox` crée un repère interne indépendant de la taille réelle ; `preserveAspectRatio="none"` l'étire pour remplir la boîte.
- `vector-effect="non-scaling-stroke"` garde l'épaisseur du trait constante malgré l'étirement.
- Un `path` se trace avec `M` (aller à), `L` (ligne vers) et `Z` (fermer) ; l'aire sous la courbe est la même ligne refermée par le bas.
- `currentColor` fait venir la couleur du CSS : le composant ne connaît aucune couleur, le token `--color-data-1` décide.
- `useId` donne un identifiant unique par instance, indispensable pour les `id` de dégradé.

## 7. Exercice

Ajoute une ligne de repère horizontale, au milieu du graphique, dans `ChartBody.tsx`. Elle doit être fine (1 px), couleur `--color-line`, d'épaisseur constante, et dessinée **sous** l'aire et la courbe. Vérifie-la dans un widget « Calories this week », puis annule avec `git checkout -- apps/web/src/components/widgets/bodies/ChartBody.tsx`.

Indice : un `path` horizontal va de `(0, 50)` à `(100, 50)`, et sa couleur de trait peut être donnée en CSS, par la prop `style`.

<details><summary>Solution</summary>

Juste après `</defs>`, avant le `path` de l'aire :

```tsx
<path d="M 0 50 L 100 50" style={{ stroke: "var(--color-line)" }} strokeWidth="1" vectorEffect="non-scaling-stroke" />
```

- `d="M 0 50 L 100 50"` : du bord gauche au bord droit, à mi-hauteur.
- `style={{ stroke: "var(--color-line)" }}` : la couleur passe par la propriété CSS `stroke`, où une variable CSS est toujours comprise ; le token reste la source de la couleur. (Écrire `var()` directement dans l'attribut `stroke="…"` n'est pas garanti dans tous les navigateurs : passe par `style` ou par une classe.)
- `vectorEffect="non-scaling-stroke"` : 1 px partout, même dans un widget très large.
- Placée avant l'aire et la courbe, elle est dessinée dessous. Pas besoin de `fill="none"` pour une ligne parfaitement horizontale (elle n'a pas de surface), mais l'ajouter ne coûte rien.

</details>
