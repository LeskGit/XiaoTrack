# 11. Les animations @keyframes

> **Prérequis :** chapitres 01 (variables CSS), 09 (transformations) et 10 (transitions). **Lecture :** ~20 min. **Fichiers concernés :** `widget-grid.css`, `palette.css`, `widget-grid.constants.ts`, `WidgetGrid.tsx`, `WidgetToolbar.tsx`.

## 1. Le problème

Une transition (chapitre 10) a besoin d'un **changement** pour jouer : une valeur A devient une valeur B. Or plusieurs effets de l'app n'ont pas de changement à animer :

- un widget qui **apparaît** : avant, il n'existait pas. Il n'y a pas d'état A ;
- le reflet qui défile sur un widget en chargement : il doit tourner **en boucle**, sans que rien ne change ;
- la pastille ambre « Unsaved changes » qui pulse indéfiniment ;
- des widgets qui entrent **l'un après l'autre**, chacun avec son propre délai.

Il faut pouvoir décrire une animation **complète, autonome**, qui démarre toute seule dès que l'élément est affiché. C'est le rôle de `@keyframes` et de la propriété `animation`.

## 2. La notion

### Deux morceaux : le scénario et le lecteur

1. **`@keyframes nom { ... }`** décrit le **scénario** : les étapes clés (*keyframes*) de l'animation, et les valeurs à chaque étape.
2. **`animation: nom durée courbe ...`** sur un élément dit : « joue ce scénario, avec ces réglages ».

```css
@keyframes grow {              /* le scénario */
    from { scale: 0.5; opacity: 0; }   /* étape 0 % */
    to   { scale: 1;   opacity: 1; }   /* étape 100 % */
}

.box {
    animation: grow 400ms ease-out;    /* le lecteur */
}
```

Le navigateur calcule les valeurs intermédiaires entre les étapes, comme une transition.

### Les étapes

- `from` = `0%`, `to` = `100%`.
- On peut mettre autant de pourcentages que voulu : `0%`, `30%`, `50%`, `100%`…
- **Une étape absente prend la valeur actuelle de l'élément.** C'est très pratique :

```css
@keyframes widget-enter {
    from { opacity: 0; translate: 0 10px; scale: 0.96; }
    /* pas de "to" : l'arrivée = les valeurs normales de l'élément */
}
```

Écrire seulement `from` signifie : « pars de là, et reviens à ton état normal ». On ne répète pas l'état final, et si l'état normal change un jour, l'animation suit. Inversement, `to` seul signifie « pars de ton état normal et va jusque-là » (utilisé pour les sorties). Et `50%` seul (sans `from` ni `to`) fait un aller-retour : état normal → valeur à 50 % → état normal.

### La propriété `animation`

C'est un raccourci qui regroupe plusieurs propriétés :

| Propriété | Rôle | Exemple |
|---|---|---|
| `animation-name` | quel `@keyframes` | `widget-enter` |
| `animation-duration` | durée d'un tour | `400ms` |
| `animation-timing-function` | la courbe (chapitre 10) | `var(--ease-out-soft)` |
| `animation-delay` | attente avant de démarrer | `120ms` |
| `animation-iteration-count` | nombre de tours | `1` (défaut), `3`, `infinite` |
| `animation-direction` | sens de lecture | `normal`, `reverse`, `alternate` (aller-retour) |
| `animation-fill-mode` | que montrer **avant** et **après** l'animation | `none`, `backwards`, `forwards`, `both` |

```css
animation: widget-ring 1.4s var(--ease-out-soft) 200ms backwards;
/*         nom         durée courbe              délai fill-mode */
```

Le navigateur reconnaît chaque morceau à sa forme. Seule règle : la **première** durée est la durée, la **seconde** est le délai.

### `animation-fill-mode` : la propriété qui piège tout le monde

Par défaut (`none`), les valeurs du `@keyframes` ne s'appliquent **que pendant** que l'animation joue. Avant (pendant le délai) et après, l'élément a son style normal.

```
                 délai          animation          après
 none      : [ style normal ][ keyframes jouées ][ style normal ]
 backwards : [ 1re étape    ][ keyframes jouées ][ style normal ]
 forwards  : [ style normal ][ keyframes jouées ][ dernière étape, figée ]
 both      : [ 1re étape    ][ keyframes jouées ][ dernière étape, figée ]
```

- **`backwards`** : pendant le délai, l'élément est déjà dans l'état de départ. Sans ça, un widget avec 200ms de délai serait d'abord affiché normalement, puis **disparaîtrait** pour rejouer son entrée : un clignotement.
- **`forwards`** : à la fin, l'élément **reste** dans l'état final de l'animation. Utile pour une sortie : le widget doit rester invisible une fois l'animation finie.
- **`both`** : les deux.

Attention à `forwards` : une animation figée **continue de gagner** sur les autres règles CSS pour les propriétés qu'elle touche. Si l'animation finit sur `scale: 1`, plus aucune règle ne peut changer `scale` sur cet élément.

## 3. Exemple minimal

```html
<style>
  .box { width: 60px; height: 60px; background: indigo; margin: 8px; display: inline-block; }
  @keyframes enter { from { opacity: 0; translate: 0 20px; } }
  @keyframes pulse { 50% { scale: 1.2; } }
  .a { animation: enter 600ms ease-out 1s; }            /* sans fill-mode */
  .b { animation: enter 600ms ease-out 1s backwards; }  /* avec backwards */
  .c { animation: pulse 1s ease-in-out infinite; }      /* boucle */
</style>
<div class="box a"></div><div class="box b"></div><div class="box c"></div>
```

Recharge la page et regarde la première seconde. A s'affiche, **disparaît**, puis entre : c'est le clignotement. B reste invisible pendant le délai, puis entre proprement. C pulse sans fin.

## 4. Dans XiaoTrack

### 4.1 L'entrée des widgets, et pourquoi `backwards` (pas `both`)

[widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), l. 23 à 44 :

```css
.widget-cell {
    ...
    /* Entrance: cascade on first display, pop-in for a widget added later.
       fill-mode backwards (not both): once over, the animation must not hold translate / scale,
       the drag needs them. */
    animation: widget-enter var(--motion-slow) var(--ease-out-soft) backwards;
    animation-delay: var(--enter-delay, 0ms);
    ...
}

@keyframes widget-enter {
    from {
        opacity: 0;
        translate: 0 10px;
        scale: 0.96;
    }
}
```

- Le scénario `widget-enter` n'a qu'un `from` : le widget part transparent, 10px plus bas, 4 % plus petit, et revient à son état normal.
- `backwards` : pendant son délai de cascade, le widget est déjà invisible. Pas de clignotement.
- **Pourquoi pas `both` ?** Avec `both` (ou `forwards`), l'animation finie resterait **figée** sur son état final, `translate: 0 0` et `scale: 1`. Elle gagnerait alors sur toute autre règle touchant `translate` et `scale`. Or le drag pose justement `translate: var(--dx) var(--dy)` et `scale: 1.03` sur `.widget-cell.is-dragging` (voir chapitre 09) : le widget tenu ne suivrait plus la souris et ne se soulèverait plus. Avec `backwards`, une fois l'entrée finie, l'animation lâche complètement l'élément.

### 4.2 La cascade : un délai calculé par variable

`animation-delay: var(--enter-delay, 0ms)` lit une variable CSS (chapitre 01), avec `0ms` comme valeur de secours. Cette variable est calculée par React, différente pour chaque cellule. [WidgetGrid.tsx](../../apps/web/src/components/widgets/WidgetGrid.tsx), l. 103 et 115 :

```tsx
const enterDelay: number = isSettled ? 0 : Math.min(index * WIDGET_ENTRANCE_STEP_MS, WIDGET_ENTRANCE_MAX_DELAY_MS);
```
```tsx
"--enter-delay": `${enterDelay}ms`,
```

- `index` = rang du widget dans l'ordre de lecture. Le 1er attend 0ms, le 2e 40ms, le 3e 80ms… : ils entrent l'un après l'autre.
- `Math.min(…, 360)` : un plafond. Avec 30 widgets, le dernier n'attendra pas 1,2 seconde.
- `isSettled` : passe à `true` après `WIDGET_ENTRANCE_MS` (l. 44 à 48). Ensuite, le délai vaut toujours 0 : un widget ajouté plus tard apparaît tout de suite.

Ces durées sont des constantes TypeScript, dans [widget-grid.constants.ts](../../apps/web/src/components/widgets/widget-grid.constants.ts), l. 10 à 17 :

```ts
// Animations (cadrage V2 §7). Keep in sync with the durations written in widget-grid.css.
// Exit animation of a removed widget: it leaves the draft once the animation is over
export const WIDGET_EXIT_MS: number = 200;
// Length of the cascade on first display: widgets added after it pop in without delay
export const WIDGET_ENTRANCE_MS: number = 700;
// Delay between two widgets of the cascade, and its cap (a long dashboard does not wait forever)
export const WIDGET_ENTRANCE_STEP_MS: number = 40;
export const WIDGET_ENTRANCE_MAX_DELAY_MS: number = 360;
```

Elles vivent en TS parce que React en a besoin pour ses calculs et ses minuteurs. Le commentaire rappelle le prix : le CSS ne peut pas lire une constante TS, donc une durée écrite des deux côtés doit être tenue à jour à la main.

### 4.3 La sortie : `forwards`

L. 46 à 57 :

```css
/* Removed: shrinks and fades, then leaves the draft (WIDGET_EXIT_MS = 200ms) */
.widget-cell.is-exiting {
    animation: widget-exit 200ms ease-in forwards;
    pointer-events: none;
}

@keyframes widget-exit {
    to {
        opacity: 0;
        scale: 0.9;
    }
}
```

- Ajouter la classe `is-exiting` remplace l'animation d'entrée par celle de sortie (même propriété `animation`, la règle plus spécifique gagne) : elle démarre aussitôt.
- `to` seul : depuis l'état normal, vers invisible et plus petit.
- `ease-in` : une sortie accélère en partant (chapitre 10).
- `forwards` : une fois finie, la cellule **reste** invisible jusqu'à ce que React la retire du DOM. Sans ça, elle réapparaîtrait une fraction de seconde. Ici, figer `scale` ne pose pas de problème : le widget va disparaître.
- `200ms` est écrit en dur, synchronisé avec `WIDGET_EXIT_MS` (voir chapitre 12 pour la partie React).
- `pointer-events: none` : on ne peut plus cliquer sur un widget en train de partir.

### 4.4 L'anneau du widget ajouté

L. 60 à 79 :

```css
.widget-cell.is-new::after {
    content: "";
    position: absolute;
    inset: -4px;
    border-radius: calc(var(--radius-lg) + 4px);
    pointer-events: none;
    animation: widget-ring 1.4s var(--ease-out-soft) 200ms backwards;
    opacity: 0;
}

@keyframes widget-ring {
    from { opacity: 1; box-shadow: 0 0 0 3px var(--color-accent-line); }
    to   { opacity: 0; box-shadow: 0 0 0 10px var(--color-accent-soft); }
}
```

- Un pseudo-élément `::after`, 4px plus grand que la cellule (`inset: -4px`), dessine un anneau qui s'élargit (de 3 à 10px) en s'effaçant.
- `opacity: 0` sur la règle : l'état normal est invisible. Avec `backwards`, l'anneau est visible pendant les 200ms de délai, puis s'efface. Une fois l'animation finie, c'est `opacity: 0` qui reprend la main : l'anneau a disparu pour de bon.

### 4.5 Les boucles infinies

**Le reflet du chargement**, l. 313 à 329 :

```css
.widget-skeleton-bar {
    ...
    background: linear-gradient(90deg, var(--color-canvas) 25%, var(--color-line) 50%, var(--color-canvas) 75%);
    background-size: 200% 100%;
    animation: skeleton-shine 1.4s linear infinite;
}

@keyframes skeleton-shine {
    from { background-position: 100% 0; }
    to { background-position: -100% 0; }
}
```

Le dégradé (chapitre 06) fait deux fois la largeur de la barre (`background-size: 200%`), avec une bande claire au milieu. L'animation fait glisser le fond de droite à gauche. `linear` (vitesse constante) et `infinite` : un reflet qui défile sans fin, sans à-coup.

**La pastille « Unsaved changes »**, l. 468 à 476 :

```css
.widget-edit-bar-dot.is-dirty {
    background-color: var(--color-warning);
    animation: dot-pulse 1.6s ease-out infinite;
}

@keyframes dot-pulse {
    from { box-shadow: 0 0 0 0 color-mix(in oklch, var(--color-warning) 50%, transparent); }
    to { box-shadow: 0 0 0 8px transparent; }
}
```

Une ombre sans flou (`0 0 0 Npx`) dessine un anneau autour de la pastille ; il grandit jusqu'à 8px en devenant transparent, puis recommence. C'est l'effet « onde ».

**La tuile « + » de l'écran vide**, l. 500 à 510 :

```css
.empty-dashboard-art > :last-child {
    animation: empty-breathe 2.4s ease-in-out infinite;
}

@keyframes empty-breathe {
    50% {
        scale: 1.04;
        border-color: var(--color-accent);
    }
}
```

Seule l'étape `50%` est écrite : l'élément part de son état normal, grossit de 4 % en fonçant sa bordure à mi-parcours, puis revient. `ease-in-out` (lent au début et à la fin) donne l'effet d'une respiration.

### 4.6 « Dessiner » une coche : `stroke-dasharray`

[palette.css](../../apps/web/src/components/widgets/palette/palette.css), l. 86 à 102 :

```css
.palette-item-added svg path {
    stroke-dasharray: 24;
    animation: check-draw var(--motion-slow) var(--ease-out-soft) 120ms backwards;
}

@keyframes check-draw {
    from {
        stroke-dashoffset: 24;
    }
}
```

La coche ✓ du badge « Added » est un trait SVG (`path`). Deux propriétés propres aux traits SVG :

- `stroke-dasharray: 24` transforme le trait en pointillés : 24 unités dessinées, 24 unités vides, etc. Comme la coche fait moins de 24 unités de long, elle tient entière dans **un seul** tiret.
- `stroke-dashoffset` décale le motif de pointillés le long du trait. À `24`, c'est le vide qui est posé sur la coche : elle est invisible. À `0` (sa valeur normale), c'est le tiret plein : elle est entière.

Animer `stroke-dashoffset` de 24 à 0 fait glisser le tiret plein sur le trait : la coche **se dessine** sous tes yeux. Le délai de 120ms la fait commencer juste après le « pop » du badge (`added-pop`, l. 91, avec `--ease-spring`).

### 4.7 Révéler une courbe : `clip-path: inset()`

[widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), l. 260 à 277 :

```css
.chart-body-plot {
    ...
    /* Drawn from left to right on first display */
    animation: chart-reveal 900ms var(--ease-out-soft) 150ms backwards;
}

/* Negative insets: the last point's dot sits on the edge and must not be cut */
@keyframes chart-reveal {
    from {
        clip-path: inset(-8px 100% -8px -8px);
    }
    to {
        clip-path: inset(-8px -8px -8px -8px);
    }
}
```

`clip-path` découpe l'élément : seule la partie à l'intérieur de la forme reste visible. `inset(haut droite bas gauche)` décrit un rectangle en retrait des bords :
- au départ, `100%` de retrait à droite : la zone visible a une largeur nulle, tout est caché ;
- à l'arrivée, `0` partout (ici `-8px`) : tout est visible.

Le rectangle visible s'élargit de gauche à droite : la courbe semble se tracer. Les `-8px` élargissent la zone de 8px au-delà des bords, pour ne pas couper le point rond au bout de la courbe, qui dépasse du cadre.

### 4.8 Rejouer une animation en changeant la `key` React

Une animation `@keyframes` ne joue qu'**une fois**, quand l'élément apparaît (ou quand la propriété `animation` change). Comment la rejouer quand le contenu change ? [WidgetToolbar.tsx](../../apps/web/src/components/widgets/WidgetToolbar.tsx), l. 16 à 25 :

```tsx
{isEditing ? (
    <p key="hint" className="widget-toolbar-hint">
        Drag a widget by its title bar to move it. The others make room.
    </p>
) : (
    <button key="edit" type="button" className="btn btn-secondary" onClick={onEdit}>
        ...
    </button>
)}
```

Et dans [widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), l. 404 à 406 :

```css
.widget-toolbar > * {
    animation: fade-in var(--motion-base) var(--ease-out-soft);
}
```

Chaque enfant direct de la barre joue `fade-in` à son apparition. Les deux branches ont une `key` différente (`"hint"` et `"edit"`) : pour React, ce sont deux éléments distincts. Quand `isEditing` change, React **détruit** l'un et **crée** l'autre dans le DOM ; le nouvel élément apparaît, donc son animation joue. Sans `key` distinctes, React pourrait réutiliser le même nœud du DOM, et l'animation ne se rejouerait pas.

C'est une technique générale : changer la `key` d'un élément force React à le recréer, ce qui rejoue ses animations d'entrée.

## 5. Pièges

- **Oublier `backwards` avec un délai** : l'élément s'affiche, disparaît, puis entre (le clignotement de l'exemple minimal).
- **Utiliser `forwards` ou `both` par réflexe** : l'animation fige ses propriétés et gagne ensuite contre toutes tes autres règles. C'est exactement ce qui aurait cassé le drag (§4.1).
- **Deux animations sur la même propriété `animation`** : la seconde règle remplace la première (cascade normale). Pour en jouer deux à la fois, il faut les lister séparées par une virgule.
- **Croire qu'une animation se rejoue toute seule** : elle ne joue qu'à l'apparition de l'élément ou quand la valeur de `animation` change. Pour la rejouer, recréer l'élément (`key` React) ou changer le nom de l'animation.
- **Durée écrite à deux endroits** (CSS et TS) : elles divergent un jour. Ici, `WIDGET_EXIT_MS` et le `200ms` de `widget-exit` doivent rester égaux.
- **Les animations infinies coûtent** : elles redessinent sans arrêt. On les garde petites (une pastille, une barre). Et elles sont coupées quand le système demande moins d'animations (chapitre 16).

## 6. À retenir

- `@keyframes` décrit un scénario, `animation` le joue sur un élément ; il démarre tout seul à l'apparition.
- Une étape absente vaut l'état normal de l'élément : `from` seul = « entre », `to` seul = « sors », `50%` seul = « aller-retour ».
- `backwards` évite le clignotement pendant un délai ; `forwards` fige l'état final, utile pour une sortie, dangereux ailleurs.
- `.widget-cell` utilise `backwards` et pas `both` pour ne pas bloquer `translate` et `scale`, dont le drag a besoin.
- Changer la `key` React recrée l'élément et rejoue son animation d'entrée.

## 7. Exercice

Deux expériences, à annuler ensuite avec `git checkout -- apps/web/src/components/widgets/widget-grid.css`.

1. Dans [widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), l. 32, remplace `backwards` par `both`. Lance l'app, passe en mode édition et attrape un widget. Que se passe-t-il ?
2. Remets `backwards`. Dans [widget-grid.constants.ts](../../apps/web/src/components/widgets/widget-grid.constants.ts), passe `WIDGET_ENTRANCE_STEP_MS` à `200` et `WIDGET_ENTRANCE_MAX_DELAY_MS` à `2000`. Recharge le dashboard avec plusieurs widgets enregistrés. Qu'observes-tu ? (Annule aussi ce fichier ensuite.)

<details><summary>Solution</summary>

1. Le widget ne se soulève plus et ne suit plus la souris : il reste dans sa case, alors que le placeholder en pointillés bouge. L'animation d'entrée est finie, mais `both` la garde figée sur son état final (`translate: 0 0`, `scale: 1`), et une animation figée gagne sur la règle `.is-dragging`. C'est la raison du choix de `backwards`.
2. La cascade devient très visible : chaque widget attend 200ms de plus que le précédent. Mais remarque aussi que `WIDGET_ENTRANCE_MS` vaut toujours 700ms : au-delà de 700ms, `isSettled` passe à `true` et tous les délais retombent à 0. Changer `animation-delay` en cours de route ne redémarre pas l'animation : le navigateur recalcule où elle en est depuis son départ. Avec un délai de 0 et 700ms déjà écoulées, une entrée de 400ms est considérée comme terminée : les widgets qui attendaient encore apparaissent d'un coup, sans animation. Les constantes sont liées : la durée de la cascade doit couvrir le délai maximal plus la durée d'une entrée.
</details>
