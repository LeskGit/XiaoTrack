# 09. Transformations : translate, scale, rotate

> **Prérequis :** chapitres 01 (variables CSS) et 07 (layout de l'app). **Lecture :** ~15 min. **Fichiers concernés :** `widget-grid.css`, `modal.css`, `index.css`, `WidgetCard.tsx`, `AppHeader.tsx`, `useFlipAnimation.ts`.

## 1. Le problème

Pendant un drag, le widget que tu tiens doit suivre ta souris pixel par pixel. Première idée : changer sa position dans la grille (`grid-column`, `grid-row`) à chaque mouvement. Ça ne marche pas :

- la grille ne connaît que des cases entières, pas des pixels : le widget sauterait de case en case ;
- changer la place d'un élément dans la grille fait **recalculer toute la mise en page** : les voisins bougent, à chaque mouvement de souris.

Deuxième idée : `position: absolute` + `left` / `top`. Le widget sortirait du flux de la grille, sa case se viderait, et les voisins se décaleraient pour la remplir.

Il faut un moyen de **déplacer visuellement** un élément sans toucher à la mise en page. C'est exactement ce que fait une transformation.

## 2. La notion

### Une transformation est une retouche « photo »

Le navigateur travaille en deux temps :

```
1. Mise en page (layout)   : il calcule la boîte de chaque élément (position, taille).
2. Dessin (paint/composite) : il dessine chaque boîte à l'écran.
```

Une transformation intervient **entre les deux**, sur le dessin seulement. L'élément garde sa boîte dans la mise en page, à sa place d'origine ; on décale, agrandit ou tourne seulement **son image**. Conséquences :

- les voisins ne bougent pas : pour eux, l'élément est toujours à sa place ;
- c'est très rapide : le navigateur ne refait pas la mise en page, il redessine juste une image décalée (souvent sur la carte graphique) ;
- c'est pour ça que toutes les animations fluides du projet passent par des transformations.

```
 Mise en page (inchangée)        Ce qu'on voit (translate: 40px 10px)
 ┌──────┐┌──────┐                ┌──────┐   ┌──────┐
 │  A   ││  B   │                │  A   │   │  B   │   ← B est dessiné 40px plus loin,
 └──────┘└──────┘                └──────┘   └──────┘     mais sa case n'a pas bougé
```

### Les trois opérations

| Opération | Ce qu'elle fait | Exemple |
|---|---|---|
| **translate** | décale | `translate: 20px -10px` (20px à droite, 10px vers le haut) |
| **scale** | agrandit ou rétrécit | `scale: 1.03` (3 % plus grand), `scale: 0.5` (moitié) |
| **rotate** | tourne | `rotate: 45deg` |

Les pourcentages de `translate` sont relatifs à **l'élément lui-même**, pas à son parent : `translate: 100% 0` décale l'élément de toute sa propre largeur.

### Deux syntaxes : l'ancienne `transform` et les propriétés individuelles

**L'ancienne syntaxe** met tout dans une seule propriété, `transform` :

```css
transform: translate(20px, 0) scale(1.03) rotate(45deg);
```

Son défaut : c'est **une seule** propriété. Si une règle écrit `transform: scale(1.03)` et une autre `transform: translate(20px, 0)`, la seconde **écrase** la première (c'est la cascade normale, voir chapitre 02). Pour combiner, il faut tout réécrire dans une seule valeur.

**La syntaxe moderne** offre trois propriétés séparées :

```css
translate: 20px 0;
scale: 1.03;
rotate: 45deg;
```

Comme ce sont trois propriétés différentes, elles **ne s'écrasent pas** : une règle peut poser `scale`, une autre `translate`, et les deux s'appliquent. On peut aussi faire une transition sur l'une sans toucher aux autres.

### Comment elles se combinent

Quand plusieurs transformations s'appliquent, le navigateur les combine dans un ordre fixe :

```
image finale = translate → rotate → scale → transform
```

Autrement dit, les propriétés individuelles **et** la propriété `transform` peuvent coexister sur le même élément : elles se **composent** (s'additionnent), elles ne se remplacent pas. C'est le point le plus important de ce chapitre pour comprendre l'app (voir §4.7).

### Le point d'origine : `transform-origin`

`scale` et `rotate` ont besoin d'un point fixe : on agrandit ou on tourne **autour de quoi** ? Par défaut, c'est le **centre** de l'élément (`transform-origin: 50% 50%`). C'est pour ça qu'un widget qui fait `scale: 1.03` grossit dans toutes les directions à la fois, sans glisser vers un coin. On peut le changer (`transform-origin: top left`), mais le projet n'en a jamais eu besoin.

## 3. Exemple minimal

Colle ceci dans un fichier `test.html` et ouvre-le :

```html
<style>
  .row { display: flex; gap: 8px; }
  .box { width: 80px; height: 80px; background: indigo; color: white;
         display: grid; place-items: center; }
  .moved  { translate: 40px 20px; }   /* décalée, mais sa place reste réservée */
  .grown  { scale: 1.3; }             /* grossit depuis son centre */
  .both   { translate: 40px 0; scale: 1.3; }   /* deux propriétés : elles se composent */
  .broken { transform: translate(40px, 0); transform: scale(1.3); } /* la 2e écrase la 1re */
</style>
<div class="row">
  <div class="box">A</div><div class="box moved">B</div><div class="box">C</div>
</div>
<div class="row" style="margin-top: 40px">
  <div class="box both">D</div><div class="box broken">E</div>
</div>
```

À observer :
- B est décalée, mais A et C n'ont pas bougé : sa place est restée vide ;
- D est à la fois décalée **et** agrandie ;
- E est seulement agrandie : la deuxième déclaration `transform` a remplacé la première.

## 4. Dans XiaoTrack

### 4.1 Le widget tenu suit la souris

[widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), l. 357 à 368 :

```css
.widget-cell.is-dragging {
    translate: var(--dx) var(--dy);
    scale: 1.03;
    z-index: 10;
    opacity: 0.94;
    /* filter, not box-shadow: it applies to the whole cell, whatever the card's own shadow */
    filter: drop-shadow(0 16px 28px rgb(var(--shadow-tint) / 0.2)) drop-shadow(0 4px 8px rgb(var(--shadow-tint) / 0.1));
    transition:
        scale var(--motion-fast) var(--ease-out-soft),
        filter var(--motion-fast) var(--ease-out-soft),
        opacity var(--motion-fast) var(--ease-out-soft);
}
```

- `translate: var(--dx) var(--dy)` : le décalage entre l'endroit où tu as attrapé le widget et l'endroit où est ta souris. `--dx` et `--dy` sont posés par React à chaque mouvement ([WidgetGrid.tsx](../../apps/web/src/components/widgets/WidgetGrid.tsx), l. 116 : `"--dx": \`${dragDelta?.x}px\``). La case du widget dans la grille ne change pas : c'est exactement le problème du §1, résolu.
- `scale: 1.03` : le widget « se soulève » un peu.
- `z-index: 10` : il passe au-dessus des autres.
- `transition` : seul `scale` (avec `filter` et `opacity`) est animé, **pas `translate`**. Si `translate` avait une transition, le widget suivrait la souris avec un temps de retard, comme un élastique. Ce choix n'est possible que parce que `translate` et `scale` sont deux propriétés séparées (avec `transform`, impossible d'animer l'une sans l'autre).

### 4.2 Les entrées et les sorties

Plusieurs animations (voir chapitre 11) jouent sur `translate` et `scale`. Par exemple l'entrée d'un widget, l. 38 à 44 :

```css
@keyframes widget-enter {
    from {
        opacity: 0;
        translate: 0 10px;
        scale: 0.96;
    }
}
```

Le widget part 10px plus bas et 4 % plus petit, puis remonte à sa vraie taille. Même logique pour `widget-exit` (l. 52, rétrécit à `scale: 0.9`), `edit-bar-in` (l. 440, la barre d'édition monte de 24px) et `fade-in` (l. 414, descend de 4px).

### 4.3 Le tiroir de la palette

[modal.css](../../apps/web/src/components/modals/modal.css), l. 18 à 32 :

```css
.modal[open] {
    opacity: 1;
    translate: 0 0;
    scale: 1;
}

/* Drawer: slides in from the right edge */
.modal-right {
    translate: 100% 0;
}

/* Centered dialog: grows slightly */
.modal-center {
    scale: 0.96;
}
```

- `translate: 100% 0` : 100 % de **sa propre largeur**, donc le tiroir est entièrement poussé hors de l'écran, à droite.
- Ouvert (`[open]`), il revient à `translate: 0 0`. La transition entre les deux est expliquée au chapitre 12.
- La modale centrée, elle, ne glisse pas : elle grossit légèrement (`0.96` → `1`).

### 4.4 Le bouton qui s'enfonce

[index.css](../../apps/web/src/assets/css/index.css), l. 152 à 154 :

```css
.btn:active:not(:disabled) {
    scale: 0.97;
}
```

`:active` = pendant que le bouton est enfoncé. Il rétrécit de 3 % : un retour tactile discret. La transition sur `scale` est déclarée dans `.btn` (l. 149).

### 4.5 Le ✕ est un + tourné

Le projet n'a pas d'icône « ✕ » : il réutilise l'icône `+` et la tourne de 45°. [WidgetCard.tsx](../../apps/web/src/components/widgets/WidgetCard.tsx), l. 46 à 54 :

```tsx
<IconButton
    icon={PlusIcon}
    size="custom"
    onClick={onRemove}
    ariaLabel={`Remove ${definition.title}`}
    className="h-4 w-4 rotate-45"
    iconWeight="bold"
    classNameBtn="widget-card-remove"
/>
```

`rotate-45` est une classe Tailwind. En Tailwind v4, elle produit la propriété individuelle `rotate: 45deg` (et non `transform`). Même astuce dans [Modal.tsx](../../apps/web/src/components/modals/Modal.tsx), l. 53, pour le bouton de fermeture.

### 4.6 Centrer un point sur une coordonnée

[widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), l. 286 à 296, le point au bout de la courbe d'un graphique :

```css
.chart-body-dot {
    position: absolute;
    left: var(--dot-x);
    top: var(--dot-y);
    width: 0.5rem;
    height: 0.5rem;
    translate: -50% -50%;
    ...
}
```

`left` / `top` placent le **coin haut-gauche** du point sur la coordonnée. `translate: -50% -50%` le recule de la moitié de sa propre taille dans les deux sens : c'est son **centre** qui tombe sur la coordonnée. C'est la technique classique pour centrer un élément sur un point.

Même idée en Tailwind dans la sidebar ([CategorySidebar.tsx](../../apps/web/src/layout/Sidebar/CategorySidebar.tsx), l. 11) : `top-1/2 -translate-y-1/2` centre verticalement la barre indicatrice.

### 4.7 Le point clé : FLIP et le drag se composent

C'est ici que les propriétés séparées deviennent indispensables. Deux mécanismes déplacent les cellules :

1. **Le drag** pose `translate: var(--dx) var(--dy)` sur le widget tenu (§4.1).
2. **L'animation FLIP** fait glisser les cellules vers leur nouvelle place. Elle anime la propriété **`transform`**. [useFlipAnimation.ts](../../apps/web/src/components/widgets/hooks/useFlipAnimation.ts), l. 82 et 83 :

```ts
const flip = cell.animate(
    [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
```

Au moment où tu lâches un widget, les deux sont actifs sur la même cellule pendant un instant. Comme `translate` et `transform` sont deux propriétés différentes, le navigateur **additionne** leurs effets (l'ordre `translate → rotate → scale → transform` du §2). Si le drag avait utilisé `transform` lui aussi, l'animation FLIP aurait écrasé la position de la souris, et le widget aurait sauté.

Même raisonnement pour les animations d'entrée (`translate` / `scale`) : elles ne gênent pas FLIP, qui travaille sur `transform`. Le détail de FLIP est au chapitre 14.

### 4.8 Le logo qui monte au survol

[AppHeader.tsx](../../apps/web/src/layout/Header/AppHeader.tsx), l. 15 :

```ts
const logoArrowClasses = "relative h-6 w-6 text-white transition-transform duration-300 ease-out-soft group-hover:translate-x-0.5 group-hover:-translate-y-0.5";
```

Au survol du bloc logo (`group-hover:`), la flèche se décale de 2px à droite et 2px vers le haut : elle « monte ». `transition-transform` anime ce décalage (voir chapitre 10).

## 5. Pièges

- **Deux `transform` sur le même élément s'écrasent.** Si tu veux combiner, utilise les propriétés individuelles, ou écris tout dans une seule valeur `transform`.
- **Les pourcentages de `translate` sont relatifs à l'élément**, pas au parent. `translate: 50% 0` ne centre pas un élément dans son parent : il le décale de la moitié de **sa** largeur.
- **Une transformation ne libère pas la place.** Un élément décalé de 200px laisse un trou à son ancienne place, et peut recouvrir ses voisins. C'est voulu pour le drag, mais surprenant ailleurs.
- **L'ordre compte avec `transform`.** `translate(50px) rotate(45deg)` et `rotate(45deg) translate(50px)` ne donnent pas le même résultat : dans le second, le décalage se fait dans la direction tournée. Les propriétés individuelles, elles, s'appliquent toujours dans l'ordre fixe du §2.
- **Une transformation crée un nouveau contexte d'empilement.** Un enfant en `z-index: 999` ne peut plus passer au-dessus d'un élément situé hors de son parent transformé. Rarement gênant ici, mais c'est une cause classique de « mon menu passe sous l'autre bloc ».

## 6. À retenir

- Une transformation change **l'image** d'un élément, pas sa place dans la mise en page : les voisins ne bougent pas, et c'est rapide.
- `translate`, `scale` et `rotate` sont trois propriétés séparées qui se composent entre elles **et** avec `transform`.
- XiaoTrack s'appuie sur cette composition : le drag utilise `translate`, l'animation FLIP utilise `transform`, et les deux s'additionnent sans conflit.
- `scale` et `rotate` tournent autour du centre de l'élément par défaut (`transform-origin`).
- `translate: -50% -50%` centre un élément positionné sur un point.

## 7. Exercice

Dans [widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), le widget tenu grossit de 3 % (`scale: 1.03`, l. 359). Change cette valeur en `1.15`, lance `npm run dev:web`, passe en mode édition et attrape un widget. Ensuite, ajoute la ligne `rotate: 2deg;` juste en dessous et recommence. Observe :

1. le widget grossit-il depuis un coin ou depuis son centre ?
2. avec la rotation, suit-il toujours bien la souris ?
3. les voisins réagissent-ils à la rotation ?

Annule ensuite avec `git checkout -- apps/web/src/components/widgets/widget-grid.css`.

<details><summary>Solution</summary>

1. Depuis son **centre** : `transform-origin` vaut `50% 50%` par défaut.
2. Oui. `translate`, `rotate` et `scale` sont trois propriétés indépendantes : la rotation s'ajoute au décalage sans le remplacer. Le widget suit la souris, légèrement penché, comme une carte qu'on tient.
3. Non. Une transformation ne change pas la mise en page : les voisins ne « voient » ni la rotation ni l'agrandissement. Ils ne bougent que lorsque le moteur de grille calcule une nouvelle disposition (après le délai sur la case).

Bonus : la rotation apparaît d'un coup, sans transition, car la règle `transition` de `.is-dragging` ne liste que `scale`, `filter` et `opacity`. Ajoute `rotate var(--motion-fast) var(--ease-out-soft)` à la liste pour qu'elle s'anime aussi.
</details>
