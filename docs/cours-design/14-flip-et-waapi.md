# 14. La technique FLIP et la Web Animations API

> **Prérequis :** chapitres 07 (layout de l'app), 09 (transformations), 10 (transitions et courbes) et 13 (`requestAnimationFrame`). **Lecture :** ~25 min. **Fichiers concernés :** `hooks/useFlipAnimation.ts`, `WidgetGrid.tsx`, `WidgetGridCell.tsx`, `widget-grid.css`.

## 1. Le problème

Pendant un drag, les voisins font de la place : le moteur leur donne une nouvelle position dans la grille, et React met à jour leurs variables `--col` et `--row`. Dans le CSS, ces variables deviennent `grid-column` et `grid-row` (chapitre 07).

Or `grid-column` et `grid-row` **ne s'animent pas**. Ce sont des valeurs « discrètes » : une cellule est en colonne 3 ou en colonne 5, il n'y a pas de colonne 3,7. Si tu mets une `transition` dessus, il ne se passe rien : la cellule disparaît de sa case et réapparaît dans la nouvelle, instantanément. L'œil perd le fil : « qui est allé où ? »

Ce qu'on voudrait : que la cellule **glisse** de son ancienne case à la nouvelle. Mais on ne peut pas animer la position dans la grille. On va donc tricher, avec une propriété qui, elle, s'anime très bien : `transform`.

## 2. La notion

### FLIP : First, Last, Invert, Play

FLIP est une technique décrite par Paul Lewis (Google) en 2015. Elle tient en quatre mots :

```
  First   ┌───┐                         on note où est la cellule AVANT le changement
          │ A │ (colonne 1)
          └───┘
  Last                    ┌───┐         on applique le changement, on mesure où elle est APRÈS
                          │ A │ (colonne 5)
                          └───┘
  Invert  ┌───┐ ← transform: translate(-400px, 0)
          │ A │   elle est vraiment en colonne 5, mais on la DÉPLACE visuellement
          └───┘   jusqu'à son ancienne place : l'utilisateur ne voit aucun saut
  Play     ┌───┐ ───────────────►  ┌───┐   on anime le transform jusqu'à 0 :
           │ A │                   │ A │   elle glisse jusqu'à sa vraie place
           └───┘                   └───┘
```

L'astuce : la vraie position change d'un coup (le navigateur ne sait pas faire autrement), mais un `transform` qui « annule » ce changement est appliqué **avant que l'écran ne soit redessiné**. Puis on retire ce `transform` en douceur. Et `transform` est l'une des propriétés les moins chères à animer : elle ne recalcule pas la mise en page, elle déplace seulement l'image déjà dessinée.

### useLayoutEffect : mesurer avant que le navigateur peigne

Tout repose sur le moment de la mesure. Rappel de l'ordre des choses après un rendu React :

```
React met le DOM à jour
   │
   ├── useLayoutEffect   ← s'exécute ICI : le DOM est neuf, mais rien n'est encore à l'écran
   │
   ├── le navigateur peint l'image   ← l'utilisateur voit le résultat
   │
   └── useEffect         ← s'exécute ICI : trop tard, la cellule a déjà été vue à sa nouvelle place
```

Avec `useEffect`, l'utilisateur verrait pendant une image la cellule à sa nouvelle place, puis à l'ancienne (Invert), puis le glissement : un clignotement. `useLayoutEffect` s'exécute de façon **synchrone**, entre la mise à jour du DOM et la peinture, exactement là où FLIP en a besoin. On le réserve à ce genre de cas, parce qu'il bloque l'affichage le temps de son exécution.

### offsetLeft / offsetTop contre getBoundingClientRect

Il y a deux façons de demander « où est cet élément ? » :

| | `getBoundingClientRect()` | `offsetLeft` / `offsetTop` |
|---|---|---|
| Relatif à | la fenêtre visible (le *viewport*) | l'ancêtre positionné le plus proche (l'*offsetParent*) |
| Tient compte du défilement de la page | oui (la valeur change quand on scrolle) | non |
| Tient compte des `transform`, `translate`, `scale` en cours | oui (position **à l'écran**) | non (position **dans la mise en page**) |

FLIP a besoin de la position **dans la mise en page** : celle que la grille donne à la cellule, sans le décalage du drag (`translate`) ni celui d'une animation FLIP déjà en cours. C'est exactement ce que donnent `offsetLeft` et `offsetTop`. Pour qu'ils soient mesurés par rapport à la grille, la grille doit être l'ancêtre positionné le plus proche : c'est pourquoi `.widget-grid` a `position: relative` (chapitre 07).

### La Web Animations API (WAAPI)

On pourrait faire le « Play » avec une transition CSS. Mais la WAAPI est plus directe : c'est la même mécanique que `@keyframes` (chapitre 11), pilotée depuis JavaScript.

```js
const animation = element.animate(
  [ { transform: "translate(-400px, 0)" }, { transform: "translate(0, 0)" } ],   // les keyframes
  { duration: 280, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }                    // les options
);
```

- Le premier argument est la liste des étapes (comme `from` / `to`).
- Le second contient la durée en ms, la courbe, et éventuellement `delay`, `iterations`, `fill`...
- `element.animate` renvoie un objet `Animation` : on peut le mettre en pause, l'annuler (`.cancel()`), attendre sa fin (`.finished`), et lui donner un nom (`.id`).
- Sans option `fill`, l'effet disparaît à la fin : l'élément revient à son style normal. Ici, c'est parfait, puisque le style normal est justement « sans transform ».
- `element.getAnimations()` renvoie **toutes** les animations en cours sur l'élément : celles créées en JS, mais aussi les animations et transitions CSS. D'où l'intérêt de nommer les nôtres avec `.id`.

### Rattraper une animation en cours

Si une cellule est encore en train de glisser quand elle doit à nouveau bouger, il ne faut pas repartir de sa case de départ (elle sauterait en arrière). Il faut repartir de **là où elle est à l'écran à cet instant**. `getComputedStyle(cell).transform` donne la valeur du `transform` en ce moment précis, animation comprise, sous la forme d'une matrice (`matrix(1, 0, 0, 1, -183.5, 0)`). `new DOMMatrixReadOnly(...)` la décode : ses champs `m41` et `m42` sont le décalage horizontal et vertical.

## 3. Exemple minimal

Colle ceci dans `flip.html`. Le bouton fait passer la boîte d'un bord à l'autre en changeant son `justify-self`, une propriété qui ne s'anime pas, puis FLIP la fait glisser.

```html
<div id="row" style="display: grid; width: 500px; border: 1px dashed #aaa; position: relative">
  <div id="box" style="width: 80px; height: 80px; background: #6366f1; border-radius: 12px; justify-self: start"></div>
</div>
<button id="go">Changer de côté</button>
<script>
  const box = document.getElementById("box");
  document.getElementById("go").onclick = () => {
    const first = box.offsetLeft;                                      // F : avant
    box.style.justifySelf = box.style.justifySelf === "end" ? "start" : "end";
    const last = box.offsetLeft;                                       // L : après (le navigateur recalcule tout de suite)
    box.animate(
      [{ transform: `translate(${first - last}px, 0)` },               // I : on la remet où elle était
       { transform: "translate(0, 0)" }],                              // P : et on la laisse glisser
      { duration: 400, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    );
  };
</script>
```

Ce que tu dois observer : la boîte glisse d'un côté à l'autre. Supprime la ligne `box.animate(...)` : elle saute d'un coup. C'est exactement le problème de la grille.

## 4. Dans XiaoTrack

### L'appel : [WidgetGrid.tsx](../../apps/web/src/components/widgets/WidgetGrid.tsx) (l. 40-41)

```tsx
// Cells slide to their new place instead of jumping (neighbours, compaction, drop)
useFlipAnimation({ gridRef, draggingId, dragDelta });
```

La grille passe trois choses au hook : la référence de l'élément grille, l'id du widget tenu (`null` hors geste) et le décalage du pointeur depuis le début du geste. Ces deux derniers viennent de `useGridDrag`.

### Le repère : [WidgetGridCell.tsx](../../apps/web/src/components/widgets/WidgetGridCell.tsx) (l. 28)

```tsx
<div ref={ref} data-id={id} className={`${className} ${isNew ? "is-new" : ""}`} style={style}>
```

Chaque cellule porte l'id de son widget dans un attribut `data-id`. C'est par lui que le hook retrouve une même cellule d'un rendu à l'autre.

### Le hook : [useFlipAnimation.ts](../../apps/web/src/components/widgets/hooks/useFlipAnimation.ts)

Les constantes (l. 13-20) :

```ts
const FLIP_ANIMATION_ID = "widget-flip";
const MOVE_MS = 280;
const MOVE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const SETTLE_MS = 420;
const SETTLE_EASING = "cubic-bezier(0.34, 1.56, 0.64, 1)";
```

- `FLIP_ANIMATION_ID` : le nom de nos animations, pour les distinguer des animations CSS d'entrée et de sortie qui tournent sur les mêmes cellules.
- `MOVE_*` : les voisins qui font de la place, et le tassement après un ajout ou une suppression. C'est la courbe `--ease-out-soft` d'`index.css`, recopiée ici, car la WAAPI ne lit pas les variables CSS dans ses options.
- `SETTLE_*` : le widget qu'on vient de lâcher. Courbe `--ease-spring` (le 1,56 dépasse 1 : léger rebond, chapitre 10), un peu plus longue : il « atterrit ».

La mémoire entre deux rendus (l. 34-38) :

```ts
const positionsRef = useRef<Map<string, Point>>(new Map());
const gridWidthRef = useRef<number>(0);
const heldRef = useRef<{ id: string; delta: Point } | null>(null);
```

Trois références (pas des états : les modifier ne doit pas provoquer de rendu). `positionsRef` contient la position de chaque cellule au rendu précédent : c'est le **First**. `gridWidthRef` contient la largeur de la grille au rendu précédent. `heldRef` contient le widget tenu et son dernier décalage.

Le cœur, à chaque rendu (l. 40-50) :

```ts
// No dependency array: runs after every render, the moves can come from anywhere
useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const previous = positionsRef.current;
    const next = new Map<string, Point>();
    const sameWidth: boolean = grid.offsetWidth === gridWidthRef.current;
    const animate: boolean = sameWidth && !prefersReducedMotion();
    // Released during this render: the gesture was running, and is not anymore
    const released = draggingId === null ? heldRef.current : null;
```

- Pas de tableau de dépendances : l'effet tourne après **chaque** rendu. Un déplacement peut venir du drag, d'un ajout, d'une suppression, d'un Cancel... Plutôt que de lister les causes, on compare simplement avant et après.
- `if (!grid) return;` : quand le dashboard est vide, la grille n'existe pas.
- `sameWidth` : si la fenêtre a été redimensionnée, **toutes** les cellules ont bougé (la grille est mise à l'échelle en `cqi`, chapitre 08). Animer ce changement ferait glisser toute la grille à chaque redimensionnement : on mesure, mais on n'anime pas.
- `animate` coupe aussi tout si le système demande moins d'animations (chapitre 16).
- `released` : si personne n'est tenu **maintenant**, mais que quelqu'un l'était au rendu précédent (`heldRef`), c'est le rendu du lâcher.

La boucle sur les cellules (l. 52-61) :

```ts
for (const cell of grid.querySelectorAll<HTMLElement>(":scope > .widget-cell[data-id]")) {
    const id = cell.dataset.id;
    if (!id) continue;

    const last: Point = { x: cell.offsetLeft, y: cell.offsetTop };
    next.set(id, last);

    const first = previous.get(id);
    // New cell (its CSS entrance plays), or held one: nothing to do
    if (!animate || !first || id === draggingId) continue;
```

- `:scope > .widget-cell[data-id]` : `:scope` désigne la grille elle-même, `>` ne garde que ses enfants directs. Le cadre pointillé (`.widget-placeholder`) n'a pas de `data-id` : il est exclu.
- `cell.dataset.id` lit l'attribut `data-id`.
- **Last** : la position actuelle dans la mise en page, notée pour le prochain rendu (`next`).
- Pas de **First** (la cellule vient d'apparaître) : rien à faire, c'est son animation CSS d'entrée qui joue (chapitre 11). Le widget tenu est ignoré : il suit déjà le pointeur.

L'**Invert** (l. 63-70) :

```ts
let dx: number = first.x - last.x;
let dy: number = first.y - last.y;
const isReleased: boolean = released?.id === id;
if (released && isReleased) {
    dx += released.delta.x;
    dy += released.delta.y;
}
if (dx === 0 && dy === 0) continue;
```

- `dx`, `dy` : de combien il faut décaler la cellule pour la remettre visuellement à son ancienne place.
- Le cas du **widget lâché** : pendant le geste, il est resté dans sa case d'origine et suivait le pointeur grâce à `translate: var(--dx) var(--dy)` (chapitre 09). Au lâcher, il change de case **et** perd ce `translate`. Visuellement, il était à « ancienne case + décalage du pointeur » : on ajoute donc ce décalage, pour qu'il parte de là où ta main l'a laissé.
- Pas de déplacement : rien à animer.

Le rattrapage d'une animation en cours (l. 72-80) :

```ts
const running = cell.getAnimations().filter((a) => a.id === FLIP_ANIMATION_ID);
if (running.length > 0) {
    const current = new DOMMatrixReadOnly(getComputedStyle(cell).transform);
    dx += current.m41;
    dy += current.m42;
    running.forEach((a) => a.cancel());
}
```

Si la cellule glissait encore, on lit son décalage visuel actuel (`m41`, `m42`), on l'ajoute, puis on annule l'ancienne animation. La nouvelle part de la position exacte à l'écran : aucun saut, même si tu bouges vite au-dessus de la grille.

Le **Play** (l. 82-88) :

```ts
const flip = cell.animate(
    [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
    isReleased
        ? { duration: SETTLE_MS, easing: SETTLE_EASING }
        : { duration: MOVE_MS, easing: MOVE_EASING },
);
flip.id = FLIP_ANIMATION_ID;
```

De « remis à l'ancienne place » jusqu'à « aucun décalage », avec la courbe à rebond pour le widget lâché.

La mise à jour de la mémoire (l. 91-97) :

```ts
positionsRef.current = next;
gridWidthRef.current = grid.offsetWidth;
if (draggingId === null) {
    heldRef.current = null;
} else if (dragDelta) {
    heldRef.current = { id: draggingId, delta: dragDelta };
}
```

Les positions d'aujourd'hui seront le First de demain. Pendant un geste, on mémorise le dernier décalage connu du widget tenu ; hors geste, on oublie.

### Pourquoi `transform` ici et `translate` pour le drag

FLIP anime la propriété `transform`. Le drag, lui, utilise la propriété séparée `translate` (`.widget-cell.is-dragging`, [widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css) l. 358). Ce sont **deux propriétés différentes**, que le navigateur additionne (chapitre 09). Si le drag utilisait aussi `transform`, l'animation FLIP écraserait le décalage du pointeur, ou l'inverse. Et `getComputedStyle(cell).transform` (l. 76) ne lit que la propriété `transform` : il voit l'animation FLIP, pas le décalage du drag. C'est voulu.

## 5. Pièges

- **Mesurer dans un `useEffect`** : un clignotement d'une image (la cellule apparaît à sa nouvelle place avant de repartir en arrière).
- **Utiliser `getBoundingClientRect`** : il inclut le défilement de la page et les `transform` en cours. Le First et le Last ne seraient plus comparables, et la cellule partirait de travers.
- **Oublier `position: relative` sur la grille** : `offsetLeft` serait mesuré par rapport à un autre ancêtre. Ça fonctionne encore tant que tout bouge ensemble, mais c'est fragile.
- **Annuler sans rattraper** : sans le bloc l. 72-80, une cellule qui bouge deux fois de suite saute en arrière avant de glisser.
- **Animer avec `fill: "forwards"`** : le `transform` resterait collé à la fin, et le prochain calcul serait faussé.
- **Le coût** : à chaque rendu, le hook lit `offsetLeft` et `offsetTop` de chaque cellule. Si le DOM vient de changer, chaque lecture oblige le navigateur à recalculer la mise en page tout de suite. Pendant un drag, il y a un rendu par mouvement du pointeur. Avec une vingtaine de widgets, c'est invisible ; avec des centaines, il faudrait ne mesurer que quand les positions changent vraiment.

## 6. À retenir

- On ne peut pas animer un changement de case dans une grille : la cellule saute.
- FLIP : noter l'avant, appliquer le changement, mesurer l'après, décaler avec un `transform` pour annuler visuellement, puis animer ce `transform` jusqu'à zéro.
- `useLayoutEffect` mesure après la mise à jour du DOM et avant la peinture : c'est indispensable pour que l'utilisateur ne voie pas le saut.
- `offsetLeft` / `offsetTop` donnent la position dans la mise en page, sans défilement ni transformation : la bonne base pour comparer avant et après.
- `element.animate()` (WAAPI) est l'équivalent JavaScript de `@keyframes`, avec un objet `Animation` qu'on peut nommer, retrouver (`getAnimations()`) et annuler.

## 7. Exercice

1. Dans `useFlipAnimation.ts`, passe `MOVE_MS` à `1500` et `SETTLE_MS` à `2000`. Passe en mode édition avec au moins trois widgets, et fais un drag qui pousse des voisins. Observe le chemin des voisins, puis celui du widget lâché.
2. Toujours à 1500 ms, mets en commentaire le bloc des lignes 74 à 80 (le rattrapage). Fais un drag rapide en zigzag au-dessus de plusieurs cases. Que remarques-tu ?
3. Annule tout : `git checkout -- apps/web/src/components/widgets/hooks/useFlipAnimation.ts`.

<details><summary>Solution</summary>

1. Les voisins glissent lentement de leur ancienne case à la nouvelle. Le widget lâché part de l'endroit où tu as relâché la souris (pas de sa case d'origine), et sa fin dépasse légèrement puis revient : c'est le rebond de `SETTLE_EASING`.
2. Sans le rattrapage, quand un voisin doit bouger alors qu'il glisse encore, l'ancienne animation n'est pas annulée et la nouvelle part de sa case précédente : il « saute » en arrière avant de repartir. L'ancienne animation, elle, continue en arrière-plan, masquée par la nouvelle (sur une même propriété, la dernière animation créée l'emporte). Le rattrapage existe exactement pour ça.

</details>
