# 07. Le layout de l'app : grid, hauteur d'écran, défilement et sticky

> **Prérequis :** chapitre 01 (variables CSS) et les bases de Tailwind. **Lecture :** ~25 min. **Fichiers concernés :** `MainLayout.tsx`, `MainContent.tsx`, `MainSidebar.tsx`, `WidgetGrid.tsx`, `widget-grid.css`.

## 1. Le problème

Avant la refonte, toute la page défilait : quand tu descendais dans un long dashboard, le header et la sidebar partaient avec le contenu. Et la barre d'édition (Add widget, Cancel, Save) restait tout en bas, hors de vue.

On voulait l'inverse :

- le header et la sidebar **fixes** ;
- **seule** la zone de contenu qui défile ;
- la barre d'édition toujours visible en bas de cette zone, même au milieu d'un long dashboard.

Le « fix de MainContent » du 2026-11-12, c'est exactement ça. Il repose sur quatre notions : la grille CSS, une hauteur d'écran fiable, le contrôle du défilement, et `position: sticky`. Le même chapitre couvre la grille de 12 colonnes des widgets, qui utilise les mêmes outils.

## 2. La notion

### 2.1 CSS Grid

`display: grid` découpe un élément en **pistes** (*tracks*) : des colonnes et des lignes. Les enfants s'y rangent.

```css
.shell {
    display: grid;
    grid-template-columns: 16rem 1fr;     /* 2 colonnes : 16rem fixes, puis tout le reste */
    grid-template-rows: auto 1fr;         /* 2 lignes : la hauteur du contenu, puis tout le reste */
}
```

- `auto` : la piste prend la taille de son contenu.
- `fr` (*fraction*) : une part de l'espace **restant**. `1fr 2fr` partage le reste en 1/3 et 2/3.
- Sans indication, les enfants se placent dans l'ordre, case par case, ligne par ligne (*placement automatique*).
- On peut aussi placer un enfant précisément : `grid-column: 3 / span 4` veut dire « commence à la ligne de grille n° 3 et occupe 4 colonnes ». Les **lignes de grille** sont les traits entre les colonnes, numérotés à partir de **1**.

### 2.2 `1fr` n'est pas « le reste, point »

Piège classique : `1fr` est en réalité `minmax(auto, 1fr)`. `minmax(min, max)` donne une taille minimale et maximale à la piste. Le minimum `auto` veut dire « jamais plus petite que son contenu ».

Donc si le contenu de la ligne fait 3000px de haut, la ligne `1fr` fait 3000px, même si l'écran en fait 800. La page déborde au lieu de laisser le contenu défiler.

`minmax(0, 1fr)` corrige ça : la piste peut descendre jusqu'à 0, elle prend donc exactement le reste de l'espace, et c'est le contenu qui devra défiler.

### 2.3 Le même piège côté enfant : `min-height: auto`

Les enfants d'une grille (ou d'un flex) ont par défaut `min-height: auto` : ils refusent aussi d'être plus petits que leur contenu. C'est même cette taille minimale de l'enfant que la piste `1fr` du §2.2 « respecte ».

`min-height: 0` (en Tailwind : `min-h-0`) supprime ce minimum : l'enfant accepte de rester à la taille de sa piste, et ce qui dépasse pourra défiler **à l'intérieur**.

Nuance importante, vérifiée dans le navigateur : un élément qui défile lui-même (`overflow: auto`, `hidden` ou `scroll`) a déjà un minimum automatique de 0. Le piège ne mord donc que lorsque l'enfant de la grille **ne défile pas lui-même** et que c'est un de ses descendants qui doit défiler (le cas le plus courant dès qu'on emboîte des flex). Dans ce cas, il faut `minmax(0, 1fr)` sur la piste **ou** `min-h-0` sur l'enfant : l'un des deux suffit.

```
sans min-h-0 :                avec min-h-0 + overflow-y-auto :
┌────────── piste ─┐          ┌────────── piste ─┐
│ main             │          │ main          ▲  │
│ (3000px,         │          │ (600px,       █  │  ← barre de défilement
│  déborde)        │          │  défile)      ▼  │
└──────────────────┘          └──────────────────┘
  │ ...débordement │
```

### 2.4 Une hauteur d'écran fiable : `dvh`

- `100vh` = 100 % de la hauteur de la fenêtre… sauf sur mobile, où les navigateurs comptent la hauteur **sans** leurs barres d'adresse. Résultat : le bas de la page est caché sous la barre.
- `100dvh` (*dynamic viewport height*) suit la hauteur réellement visible, barres comprises, et s'ajuste quand elles apparaissent ou disparaissent.
- En Tailwind : `h-screen` = `100vh`, `h-dvh` = `100dvh`.

### 2.5 Le défilement : `overflow`

- `overflow: hidden` : ce qui dépasse est coupé, rien ne défile.
- `overflow-y: auto` : une barre de défilement verticale apparaît **si** le contenu dépasse.

Un élément défile seulement s'il a une **hauteur limitée** et un contenu plus grand. D'où l'importance du §2.2 et du §2.3.

### 2.6 `position: sticky`

Un élément `sticky` se comporte normalement… jusqu'à ce qu'il atteigne un bord de son **conteneur de défilement** (le plus proche ancêtre qui défile). Là, il s'y colle.

```css
.bar { position: sticky; bottom: 1rem; }   /* reste collé à 1rem du bas de la zone qui défile */
```

Deux règles à connaître :

1. Il colle au **plus proche ancêtre qui défile**, pas forcément à la fenêtre.
2. Il ne sort jamais de son **parent direct** : quand le parent est entièrement passé, l'élément part avec lui.

### 2.7 `z-index` : qui est dessus

Quand des éléments se chevauchent, `z-index` décide de l'ordre d'empilement : le plus grand est dessus. Il ne marche que sur des éléments positionnés (`relative`, `absolute`, `sticky`…) **ou** sur des enfants de grille/flex. Et il ne compare que des éléments d'un même **contexte d'empilement** (un parent avec `z-index`, `opacity < 1`, `transform`, `filter`… en crée un nouveau).

## 3. Exemple minimal

```html
<style>
  body { margin: 0; font-family: sans-serif; }
  .shell { display: grid; height: 100dvh; overflow: hidden;
           grid-template-columns: 10rem 1fr; grid-template-rows: auto minmax(0, 1fr); }
  header { grid-column: 1 / span 2; padding: 16px; background: #eef; }
  aside  { background: #f6f6fb; padding: 16px; }
  /* main ne défile pas lui-même : c'est .scroller, son enfant, qui défile */
  main   { display: flex; flex-direction: column; }
  .scroller { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; }
  .long  { height: 2000px; background: linear-gradient(#fff, #ddf); }
  .bar   { position: sticky; bottom: 16px; width: fit-content; margin: 0 auto;
           padding: 8px 16px; border-radius: 999px; background: #333; color: white; }
</style>
<div class="shell">
  <header>Header</header>
  <aside>Sidebar</aside>
  <main><div class="scroller"><div class="long">Contenu très long</div><div class="bar">Barre collante</div></div></main>
</div>
```

À observer : seule la zone de contenu défile ; la barre reste collée en bas de cette zone. Puis, dans `.shell`, remplace `minmax(0, 1fr)` par `1fr` : ça marche encore ? Ajoute maintenant `min-height: 0` à `main` et remets `1fr`… et enfin retire les deux : le contenu est coupé et plus rien ne défile. Un seul des deux réglages suffit, aucun ne suffit pas.

## 4. Dans XiaoTrack

### 4.1 La coque de l'app

[MainLayout.tsx](../../apps/web/src/layout/MainLayout.tsx), l. 17 à 22 :

```tsx
        <div className='grid h-dvh overflow-hidden grid-rows-[auto_auto_auto_minmax(0,1fr)] md:grid-cols-[16rem_1fr] md:grid-rows-[auto_minmax(0,1fr)]'>
            <AppHeader />
            <MainHeader />
            <MainSidebar></MainSidebar>
            <MainContent></MainContent>
        </div>
```

- `h-dvh overflow-hidden` : la coque fait exactement la hauteur visible de l'écran et ne défile **jamais**.
- **À partir de `md`** (768px de large), `md:grid-cols-[16rem_1fr]` et `md:grid-rows-[auto_minmax(0,1fr)]` dessinent 2 colonnes × 2 lignes. Les quatre enfants se placent automatiquement :

```
┌──────────────┬──────────────────────────────┐
│ AppHeader    │ MainHeader                   │  ← ligne auto (64px, leur hauteur)
├──────────────┼──────────────────────────────┤
│ MainSidebar  │ MainContent                  │  ← ligne minmax(0, 1fr) : tout le reste
│  (16rem)     │  (1fr)          défile ici ▲ │
└──────────────┴──────────────────────────────┘
```

- **Sous `md`**, il n'y a qu'une colonne et `grid-rows-[auto_auto_auto_minmax(0,1fr)]` : les quatre blocs s'empilent, les trois premiers à leur hauteur, le contenu prend le reste.
- La syntaxe `grid-rows-[...]` est une valeur arbitraire de Tailwind : les `_` remplacent les espaces.

### 4.2 La zone qui défile

[MainContent.tsx](../../apps/web/src/layout/MainContent/MainContent.tsx), l. 6 :

```tsx
        <main className="@container/content grid min-h-0 content-start overflow-y-auto">
```

- `overflow-y-auto` : c'est **lui**, et seulement lui, qui défile.
- `min-h-0` : la protection du §2.3. Ici, honnêtement, elle fait double emploi : `<main>` défile lui-même (son minimum automatique vaut déjà 0) et sa piste est déjà en `minmax(0, 1fr)`. Elle reste utile comme ceinture de sécurité : si un jour on déplace le défilement dans un enfant de `<main>`, elle évitera le piège sans qu'on y pense.
- `grid content-start` : `<main>` est lui-même une grille d'un seul enfant (la page), alignée en haut (`align-content: start`) au lieu d'être étirée.
- `@container/content` en fait un conteneur nommé pour les container queries (chapitre 08).

Le dashboard, dedans, prend au moins toute la hauteur ([Dashboard.tsx](../../apps/web/src/pages/Dashboard.tsx), l. 135 : `<div className="min-h-full w-full">`).

### 4.3 La sidebar

[MainSidebar.tsx](../../apps/web/src/layout/Sidebar/MainSidebar.tsx), l. 9 :

```tsx
        <aside className="flex min-h-0 flex-col border-b border-line bg-surface px-3 pt-5 pb-3 md:overflow-y-auto md:border-r md:border-b-0">
```

Même recette : `min-h-0` + `md:overflow-y-auto`. Si un jour le menu a trente entrées, la sidebar défilera indépendamment du contenu. En dessous de `md`, la bordure passe du bord droit au bord bas, puisque les blocs sont empilés.

### 4.4 La barre d'édition collante

[widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), l. 422 à 430 :

```css
    .widget-edit-bar {
        position: sticky;
        bottom: 1rem;
        z-index: 20;
        display: none;
        align-items: center;
        gap: 0.25rem;
        width: fit-content;
        margin: 1.25rem auto 0;
```

- `position: sticky; bottom: 1rem` : elle colle à 1rem du bas du **plus proche ancêtre qui défile**, c'est-à-dire `<main>`. C'est pour ça que le fix de MainContent était indispensable : quand c'était la fenêtre qui défilait, la barre pouvait coller à la fenêtre, mais le header et la sidebar partaient avec le contenu.
- Elle ne sort pas de son parent, `.widget-grid-frame` ([WidgetGrid.tsx](../../apps/web/src/components/widgets/WidgetGrid.tsx), l. 88 et l. 136, où `{footer}` est rendu juste après la grille). Comme ce parent contient toute la grille, la barre reste visible tant qu'on est dans le dashboard.
- `width: fit-content; margin: ... auto` : elle prend la largeur de ses boutons et se centre.
- `z-index: 20` : au-dessus des widgets (1) et du widget tenu (10).
- `display: none` ici, `display: flex` en mode bureau seulement (l. 552 à 554) : pas d'édition sur téléphone.

### 4.5 La grille de 12 colonnes des widgets

Le composant fournit le nombre de colonnes en variable ([WidgetGrid.tsx](../../apps/web/src/components/widgets/WidgetGrid.tsx), l. 95) :

```tsx
                            style={{"--cols": GRID_COLS} as CSSProperties}
```

Puis chaque cellule reçoit sa position et sa taille (l. 110 à 114) :

```tsx
                                    style={{
                                        "--col": shownWidget.position.x + 1,
                                        "--row": shownWidget.position.y + 1,
                                        "--w":   w.size.width,
                                        "--h":   w.size.height,
```

Le `+ 1` est là parce que les positions du moteur commencent à 0, alors que les lignes de grille CSS commencent à 1.

Le CSS, en mode téléphone (par défaut), [widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), l. 9 à 19 :

```css
    .widget-grid {
        --gap: 0.6cqi;
        /* One column (= one row, the cells are square), in desktop mode */
        --col-w: calc((100cqi - (var(--cols) - 1) * var(--gap)) / var(--cols));
        /* positioned: the cells' offsetLeft / offsetTop (FLIP) and the guides are relative to the grid */
        position: relative;
        display: grid;
        grid-template-columns: 1fr;
        grid-auto-rows: 110px;
        gap: 12px;
    }
```

- `--col-w` calcule la largeur d'une colonne : la largeur totale (`100cqi`, chapitre 08) moins les 11 espaces entre 12 colonnes, divisée par 12.
- En mode téléphone : une seule colonne, des lignes de 110px, et chaque cellule occupe `span var(--h)` lignes (l. 24). Les cellules suivent l'ordre du DOM, que `WidgetGrid` trie en ordre de lecture.
- `position: relative` : la grille sert de repère au `::before` des guides (chapitre 06) et aux mesures de FLIP (chapitre 14).

En mode bureau, l. 514 à 519 puis 560 à 564 :

```css
    @container grid (min-width: 780px) {
        .widget-grid {
            grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
            grid-auto-rows: var(--col-w);
            gap: var(--gap);
        }
        ...
        .widget-cell,
        .widget-placeholder {
            grid-column: var(--col) / span var(--w);
            grid-row: var(--row) / span var(--h);
        }
```

- `repeat(12, minmax(0, 1fr))` : 12 colonnes égales. `minmax(0, ...)` pour la même raison qu'au §2.2 : un long titre ne doit pas élargir sa colonne.
- `grid-auto-rows: var(--col-w)` : chaque ligne est aussi haute qu'une colonne est large. Les cases sont **carrées**, et un widget 2×1 a toujours les mêmes proportions, quelle que soit la largeur de l'écran.
- `grid-column: var(--col) / span var(--w)` : « commence à la ligne `--col` et occupe `--w` colonnes ». Pareil pour les lignes. **C'est la grille qui place les widgets**, le composant ne fait que fournir quatre nombres.
- Deux cellules peuvent donc, en théorie, occuper la même case : c'est le moteur de layout (TypeScript) qui garantit qu'il n'y a pas de chevauchement, pas le CSS.

En mode édition (l. 522 à 525), la grille garde de la place pour au moins trois lignes et ajoute une ligne vide en bas, pour pouvoir y déposer un widget :

```css
        .widget-grid.is-editing {
            min-height: calc(3 * (var(--col-w) + var(--gap)));
            padding-bottom: calc(var(--col-w) + var(--gap));
        }
```

### 4.6 L'empilement dans la grille

[widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), l. 21 à 25 :

```css
    /* Stacking order inside the grid: guides / placeholder (0) < widgets (1) < held widget (10).
       Grid items accept z-index without position. */
    .widget-cell {
        grid-row: span var(--h);
        z-index: 1;
```

Le placeholder pointillé (`z-index: 0`, l. 378) passe sous les widgets ; le widget tenu (`z-index: 10`, l. 360) passe au-dessus de tous.

### 4.7 Le défaut connu sous `md`

Honnêtement : en dessous de 768px, la coque est toujours `h-dvh overflow-hidden`, mais les quatre blocs s'empilent. Le logo (64px), le header (64px) et la sidebar complète (six entrées, environ 280px) prennent plus de la moitié de la hauteur d'un téléphone. Le dashboard défile dans ce qui reste. Le fix est juste en bureau et dégrade le mobile. La solution relève de la conception (un tiroir pour la sidebar, ou une barre d'onglets en bas), pas d'une ligne de CSS.

## 5. Pièges

- **`1fr` sans `min-h-0`, quand le défilement est dans un descendant** : la ligne grandit avec son contenu et rien ne défile. L'un des deux réglages suffit ; dans le doute, mets les deux.
- **`h-screen` sur mobile** : le bas de l'app passe sous la barre du navigateur. Préfère `h-dvh`.
- **Un `sticky` qui ne colle pas** : soit son ancêtre qui défile n'est pas celui que tu crois, soit son parent direct est aussi petit que lui (il n'a pas de place pour « coller »), soit un ancêtre a `overflow: hidden` et devient le conteneur de défilement à sa place.
- **Un `z-index` qui « ne marche pas »** : l'élément n'est pas positionné (et n'est pas un enfant de grille/flex), ou il est enfermé dans un contexte d'empilement créé par un parent (`opacity`, `transform`, `filter`…).
- **Mettre des utilitaires de grille Tailwind sur `.widget-grid` ou `.widget-cell`** : la couche `utilities` gagne sur `components` (chapitre 02) et écraserait les règles de `widget-grid.css`.

## 6. À retenir

- La coque fait `h-dvh` et ne défile pas ; seul `<main>` défile (`overflow-y-auto`), dans une piste `minmax(0, 1fr)`.
- `1fr` vaut `minmax(auto, 1fr)` : il ne descend pas sous la taille minimale de son contenu. `min-h-0` ou `minmax(0, 1fr)` lèvent ce minimum.
- `sticky` colle au plus proche ancêtre qui défile et ne sort pas de son parent.
- Les widgets sont placés par la grille : `grid-column: var(--col) / span var(--w)`, avec des lignes aussi hautes que les colonnes sont larges.

## 7. Exercice

Ouvre le dashboard en mode édition avec assez de widgets pour qu'il défile (ou réduis la hauteur de la fenêtre). Dans les DevTools, sélectionne `<main>`.

1. Décoche la classe `overflow-y-auto`. Essaie de faire défiler, et cherche la barre d'édition.
2. Recoche-la. Sélectionne maintenant la `<div>` racine de `MainLayout` (la grille `h-dvh`) et décoche `overflow-hidden`. Fais défiler : qui défile, maintenant ?

<details><summary>Solution</summary>

1. Plus rien ne défile. `<main>` n'est plus un conteneur de défilement : il grandit avec le dashboard et dépasse de sa piste, mais la coque est en `overflow-hidden`, donc le bas est coupé. La barre d'édition, qui cherche un ancêtre qui défile pour coller, n'en trouve plus : elle est quelque part sous le bord de l'écran.
2. Rien ne change en apparence : `<main>` défile toujours tout seul, la coque n'a jamais rien à couper. `overflow-hidden` sur la coque est une sécurité : si un enfant dépasse par erreur, c'est lui qui est coupé, pas la fenêtre entière qui se met à défiler (et emporte le header avec elle).

Recharge la page pour annuler.
</details>
