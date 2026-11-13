# 17. Récapitulatif : un widget de bout en bout

> **Prérequis :** tous les chapitres précédents (celui-ci les relie). **Lecture :** ~20 min. **Fichiers concernés :** tout le système de widgets, `index.css`, `modal.css`, `palette.css`, `widget-grid.css`.

## 1. Le problème

Seize chapitres, seize notions. Chacune a du sens isolément, mais dans l'app elles ne travaillent jamais seules : un simple ajout de widget en mobilise une bonne dizaine, en quelques secondes. Le risque, quand on apprend notion par notion, c'est de savoir ce qu'est un `@starting-style` sans voir **où il intervient** dans ce que tu fais à l'écran.

Ce chapitre suit un seul widget, « Daily calories », depuis le dashboard vide jusqu'au clic sur Save, et nomme à chaque étape la notion à l'œuvre et le chapitre qui l'explique. Il se termine par un tableau qui sert d'index de tout le cours.

## 2. La notion

Il n'y a pas de notion nouvelle ici. L'idée à retenir est une méthode : **devant un effet visuel, se demander qui le produit**.

- Une **règle CSS statique** ? (une couleur, une ombre, une taille)
- Une **transition CSS** ? (un changement d'état adouci : survol, ouverture)
- Une **animation `@keyframes`** ? (une séquence qui joue d'elle-même à l'apparition)
- Une **animation JavaScript** ? (rAF ou WAAPI, quand le CSS ne sait pas faire)
- Un **changement d'état React** qui ajoute ou retire une classe, ou met à jour une variable CSS ?

Presque tout ce qui bouge dans XiaoTrack est une combinaison de ces cinq briques.

## 3. Le parcours, en schéma

```
 Dashboard vide
   │  clic « Add your first widget »            btn-primary, dégradé .................. 04, 06
   ▼
 Mode édition + palette ouverte                 <dialog>, @starting-style ............. 12
   │  guides de la grille apparaissent          ::before, transition d'opacité ........ 10
   │  tuile orange du widget                    --tone, tone-tile, color-mix .......... 01, 02, 04, 05
   │  clic « + »
   ▼
 Badge « Added »                                @keyframes, stroke-dasharray .......... 11
   │
 Widget dans la grille                          --col/--row → grid-column ............. 01, 07
   │  anneau qui s'efface, défilement           is-new, scrollIntoView ................ 12, 16
   │  0 → 1,840                                 requestAnimationFrame ................. 13
   │  chiffre à la taille de la cellule         container query, cqi/cqh .............. 08
   │  drag par la barre de titre
   ▼
 Widget tenu                                    translate + scale, drop-shadow ........ 09, 06
   │  voisins qui font de la place              FLIP, WAAPI ........................... 14
   │  lâcher
   ▼
 Atterrissage avec rebond                       ease-spring, FLIP du widget lâché ..... 10, 14
   │  barre d'édition collée en bas             position: sticky ...................... 07
   │  pastille ambre qui pulse                  @keyframes infinite ................... 11
   │  clic Save
   ▼
 Dashboard enregistré
```

## 4. Dans XiaoTrack

### Étape 1 : le bouton « Add your first widget »

[Dashboard.tsx](../../apps/web/src/pages/Dashboard.tsx) (l. 47) :

```tsx
className="empty-dashboard-cta btn btn-primary btn-lg mt-2"
```

- `.btn` et `.btn-primary` sont des **classes de composant** déclarées dans `@layer components` d'[index.css](../../apps/web/src/assets/css/index.css) (l. 171) : le dégradé de marque et son halo coloré `--shadow-brand`. C'est l'action principale de l'écran, la seule autorisée à porter le dégradé (charte §3). Chapitres 04 et 06.
- Le bouton n'existe qu'en mode bureau : `.btn.empty-dashboard-cta` est masqué par défaut et réaffiché dans `@container grid (min-width: 780px)` ([widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css) l. 490 et 556). Chapitre 08.
- En cliquant, `scale: 0.97` sur `:active` donne l'impression d'un bouton qui s'enfonce, adouci par la transition de `.btn`. Chapitres 09 et 10.

### Étape 2 : la palette s'ouvre

`onStart` passe en mode édition et ouvre la palette, une `<dialog>` placée à droite. [modal.css](../../apps/web/src/components/modals/modal.css) :

```css
/* l. 25-27 */
.modal-right {
    translate: 100% 0;
}
/* l. 54-56, dans @starting-style */
.modal-right[open] {
    translate: 100% 0;
}
```

- Une `<dialog>` passe de « non affichée » à « affichée » : il n'y a pas d'état « avant » à partir duquel animer. `@starting-style` fournit cet état de départ (décalée de toute sa largeur, transparente), et la transition la fait glisser jusqu'à `translate: 0 0`. Le fond (`::backdrop`) passe de transparent à `--color-scrim` avec un léger flou. Chapitre 12.
- Les durées et courbes viennent des tokens `--motion-slow` et `--ease-out-soft`. Chapitre 10.
- En même temps, la grille passe en mode édition (`.is-editing`) : ses guides, un pseudo-élément `::before`, passent de `opacity: 0` à 1 avec une transition ([widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css) l. 530-546). Le dessin des cases est un `linear-gradient` découpé par un `mask-image`. Chapitres 06, 08 et 10.

### Étape 3 : la tuile orange

[catalog.ts](../../apps/web/src/components/widgets/catalog.ts) (l. 10) donne à l'entrée `tone: domainToneMap.nutrition`, c'est-à-dire la chaîne `"var(--color-domain-nutrition)"`. [WidgetPaletteItem.tsx](../../apps/web/src/components/widgets/palette/WidgetPaletteItem.tsx) (l. 24-27) la pose sur la tuile :

```tsx
<span
    className={`palette-item-icon ${isPlaced ? "" : "tone-tile"}`}
    style={tone ? { "--tone": tone } as CSSProperties : undefined}
>
```

Et [index.css](../../apps/web/src/assets/css/index.css) (l. 123-126) fait le reste :

```css
@utility tone-tile {
    background-color: color-mix(in oklch, var(--tone, var(--color-accent)) 13%, white);
    color: var(--tone, var(--color-accent));
}
```

- `--tone` est une **variable CSS** posée en ligne, lue par l'utility avec une valeur de secours (`var(--tone, var(--color-accent))`). Chapitre 01.
- `--color-domain-nutrition` est un **token** déclaré dans `@theme` (l. 51), en `oklch`. Chapitres 03 et 05.
- `color-mix(... 13%, white)` fabrique le fond pâle à partir de la même teinte. Chapitre 05.
- `tone-tile` est une **utility** (`@utility`), donc dans la couche `utilities`, qui l'emporte sur la couche `components` quelle que soit la précision du sélecteur. C'est pour ça qu'on ne l'applique pas à un widget déjà placé : elle écraserait le gris de `.palette-item.is-placed`. Chapitres 02 et 04.
- L'icône elle-même prend la couleur parce que son SVG utilise `stroke="currentColor"`. Chapitre 15.

### Étape 4 : le badge « Added »

Le clic sur « + » (un `.btn-soft`) ajoute l'instance au brouillon. Le widget devient « placé », et le bouton est remplacé par un badge. [palette.css](../../apps/web/src/components/widgets/palette/palette.css) :

```css
/* l. 83 */
animation: added-pop var(--motion-slow) var(--ease-spring);
/* l. 86-89 */
.palette-item-added svg path {
    stroke-dasharray: 24;
    animation: check-draw var(--motion-slow) var(--ease-out-soft) 120ms backwards;
}
```

- `added-pop` part de `opacity: 0; scale: 0.6`, avec la courbe à rebond `--ease-spring` : le badge « saute » en place. Chapitres 10 et 11.
- `check-draw` dessine la coche : le trait est découpé en tirets de 24 unités (`stroke-dasharray`), et décaler ce tiret (`stroke-dashoffset` de 24 à 0) fait apparaître le trait progressivement. Le `120ms backwards` attend que le badge soit apparu, en restant invisible pendant ce délai. Chapitre 11.

### Étape 5 : le widget arrive dans la grille

[WidgetGrid.tsx](../../apps/web/src/components/widgets/WidgetGrid.tsx) (l. 110-117) passe la position en variables CSS :

```tsx
style={{
    "--col": shownWidget.position.x + 1,
    "--row": shownWidget.position.y + 1,
    "--w":   w.size.width,
    "--h":   w.size.height,
    "--enter-delay": `${enterDelay}ms`,
    ...
} as CSSProperties}
```

et [widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css) (l. 562-563) les transforme en placement :

```css
grid-column: var(--col) / span var(--w);
grid-row: var(--row) / span var(--h);
```

- La grille de 12 colonnes, ses cellules carrées en unités `cqi` et ses lignes `grid-auto-rows`. Chapitres 01, 07 et 08.
- La cellule joue son entrée `widget-enter` (l. 32 : légère montée, agrandissement, fondu). Comme la cascade du premier affichage est terminée (`isSettled`), son délai vaut 0. Chapitre 11.
- Elle est montée en mode édition après le premier affichage : `isAddedNow` est vrai, `WidgetGridCell` gèle cette information au montage (`useState(isAddedNow)`) et ajoute `is-new`. Un anneau `::after` s'élargit et s'efface (l. 60-79), et `scrollIntoView` amène la cellule à l'écran si elle est hors champ. Chapitres 12 et 16.
- Les voisins éventuellement tassés par la compaction glissent grâce à FLIP. Chapitre 14.
- Le squelette de chargement (`skeleton-shine`, une animation infinie de `background-position`) existe pour l'état `loading`, mais les données factices de `useWidgetData` répondent tout de suite : tu ne le verras qu'avec une vraie source. Chapitre 11.

### Étape 6 : le compteur et la taille du chiffre

- `StatBody` appelle `useCountUp(1840)` : une boucle `requestAnimationFrame` de 700 ms, avec `easeOutCubic`, formatée par `Intl.NumberFormat` en « 1,840 ». `tabular-nums` empêche le nombre de trembler. Chapitre 13.
- La taille du chiffre suit la cellule ([widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css) l. 213) : `font-size: clamp(var(--text-heading), min(12cqi, 26cqh), 3rem)`. La cellule est un conteneur de taille (`container: cell / size`, l. 28), et `cqi` / `cqh` sont des pourcentages de **sa** largeur et de **sa** hauteur. Un widget 3×2 a un chiffre plus grand qu'un 2×1. Chapitres 03 et 08.

### Étape 7 : le drag

[widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css) (l. 357-368) :

```css
.widget-cell.is-dragging {
    translate: var(--dx) var(--dy);
    scale: 1.03;
    z-index: 10;
    opacity: 0.94;
    filter: drop-shadow(0 16px 28px rgb(var(--shadow-tint) / 0.2)) drop-shadow(0 4px 8px rgb(var(--shadow-tint) / 0.1));
    transition:
        scale var(--motion-fast) var(--ease-out-soft),
        filter var(--motion-fast) var(--ease-out-soft),
        opacity var(--motion-fast) var(--ease-out-soft);
}
```

- `translate` suit le pointeur (React met à jour `--dx` et `--dy` à chaque mouvement). `scale` soulève légèrement le widget. Ce sont deux **propriétés séparées** : seule l'élévation est animée (`transition` sur `scale`, pas sur `translate`), sinon le widget traînerait derrière la souris. Chapitres 09 et 10.
- L'ombre est un `filter: drop-shadow` teinté par `--shadow-tint` : elle suit la forme de toute la cellule. Chapitres 05 et 06.
- Le cadre pointillé `.widget-placeholder` montre où le widget atterrira, avec un fond `color-mix` translucide (l. 377-384). Chapitres 05 et 11.

### Étape 8 : les voisins et l'atterrissage

- Après 300 ms sur la même case (`DRAG_DWELL_MS`), les voisins prennent leur nouvelle place. Leur `grid-column` change d'un coup, mais `useFlipAnimation` les fait glisser en 280 ms. Chapitre 14.
- Au lâcher, le widget change de case et perd son `translate`. FLIP le fait partir de l'endroit où tu l'as lâché, avec la courbe à rebond `SETTLE_EASING` (la même que `--ease-spring`, 420 ms). L'élévation `scale` revient à 1 grâce à la transition de `.widget-cell` (l. 35). Chapitres 09, 10 et 14.

### Étape 9 : la barre d'édition et Save

```css
/* widget-grid.css l. 422-437 (extraits) */
.widget-edit-bar {
    position: sticky;
    bottom: 1rem;
    ...
    background-color: color-mix(in oklch, var(--color-surface) 88%, transparent);
    backdrop-filter: blur(12px);
    animation: edit-bar-in var(--motion-slow) var(--ease-spring);
}
/* l. 468-476 */
.widget-edit-bar-dot.is-dirty {
    background-color: var(--color-warning);
    animation: dot-pulse 1.6s ease-out infinite;
}
```

- `position: sticky; bottom: 1rem` colle la barre en bas de **la zone qui défile**, c'est-à-dire le `<main>` de `MainContent`, et non la fenêtre (la fenêtre ne défile jamais). Chapitre 07.
- Elle arrive avec un rebond (`edit-bar-in`, `--ease-spring`), et son fond semi-transparent flouté laisse deviner la grille dessous. Chapitres 05, 06 et 11.
- Dès qu'il y a une modification, la pastille passe en ambre (`--color-warning`) et pulse : un `box-shadow` qui s'agrandit et s'efface, en boucle infinie. Chapitre 11.
- Save (le seul `.btn-primary` de cet écran) enregistre, quitte le mode édition : les guides s'effacent par leur transition d'opacité, la poignée et le ✕ disparaissent. Chapitres 04 et 10.
- Si le système demande moins d'animations, tout ce parcours se fait sans mouvement, et rien ne casse. Chapitre 16.

## 5. Pièges

- **Chercher dans le mauvais monde.** Un effet qui ne réagit pas à ton CSS est peut-être produit en JavaScript (FLIP, compteur), et inversement.
- **Oublier les couches.** Une règle de `widget-grid.css` qui « ne marche pas » peut être écrasée par une utility Tailwind posée dans le JSX : la couche `utilities` gagne toujours sur `components` (chapitre 02).
- **Confondre `transform` et `translate`.** Le drag utilise `translate`, FLIP utilise `transform` : les mélanger ferait se battre les deux mécanismes (chapitres 09 et 14).
- **Écrire une couleur en dur** au lieu d'un token : elle échappe à la charte et au futur mode sombre (chapitre 05).
- **Ajouter une animation JavaScript sans `prefersReducedMotion()`** (chapitre 16).

## 6. À retenir

- Chaque effet visible est produit par l'une de cinq briques : règle CSS, transition, `@keyframes`, animation JS, ou changement d'état React qui pilote une classe ou une variable CSS.
- React ne dessine rien lui-même : il pose des classes (`is-editing`, `is-dragging`, `is-new`) et des variables (`--col`, `--dx`, `--tone`) ; le CSS fait le rendu.
- Les tokens (`--color-*`, `--motion-*`, `--ease-*`, `--shadow-tint`) relient tout ça à la charte.
- Le JavaScript n'intervient que là où le CSS ne peut pas : animer un nombre, animer un changement de case.

## 7. Exercice de synthèse

Avec le dashboard en mode édition, ajoute le widget « Water intake » depuis la palette, déplace-le, puis enregistre. Pour **chacun** des huit effets suivants, retrouve sans relire ce chapitre : le fichier, le sélecteur ou la fonction responsable, et la brique (règle CSS, transition, `@keyframes`, JS, état React).

1. La tuile orange de « Water intake » dans la palette.
2. La coche qui se dessine dans le badge « Added ».
3. Le petit saut du badge à son apparition.
4. L'anneau indigo autour du widget qui vient d'arriver.
5. Le chiffre qui défile.
6. Le widget soulevé et son ombre pendant le drag.
7. Les voisins qui glissent.
8. La pastille ambre qui pulse.

<details><summary>Solution</summary>

| # | Fichier | Sélecteur ou fonction | Brique |
|---|---|---|---|
| 1 | `index.css`, `WidgetPaletteItem.tsx`, `catalog.ts` | `@utility tone-tile`, `--tone` posé en ligne, `tone: domainToneMap.nutrition` | règle CSS + variable posée par React |
| 2 | `palette.css` | `.palette-item-added svg path`, `@keyframes check-draw` | `@keyframes` |
| 3 | `palette.css` | `.palette-item-added`, `@keyframes added-pop` | `@keyframes` |
| 4 | `widget-grid.css`, `WidgetGridCell.tsx` | `.widget-cell.is-new::after`, `@keyframes widget-ring`, `useState(isAddedNow)` | `@keyframes` + classe posée par React |
| 5 | `useCountUp.ts`, `StatBody.tsx` | `useCountUp`, `requestAnimationFrame` | animation JS |
| 6 | `widget-grid.css` | `.widget-cell.is-dragging` (`translate`, `scale`, `filter`) | règle CSS + transition sur `scale` |
| 7 | `useFlipAnimation.ts` | `cell.animate(...)` dans `useLayoutEffect` | animation JS (WAAPI) |
| 8 | `widget-grid.css`, `WidgetEditBar.tsx` | `.widget-edit-bar-dot.is-dirty`, `@keyframes dot-pulse` | `@keyframes` + classe posée par React |

</details>

## Index du cours : notion → fichier → chapitre

| Notion | Où dans le code | Chapitre |
|---|---|---|
| Variables CSS (`--col`, `--dx`, `--tone`, `var()` et valeur de secours) | `WidgetGrid.tsx`, `ChartBody.tsx`, `widget-grid.css`, `index.css` | 01 |
| Cascade, `@layer` (`base`, `components`, `utilities`), `!important` | `index.css`, `widget-grid.css`, `palette.css`, `modal.css` | 02 |
| Tailwind v4 : `@import`, `@theme`, espaces de noms (`--color-*`, `--text-*`, `--radius-*`, `--shadow-*`, `--ease-*`) | `index.css` | 03 |
| Police Inter auto-hébergée | `main.tsx` | 03 |
| `@utility` (`bg-brand`, `text-brand`, `tone-tile`) et classes de composants (`.btn-*`) | `index.css` | 04 |
| `oklch`, `color-mix`, tokens sémantiques, `--shadow-tint` | `index.css`, `widget-grid.css` | 05 |
| Dégradés, halos du fond, `background-clip: text`, ombres teintées, `drop-shadow`, `ring` | `index.css`, `AppHeader.tsx`, `widget-grid.css` | 06 |
| Layout de l'app : grille `h-dvh`, `minmax(0, 1fr)`, défilement de `<main>`, `position: sticky` | `MainLayout.tsx`, `MainContent.tsx`, `widget-grid.css` | 07 |
| Container queries : `@container`, `cqi`, `cqh` | `widget-grid.css` | 08 |
| `translate`, `scale`, `rotate` contre `transform` | `widget-grid.css`, `modal.css`, `ChartBody` (pastille) | 09 |
| Transitions, `cubic-bezier`, tokens `--motion-*` et `--ease-*` | `index.css`, `.btn`, `widget-grid.css` | 10 |
| `@keyframes`, `fill-mode`, délai en cascade, `infinite`, `stroke-dasharray`, `clip-path` | `widget-grid.css`, `palette.css` | 11 |
| Apparition et disparition : `@starting-style`, `allow-discrete`, sortie différée par minuteur, état ajusté pendant le rendu | `modal.css`, `WidgetGrid.tsx`, `WidgetGridCell.tsx` | 12 |
| `requestAnimationFrame`, `useCountUp`, `tabular-nums` | `useCountUp.ts`, `StatBody.tsx` | 13 |
| FLIP, `useLayoutEffect`, `offsetLeft`, Web Animations API | `useFlipAnimation.ts`, `WidgetGrid.tsx`, `WidgetGridCell.tsx` | 14 |
| SVG : `viewBox`, `path`, `preserveAspectRatio`, `non-scaling-stroke`, dégradés, `useId`, `currentColor`, icônes `?react` | `ChartBody.tsx`, `library.ts`, `vite.config.ts` | 15 |
| `prefers-reduced-motion`, `matchMedia` | `index.css`, `motion.ts` et ses quatre usages | 16 |
