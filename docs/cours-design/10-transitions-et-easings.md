# 10. Transitions et courbes d'accélération

> **Prérequis :** chapitres 01 (variables CSS), 03 (Tailwind @theme) et 09 (transformations). **Lecture :** ~15 min. **Fichiers concernés :** `index.css`, `widget-grid.css`, `CategorySidebar.tsx`, `AppHeader.tsx`.

## 1. Le problème

Survole une carte de widget : son ombre grandit. Sans rien de plus, le changement serait **instantané** : l'ombre passerait d'un état à l'autre en une image. L'œil perçoit ce saut comme brutal, presque comme un bug d'affichage.

On veut que le navigateur **fabrique les images intermédiaires** entre l'ancien et le nouvel état, sur une courte durée, sans écrire une seule ligne de JavaScript. C'est le rôle de `transition`.

Deuxième problème : même animé, un mouvement à vitesse constante paraît mécanique. Dans la réalité, un objet accélère puis freine. Il faut pouvoir régler **la manière** dont la valeur évolue dans le temps : ce sont les courbes d'accélération (*easings*).

## 2. La notion

### Une transition = « quand cette propriété change, prends ton temps »

Une transition ne déclenche rien par elle-même. Elle dit au navigateur : **si** la valeur de telle propriété change (survol, classe ajoutée par React, attribut `open`…), passe de l'ancienne à la nouvelle valeur progressivement.

```css
.card {
    box-shadow: var(--shadow-card);
    transition: box-shadow 250ms ease-out 0ms;
    /*          ↑ propriété ↑ durée ↑ courbe ↑ délai */
}
.card:hover {
    box-shadow: var(--shadow-card-hover);   /* le changement que la transition anime */
}
```

Les quatre morceaux :

| Morceau | Rôle | Valeur par défaut |
|---|---|---|
| propriété | ce qui s'anime (`opacity`, `scale`, `box-shadow`, `all`…) | `all` |
| durée | combien de temps | `0s` (donc rien ne s'anime si on l'oublie) |
| courbe | comment la vitesse évolue | `ease` |
| délai | attente avant de commencer | `0s` |

Plusieurs transitions se séparent par des virgules :

```css
transition:
    box-shadow 250ms ease-out,
    border-color 250ms ease-out;
```

La transition s'écrit sur l'**état de base** (`.card`), pas sur `:hover` : ainsi elle joue dans les deux sens, à l'entrée **et** à la sortie du survol.

### Ce qui s'anime, et ce qui ne s'anime pas

Le navigateur ne sait interpoler (calculer des valeurs intermédiaires) que les valeurs **continues** : nombres, longueurs, couleurs, ombres, transformations. Entre `opacity: 0` et `opacity: 1`, il sait qu'il y a `0.5`.

Il ne sait pas interpoler les valeurs **discrètes** : `display: none` → `display: block`, ou `grid-row: 2` → `grid-row: 3`. Il n'y a pas de « moitié de display », ni de « case 2,5 ». Ces propriétés basculent d'un coup. Le projet contourne ces deux limites :
- pour `display` (ouvrir / fermer une modale) : voir chapitre 12 ;
- pour `grid-row` / `grid-column` (un widget qui change de case) : la technique FLIP, voir chapitre 14.

Les propriétés les moins coûteuses à animer sont `opacity`, `translate`, `scale`, `rotate` et `transform` : le navigateur ne refait pas la mise en page (voir chapitre 09).

### Les courbes d'accélération

Une courbe répond à la question : « à 30 % du temps écoulé, où en est-on du chemin ? ». On la dessine avec le temps en abscisse et la progression en ordonnée :

```
 progression
 1 ┤          ....----     linear   : vitesse constante (droite)
   │      ..''             ease-in  : démarre lentement, finit vite
   │   .'                  ease-out : démarre vite, finit lentement
   │ .'                    ease     : (défaut) un ease-out un peu adouci au départ
 0 ┼'─────────────── temps
   0                1
```

- `ease-out` est le bon choix pour la plupart des mouvements d'interface : la réaction est immédiate (le départ est rapide) et l'arrivée est douce.
- `ease-in` convient à ce qui **part** (une sortie) : l'élément s'éloigne en accélérant.
- `linear` convient aux mouvements continus qui tournent en boucle (un reflet qui défile).

### `cubic-bezier(x1, y1, x2, y2)` : dessiner sa propre courbe

Les mots-clés ci-dessus sont des raccourcis. La forme générale est une **courbe de Bézier** : elle part de (0, 0), arrive à (1, 1), et sa forme est tirée par deux **points de contrôle** P1 = (x1, y1) et P2 = (x2, y2), comme des aimants.

```
 1 ┤        P2 ●───────● (1,1)
   │          ╱
   │     ...''         Les x (temps) restent entre 0 et 1.
   │   .'              Les y (progression) peuvent sortir de [0, 1].
   │  ╱
 0 ●──● P1
   0  (0,0)            1
```

Le projet en définit deux, dans [index.css](../../apps/web/src/assets/css/index.css) :

**`--ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1)`** : P1 = (0.22, 1) tire la courbe vers le haut très tôt. À 22 % du temps, on est déjà presque au bout ; le reste du temps sert à ralentir doucement. Résultat : réaction vive, arrivée très douce. C'est la courbe de presque tous les mouvements.

**`--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)`** : P1 a un y de **1.56**, supérieur à 1. La courbe **dépasse** la valeur d'arrivée avant d'y revenir :

```
 progression
 1.1┤       .--.
 1  ┤     .'    '--.____     ← dépasse 1 (overshoot), puis se pose
   │   .'
 0 ┼.'────────────────── temps
```

Sur `scale: 0.5 → 1`, l'élément grossit jusqu'à environ `1.05`, puis revient à `1`. C'est l'effet « ressort », « ça atterrit ». On le réserve aux éléments qui **apparaissent** et doivent attirer l'œil.

### Les tokens de durée

[index.css](../../apps/web/src/assets/css/index.css), l. 102 à 104 :

```css
--motion-fast: 150ms;   /* hovers, presses */
--motion-base: 250ms;   /* state changes */
--motion-slow: 400ms;   /* entrances, exits */
```

Trois durées pour toute l'app, comme pour les couleurs (voir chapitre 05) : la cohérence vient du fait qu'on ne choisit pas une durée au hasard à chaque endroit. Règle approximative : plus le mouvement est grand ou important, plus il peut durer, sans dépasser ~400ms pour ne pas faire attendre.

Remarque : `--ease-out-soft` et `--ease-spring` sont dans `@theme` (Tailwind génère donc les classes `ease-out-soft` et `ease-spring`, voir chapitre 03), alors que `--motion-*` sont dans `:root` (de simples variables, sans classe Tailwind).

## 3. Exemple minimal

```html
<style>
  .row { display: flex; gap: 16px; padding: 40px; }
  .ball { width: 60px; height: 60px; border-radius: 50%; background: indigo; scale: 0.5; }
  .row:hover .ball { scale: 1; }
  .a { transition: scale 600ms linear; }
  .b { transition: scale 600ms ease-out; }
  .c { transition: scale 600ms cubic-bezier(0.22, 1, 0.36, 1); }
  .d { transition: scale 600ms cubic-bezier(0.34, 1.56, 0.64, 1); }
</style>
<div class="row">
  <div class="ball a"></div><div class="ball b"></div>
  <div class="ball c"></div><div class="ball d"></div>
</div>
```

Survole la ligne, puis sors. À observer : même durée pour les quatre, mais un ressenti très différent. La dernière (`ease-spring`) dépasse sa taille finale avant de se poser.

## 4. Dans XiaoTrack

### 4.1 Les boutons

[index.css](../../apps/web/src/assets/css/index.css), l. 143 à 150 (dans `.btn`) :

```css
transition:
    background-color var(--motion-fast),
    border-color var(--motion-fast),
    color var(--motion-fast),
    box-shadow var(--motion-fast),
    filter var(--motion-fast),
    scale var(--motion-fast);
```

- Chaque propriété qui change au survol ou à la pression est listée, avec la durée rapide (150ms) : un bouton doit répondre tout de suite.
- Pas de courbe précisée : c'est `ease`, le défaut, suffisant pour un changement si court.
- `scale` est là pour l'effet « enfoncé » de `.btn:active` (voir chapitre 09). `filter` pour l'éclaircissement du bouton principal au survol.

### 4.2 L'ombre des cartes

[widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), l. 93 à 100 :

```css
    transition:
        box-shadow var(--motion-base) var(--ease-out-soft),
        border-color var(--motion-base) var(--ease-out-soft);
}

.widget-card:hover {
    box-shadow: var(--shadow-card-hover);
}
```

- La transition est sur `.widget-card` (l'état de base) : l'ombre grandit au survol **et** se résorbe en douceur quand la souris part.
- `border-color` est aussi listé, pour le mode édition, où la bordure passe en accent au survol (l. 107).

### 4.3 Le widget qui retombe après le drop

[widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), l. 34 et 35 (dans `.widget-cell`), puis l. 364 à 367 (dans `.widget-cell.is-dragging`) :

```css
/* The lift of a held widget comes back smoothly after the drop */
transition: scale var(--motion-base) var(--ease-out-soft);
```

```css
transition:
    scale var(--motion-fast) var(--ease-out-soft),
    filter var(--motion-fast) var(--ease-out-soft),
    opacity var(--motion-fast) var(--ease-out-soft);
```

Une subtilité utile : **c'est la transition de l'état d'arrivée qui s'applique.**
- Quand tu attrapes un widget, il prend la classe `is-dragging` : c'est la transition rapide de `.is-dragging` (150ms) qui joue, le widget se soulève vite.
- Quand tu le lâches, la classe disparaît : c'est la transition de `.widget-cell` (250ms) qui joue, il retombe plus lentement.
- `translate` n'est dans aucune liste : le widget suit la souris sans retard (voir chapitre 09, §4.1).

### 4.4 Les guides de la grille

[widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), l. 530 à 546 (résumé) :

```css
.widget-grid::before {
    ...
    opacity: 0;
    transition: opacity var(--motion-slow) var(--ease-out-soft);
}

.widget-grid.is-editing::before {
    opacity: 1;
}
```

Les cases pâles qui montrent la grille en mode édition apparaissent en fondu lent (400ms). Le pseudo-élément `::before` existe toujours ; seule son opacité change, ce qui permet la transition (alors qu'un élément ajouté ou retiré du DOM ne peut pas faire de transition, voir chapitre 12).

### 4.5 La sidebar en Tailwind

[CategorySidebar.tsx](../../apps/web/src/layout/Sidebar/CategorySidebar.tsx), l. 6, 11 et 17 :

```ts
const linkBase = "group relative flex items-center gap-3 rounded-md px-2 py-1.5 text-body font-medium transition-[background-color,color,box-shadow] duration-200";
const indicatorBase = "absolute top-1/2 -left-3 w-[3px] -translate-y-1/2 rounded-r-full bg-accent transition-[height,opacity] duration-300";
const tileBase = "tone-tile flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors duration-200";
```

En Tailwind, une transition s'écrit avec plusieurs classes :
- `transition-[background-color,color,box-shadow]` : la **liste** des propriétés (valeur arbitraire entre crochets, les virgules sans espace) ;
- `transition-colors` : un raccourci Tailwind pour toutes les propriétés de couleur ;
- `duration-200` / `duration-300` : la durée en millisecondes.

La barre indicatrice passe de `h-0 opacity-0` à `h-6 opacity-100` quand l'entrée devient active (l. 34) : elle « pousse » depuis son centre en 300ms.

**Pourquoi pas `transition-all` ?** La version précédente utilisait `transition-all`. C'est tentant, mais :
- toutes les propriétés qui changent s'animent, y compris celles qu'on ne voulait pas animer (une largeur, un padding qui change au passage en mode mobile…) ;
- le navigateur doit surveiller toutes les propriétés de l'élément.

Lister explicitement ce qu'on anime rend l'intention lisible et évite les surprises.

### 4.6 Le logo qui monte au survol

[AppHeader.tsx](../../apps/web/src/layout/Header/AppHeader.tsx), l. 15 et 20 :

```ts
const logoArrowClasses = "relative h-6 w-6 text-white transition-transform duration-300 ease-out-soft group-hover:translate-x-0.5 group-hover:-translate-y-0.5";
```
```tsx
<div className="group flex h-16 items-center gap-3 ...">
```

- `group` sur le bloc parent, `group-hover:` sur l'enfant : « quand le **parent** est survolé, applique ceci à l'enfant ». Survoler n'importe où dans le bloc logo fait réagir la flèche.
- `transition-transform` : en Tailwind v4, ce raccourci couvre `transform`, `translate`, `scale` et `rotate`. Il est nécessaire ici car `translate-x-0.5` produit la propriété individuelle `translate`.
- `ease-out-soft` : la classe générée par Tailwind à partir du token `--ease-out-soft` de `@theme`.

### 4.7 Où est utilisé `--ease-spring` ?

Uniquement là où quelque chose doit « atterrir » : l'apparition de la poignée et du ✕ en mode édition (`widget-control-in`, l. 154 et 169), la barre d'édition (`edit-bar-in`, l. 437), le badge « Added » de la palette. Ce sont des animations `@keyframes` (chapitre 11), mais elles utilisent la même courbe. Et le widget lâché qui se pose dans sa case utilise aussi un ressort (`SETTLE_EASING` dans `useFlipAnimation.ts`, chapitre 14).

## 5. Pièges

- **Oublier la durée.** `transition: opacity` seul a une durée de `0s` : rien ne s'anime, et rien ne prévient.
- **Mettre la transition sur `:hover`.** Elle ne jouera qu'à l'entrée du survol ; à la sortie, retour brutal. Mets-la sur l'état de base.
- **Animer une propriété discrète.** `display`, `grid-row`, `visibility` sans précaution basculent d'un coup. Voir chapitres 12 et 14.
- **`transition-all` par facilité.** Il anime aussi ce que tu n'avais pas prévu (§4.5).
- **Transition sur une valeur qui suit la souris.** Un `translate` avec transition fait traîner l'élément derrière le pointeur (raison pour laquelle `.is-dragging` ne l'anime pas).
- **Une durée en dur.** `transition: scale 200ms` au lieu de `var(--motion-base)` : ça marche, mais la cohérence de l'app se perd petit à petit. Le seul `200ms` en dur restant (`widget-exit`) est synchronisé à la main avec `WIDGET_EXIT_MS` (voir chapitre 12).

## 6. À retenir

- Une transition anime le passage d'une valeur à une autre quand elle change ; elle s'écrit sur l'état de base.
- Elle se compose de : propriété, durée, courbe, délai. Seules les valeurs continues s'interpolent.
- `cubic-bezier` dessine une courbe avec deux points de contrôle ; un `y` supérieur à 1 crée un dépassement (effet ressort).
- XiaoTrack utilise trois durées (`--motion-fast|base|slow`) et deux courbes (`--ease-out-soft` partout, `--ease-spring` pour ce qui atterrit).
- On liste explicitement les propriétés animées plutôt que `transition-all`.

## 7. Exercice

Dans [widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), l. 94 et 95, remplace les deux `var(--ease-out-soft)` de `.widget-card` par `var(--ease-spring)`, et les deux `var(--motion-base)` par `1s`. Survole un widget et sors. Puis remets les valeurs d'origine, et cette fois déplace toute la ligne `transition: ...` (l. 93 à 95) dans `.widget-card:hover`. Survole et sors.

Questions :
1. Avec `ease-spring`, que remarques-tu sur l'ombre ?
2. Avec la transition déplacée dans `:hover`, que se passe-t-il quand la souris quitte la carte ?

Annule avec `git checkout -- apps/web/src/components/widgets/widget-grid.css`.

<details><summary>Solution</summary>

1. L'ombre **dépasse** sa taille finale puis revient légèrement : c'est l'overshoot de la courbe (y = 1.56). Sur une ombre, l'effet est à peine visible et un peu étrange : c'est pour ça que le ressort est réservé aux éléments qui apparaissent ou atterrissent.
2. À l'entrée du survol, l'ombre grandit en douceur. À la sortie, elle revient **d'un coup** : sans `:hover`, la carte n'a plus de règle `transition`, donc le retour n'est pas animé. Une transition doit être déclarée sur l'état de base.
</details>
