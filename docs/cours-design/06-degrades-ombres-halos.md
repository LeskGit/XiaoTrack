# 06. Dégradés, ombres et halos

> **Prérequis :** chapitres 01, 03 et 05. **Lecture :** ~25 min. **Fichiers concernés :** `index.css`, `AppHeader.tsx`, `MainHeader.tsx`, `widget-grid.css`.

## 1. Le problème

Une interface faite uniquement d'aplats de couleur paraît plate : on ne sait pas ce qui est posé « au-dessus » de quoi, ni ce qui est important. Les designers utilisent trois outils pour donner de la profondeur et de l'identité :

- les **dégradés** (le logo, le bouton principal, les halos du fond) ;
- les **ombres** (une carte qui flotte, un widget qu'on soulève) ;
- les **reflets et contours** (le liseré lumineux du logo, l'anneau autour de l'avatar).

En CSS, aucun de ces effets n'est une image : tout est calculé par le navigateur, à n'importe quelle taille, à partir de quelques lignes.

## 2. La notion

### 2.1 `linear-gradient` : un dégradé en ligne droite

```css
background-image: linear-gradient(135deg, blue, indigo 50%, purple);
```

- **L'angle** donne la direction : `0deg` va vers le haut, `90deg` vers la droite, `180deg` vers le bas. `135deg` va donc vers le bas à droite (une diagonale). On peut aussi écrire `to right`, `to bottom`.
- **Les arrêts de couleur** (*color stops*) : chaque couleur peut porter une position. `indigo 50%` veut dire « indigo pile au milieu ». Sans position, les couleurs se répartissent régulièrement.
- **Arrêt net** : deux couleurs à la même position créent une coupure franche au lieu d'un fondu. `linear-gradient(to right, red 40px, transparent 40px)` dessine une bande rouge de 40 px, puis rien.

Un dégradé est une **image** (`background-image`), pas une couleur : il se superpose à `background-color`.

### 2.2 `radial-gradient` : un dégradé en cercle ou en ellipse

```css
radial-gradient(60rem 36rem at -10% -10%, lightblue, transparent 70%)
                └── taille ──┘ └ position ┘  └ couleur ┘ └─ où elle a disparu ─┘
```

- `60rem 36rem` : l'ellipse fait 60rem de large et 36rem de haut.
- `at -10% -10%` : son centre est **hors** de l'élément, un peu au-delà du coin en haut à gauche. On ne voit donc que le bord de la tache de couleur, ce qui donne un halo doux.
- `transparent 70%` : la couleur s'efface et devient transparente à 70 % du rayon.

### 2.3 Plusieurs fonds superposés

`background-image` accepte une liste séparée par des virgules. **Le premier de la liste est dessiné au-dessus.** `background-color` est toujours tout en dessous.

```
  background-image: halo-1, halo-2;      ┌── halo-1 (dessus)
  background-color: canvas;              ├── halo-2
                                         └── canvas (dessous)
```

### 2.4 `background-attachment: fixed`

Par défaut, le fond défile avec l'élément. Avec `fixed`, il est accroché à la **fenêtre** : le contenu glisse par-dessus, le fond ne bouge pas.

### 2.5 `background-clip: text` : du texte en dégradé

Un texte n'accepte pas de dégradé en `color`. L'astuce :

```css
background-image: linear-gradient(90deg, blue, purple);  /* 1. on peint le fond en dégradé   */
background-clip: text;                                   /* 2. on ne garde le fond que sous les lettres */
color: transparent;                                      /* 3. on rend les lettres transparentes pour voir le fond */
```

Les anciennes versions de Safari réclament `-webkit-background-clip: text`. Dans ce projet, le build de Tailwind ajoute ce préfixe tout seul (on le retrouve dans le CSS généré).

### 2.6 `box-shadow` : l'ombre portée

```css
box-shadow: 0 6px 16px -4px rgb(0 0 0 / 0.2);
            │  │   │    │    └─ couleur (souvent transparente)
            │  │   │    └────── étalement (spread) : agrandit (+) ou rétrécit (−) l'ombre
            │  │   └─────────── flou (blur) : plus c'est grand, plus c'est diffus
            │  └─────────────── décalage vertical : vers le bas = lumière venant du haut
            └────────────────── décalage horizontal
```

- **Plusieurs ombres** séparées par des virgules se superposent. Le réalisme vient souvent d'une paire : une ombre proche et nette (le contact) + une ombre lointaine et floue (l'ambiance).
- **`inset`** dessine l'ombre *à l'intérieur* de la boîte : utile pour un liseré lumineux sur le bord haut.
- **Étalement négatif** : l'ombre devient plus petite que l'élément. Combinée à un décalage vers le bas, elle ne dépasse que **sous** l'élément, pas sur les côtés.
- **Étalement seul, sans flou ni décalage** (`0 0 0 2px couleur`) : ça dessine un **anneau** net autour de la boîte, sans toucher à sa taille. C'est ainsi que fonctionnent les *rings* de Tailwind.

### 2.7 `filter: drop-shadow()` : l'ombre de la forme réelle

`box-shadow` suit le **rectangle** de l'élément (avec ses coins arrondis). `filter: drop-shadow()` suit **ce qui est réellement dessiné**, enfants compris, pixel par pixel. Il n'a pas d'étalement ni d'`inset`, mais il s'applique à un groupe entier comme si c'était une seule image.

### 2.8 Les *rings* de Tailwind

`ring-1 ring-line` ne crée pas de bordure : c'est un `box-shadow` de type anneau (`0 0 0 1px couleur`). Avantages : il ne change pas la taille de l'élément, et Tailwind le combine avec l'ombre normale (`shadow-*`) grâce à des variables internes. Dans le CSS généré :

```css
.ring-1 { --tw-ring-shadow: var(--tw-ring-inset,) 0 0 0 calc(1px + ...) var(--tw-ring-color, currentcolor);
          box-shadow: var(--tw-inset-shadow), ..., var(--tw-ring-shadow), var(--tw-shadow); }
```

`ring-inset` met l'anneau à l'intérieur. `ring-white/25` choisit la couleur : du blanc à 25 %.

### 2.9 Le pseudo-élément `::before`

`::before` crée une boîte « fantôme », première enfant de l'élément, sans toucher au HTML. On s'en sert pour un calque décoratif : un reflet, des guides… Il lui faut `content: ""` pour exister. En Tailwind, les classes préfixées `before:` le stylent, et Tailwind ajoute le `content` tout seul.

## 3. Exemple minimal

```html
<style>
  body { margin: 0; height: 200vh; background-color: #f7f7fb;
         background-image: radial-gradient(40rem 25rem at -10% -10%, oklch(0.9 0.07 265 / 0.6), transparent 70%);
         background-attachment: fixed; font-family: sans-serif; padding: 40px; }
  .tile { position: relative; overflow: hidden; display: inline-grid; place-items: center;
          width: 56px; height: 56px; border-radius: 12px; color: white; font-weight: bold;
          background-image: linear-gradient(135deg, #3b82f6, #6366f1 50%, #9333ea);
          box-shadow: 0 6px 16px -4px rgb(147 51 234 / 0.6), inset 0 0 0 1px rgb(255 255 255 / 0.25); }
  .tile::before { content: ""; position: absolute; inset: 0 0 50% 0;
                  background: linear-gradient(to bottom, rgb(255 255 255 / 0.25), transparent); }
  .title { font-size: 32px; font-weight: 700; background-image: linear-gradient(90deg, #3b82f6, #9333ea);
           background-clip: text; color: transparent; }
</style>
<span class="tile">XT</span> <span class="title">XiaoTrack</span>
```

À observer : le halo bleuté en haut à gauche, qui ne bouge pas quand tu fais défiler la page ; la tuile en dégradé, avec un reflet sur sa moitié haute, un fin liseré clair et une lueur violette seulement en dessous ; le titre en dégradé.

## 4. Dans XiaoTrack

### 4.1 Les halos du fond (la « signature » de la charte)

[index.css](../../apps/web/src/assets/css/index.css), l. 250 à 255 :

```css
    body {
        background-color: var(--color-canvas);
        background-image:
            radial-gradient(60rem 36rem at -10% -10%, oklch(0.9 0.07 265 / 0.45), transparent 70%),
            radial-gradient(50rem 32rem at 110% -5%, oklch(0.9 0.08 305 / 0.35), transparent 70%);
        background-attachment: fixed;
```

- Sous tout : le canvas, presque blanc.
- Premier halo : une ellipse bleue (teinte 265) centrée hors de l'écran en haut à gauche, à 45 % d'opacité.
- Second halo : une ellipse violette (teinte 305) centrée hors de l'écran en haut à droite (`110%`), à 35 %.
- `fixed` : les halos restent accrochés à la fenêtre. À noter honnêtement : depuis que seul `<main>` défile (chapitre 07), le `body` ne défile plus, donc `fixed` n'a plus d'effet visible. Il ne gêne pas et protège le jour où le layout changerait.

### 4.2 Le dégradé de marque

[index.css](../../apps/web/src/assets/css/index.css), l. 96 à 97, puis 111 à 119 :

```css
    --brand-gradient: linear-gradient(135deg, var(--color-blue-500), var(--color-indigo-500) 50%, var(--color-purple-600));
    --brand-gradient-text: linear-gradient(90deg, var(--color-blue-500), var(--color-indigo-500) 50%, var(--color-purple-600));
...
@utility bg-brand {
    background-image: var(--brand-gradient);
}

@utility text-brand {
    background-image: var(--brand-gradient-text);
    background-clip: text;
    color: transparent;
}
```

- Deux versions : en diagonale (`135deg`) pour les surfaces, horizontale (`90deg`) pour le texte, sinon les lettres de gauche et de droite auraient presque la même couleur.
- Une variable peut contenir un dégradé entier : c'est juste du texte (chapitre 01).
- `text-brand` applique les trois lignes du §2.5. `@utility` est expliqué au chapitre 04.
- La règle de la charte : ce dégradé n'apparaît que sur le logo et sur **une** action principale par écran (`.btn-primary`, l. 171 à 175).

### 4.3 Le logo

[AppHeader.tsx](../../apps/web/src/layout/Header/AppHeader.tsx), l. 8 à 12 :

```ts
const logoTileClasses = [
    "bg-brand relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md",
    "shadow-brand ring-1 ring-white/25 ring-inset",
    "before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-linear-to-b before:from-white/25 before:to-transparent",
].join(" ");
```

- Ligne 1 : le fond en dégradé (`bg-brand`). `relative` sert de repère au `::before`. `overflow-hidden` coupe le reflet aux coins arrondis.
- Ligne 2 : `shadow-brand` est la lueur colorée (voir 4.4). `ring-1 ring-white/25 ring-inset` trace un liseré blanc à 25 % **à l'intérieur** du bord : la tuile paraît vitrée.
- Ligne 3 : le reflet. Le `::before` est positionné en haut (`top-0`), sur toute la largeur (`inset-x-0`) et la moitié de la hauteur (`h-1/2`). Il est rempli d'un dégradé vertical du blanc à 25 % vers le transparent (`bg-linear-to-b from-white/25 to-transparent`).
- L'icône de la flèche porte `relative` (l. 15) : elle passe donc au-dessus du reflet, qui est positionné lui aussi mais arrive plus tôt dans l'ordre du document.

Le nom « XiaoTrack » (l. 24) utilise `text-brand`.

### 4.4 Les ombres de la charte

[index.css](../../apps/web/src/assets/css/index.css), l. 79 à 83 :

```css
    --shadow-card: 0 1px 2px rgb(var(--shadow-tint) / 0.05), 0 1px 3px rgb(var(--shadow-tint) / 0.04);
    --shadow-card-hover: 0 6px 16px rgb(var(--shadow-tint) / 0.08), 0 2px 4px rgb(var(--shadow-tint) / 0.04);
    --shadow-float: 0 12px 32px rgb(var(--shadow-tint) / 0.16), 0 4px 10px rgb(var(--shadow-tint) / 0.08);
    /* Coloured glow, only under the brand gradient */
    --shadow-brand: 0 6px 16px -4px oklch(0.558 0.288 302 / 0.5);
```

- Trois **niveaux d'élévation**, tous en paires (contact + ambiance) : `card` (posé, à peine visible), `card-hover` (survolé, la carte se soulève), `float` (flottant : barre d'édition, modales).
- Toutes teintées par `--shadow-tint` (indigo-900), voir chapitre 05.
- `--shadow-brand` : décalée de 6px vers le bas, floutée sur 16px, **étalement −4px**. L'ombre est plus étroite que l'élément : la lueur violette n'apparaît que dessous, comme une lumière colorée qui tombe du bouton.
- Préfixées `--shadow-` dans `@theme`, elles génèrent les classes `shadow-card`, `shadow-card-hover`, `shadow-float`, `shadow-brand`. La barre active de la sidebar utilise `shadow-card-hover` ([CategorySidebar.tsx](../../apps/web/src/layout/Sidebar/CategorySidebar.tsx), l. 7).

Le bouton principal ajoute un liseré lumineux en haut ([index.css](../../apps/web/src/assets/css/index.css), l. 174) :

```css
        box-shadow: var(--shadow-brand), inset 0 1px 0 rgb(255 255 255 / 0.2);
```

`inset 0 1px 0` : une ombre intérieure décalée d'1px vers le bas, sans flou, blanche à 20 %. Résultat : une fine ligne claire sur le bord haut, comme un reflet.

### 4.5 Le widget tenu pendant le drag : `drop-shadow`

[widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), l. 357 à 363 :

```css
    .widget-cell.is-dragging {
        translate: var(--dx) var(--dy);
        scale: 1.03;
        z-index: 10;
        opacity: 0.94;
        /* filter, not box-shadow: it applies to the whole cell, whatever the card's own shadow */
        filter: drop-shadow(0 16px 28px rgb(var(--shadow-tint) / 0.2)) drop-shadow(0 4px 8px rgb(var(--shadow-tint) / 0.1));
```

Le style s'applique à la **cellule** (`.widget-cell`), alors que la carte visible est son enfant (`.widget-card`), qui a déjà son propre `box-shadow`. Un `box-shadow` sur la cellule dessinerait l'ombre de son rectangle à elle. `drop-shadow` prend la forme réellement peinte (la carte arrondie) et lui ajoute une grande ombre, sans toucher au style de la carte. `translate` et `scale` sont au chapitre 09.

### 4.6 Les anneaux du header

[MainHeader.tsx](../../apps/web/src/layout/Header/MainHeader.tsx), l. 15 et l. 39 :

```tsx
const avatarClasses = "h-8 w-8 overflow-hidden rounded-full ring-1 ring-line [&>img]:h-full [&>img]:w-full [&>img]:object-cover";
...
<span className="pointer-events-none absolute top-2 right-2 h-2 w-2 rounded-full bg-accent ring-2 ring-surface" aria-hidden="true" />
```

- L'avatar a un anneau fin couleur `line`, pour détacher la photo du fond.
- La pastille de notification a un anneau de 2px **couleur du fond** (`ring-surface`) : il « découpe » la pastille de l'icône de cloche qu'elle chevauche.

Même idée dans les anneaux animés : celui d'un widget qui vient d'être ajouté (`widget-ring`, [widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css) l. 70 à 79, un `box-shadow: 0 0 0 3px` qui s'élargit à 10px) et la pulsation de la pastille « Unsaved changes » (l. 473 à 476).

### 4.7 Le reflet qui défile du squelette de chargement

[widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), l. 317 à 319 et 326 à 329 :

```css
        background: linear-gradient(90deg, var(--color-canvas) 25%, var(--color-line) 50%, var(--color-canvas) 75%);
        background-size: 200% 100%;
        animation: skeleton-shine 1.4s linear infinite;
...
    @keyframes skeleton-shine {
        from { background-position: 100% 0; }
        to { background-position: -100% 0; }
    }
```

- Le dégradé est clair, puis un peu plus foncé au milieu, puis clair : une bande de « reflet ».
- `background-size: 200% 100%` : l'image du dégradé est deux fois plus large que la barre. On n'en voit que la moitié.
- L'animation fait glisser cette image (`background-position`) : la bande passe d'un bord à l'autre, en boucle.

### 4.8 Les guides de la grille : dégradé + masque

[widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), l. 530 à 541 :

```css
        .widget-grid::before {
            content: "";
            position: absolute;
            inset: 0;
            z-index: 0;
            pointer-events: none;
            opacity: 0;
            background-image: linear-gradient(to right, color-mix(in oklch, var(--color-accent-soft) 70%, transparent) var(--col-w), transparent var(--col-w));
            background-size: calc(var(--col-w) + var(--gap)) 100%;
            mask-image: linear-gradient(to bottom, #000 var(--col-w), transparent var(--col-w));
            mask-size: 100% calc(var(--col-w) + var(--gap));
            transition: opacity var(--motion-slow) var(--ease-out-soft);
        }
```

C'est l'effet le plus astucieux de l'app. Il dessine une case pâle sous chaque emplacement de la grille, sans aucun élément HTML :

```
1) background : bandes verticales       2) mask : bandes horizontales       3) résultat : des cases
   ███ ███ ███ ███                          ███████████████                     ███ ███ ███ ███
   ███ ███ ███ ███                          (rien : l'espace)                   
   ███ ███ ███ ███                          ███████████████                     ███ ███ ███ ███
```

- `background-image` : un **arrêt net** (même position `var(--col-w)` pour la couleur et le transparent). Une bande colorée de la largeur d'une colonne, puis du vide.
- `background-size: calc(col-w + gap) 100%` : cette image fait une colonne + un espace de large. Un fond se **répète** par défaut, donc la bande revient à chaque colonne.
- `mask-image` : un **masque** décide de ce qui reste visible. Noir = visible, transparent = caché. Ici une bande horizontale visible de la hauteur d'une ligne, puis l'espace caché, répétée grâce à `mask-size`.
- Colonnes × lignes = une case par emplacement. `--col-w` et `--gap` sont expliqués au chapitre 07.
- `opacity: 0` puis `opacity: 1` en mode édition (l. 544 à 546), avec une transition : les guides apparaissent en fondu.

## 5. Pièges

- **Oublier que le premier fond est dessus** : dans `background-image: a, b`, c'est `a` qui recouvre `b`.
- **Mettre un dégradé dans `background-color`** : ça ne marche pas, un dégradé est une image (`background-image` ou `background`).
- **`background-clip: text` sans `color: transparent`** : la couleur du texte recouvre le dégradé, on ne le voit pas.
- **Un `::before` sans `content`** : il n'existe pas. En CSS pur, écris toujours `content: ""`.
- **Un reflet qui déborde des coins arrondis** : il faut `overflow: hidden` sur le parent.
- **Empiler plusieurs `box-shadow` par des classes différentes** : en CSS pur, la dernière déclaration remplace les autres. Tailwind contourne ça avec ses variables (`--tw-shadow`, `--tw-ring-shadow`), mais une règle `box-shadow` écrite à la main dans un fichier CSS écrase tout. C'est pourquoi le widget tenu utilise `filter` et pas `box-shadow`.
- **Abuser du flou** : `backdrop-filter: blur()` et les grandes ombres floues coûtent du calcul au navigateur. La charte a d'ailleurs abandonné le verre dépoli du header et de la sidebar.

## 6. À retenir

- Un dégradé est une image de fond. On peut en empiler plusieurs, le premier est dessus.
- `radial-gradient` centré hors de l'écran donne un halo doux ; `background-clip: text` met un dégradé dans du texte.
- Une ombre réaliste = deux ombres (contact + ambiance). Un étalement négatif cache l'ombre sur les côtés ; `inset` la met dedans ; un étalement seul dessine un anneau (les rings de Tailwind).
- `drop-shadow` suit la forme réellement dessinée, `box-shadow` suit le rectangle.
- Un pseudo-élément `::before` ajoute un calque décoratif sans toucher au HTML.

## 7. Exercice

Dans [index.css](../../apps/web/src/assets/css/index.css), sur une branche de test ou en annulant ensuite avec `git restore`, change temporairement l'étalement de `--shadow-brand` de `-4px` à `4px`. Regarde le logo et le bouton Save du mode édition. Puis remets `-4px` et change l'angle de `--brand-gradient` de `135deg` à `90deg`.

<details><summary>Solution</summary>

- Avec `4px`, l'ombre devient plus grande que l'élément : la lueur violette déborde aussi sur les côtés et au-dessus. Le bouton paraît « baveux ». Avec `-4px`, elle ne se voit que dessous.
- Avec `90deg`, le dégradé va de gauche à droite au lieu de la diagonale. Sur une tuile carrée comme le logo, le bleu est à gauche et le violet à droite, sans le sens « lumière en haut à gauche » de la diagonale.

Annule avec `git restore apps/web/src/assets/css/index.css`.
</details>
