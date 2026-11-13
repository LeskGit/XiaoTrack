# 08. Container queries : @container, cqi et cqh

> **Prérequis :** chapitres 01 (variables CSS) et 07 (layout et grille). **Lecture :** ~20 min. **Fichiers concernés :** `widget-grid.css`, `MainContent.tsx`.

## 1. Le problème

Deux questions se posaient pour le dashboard :

1. **Quand passer de 12 colonnes à une seule ?** La réponse naïve est « quand l'écran est étroit ». Mais la grille ne dispose pas de toute la largeur de l'écran : la sidebar en prend 16rem, le padding un peu plus. Et le jour où la sidebar sera repliable, la place disponible changera sans que l'écran change. Ce qui compte, c'est la largeur **de la zone de la grille**, pas celle de la fenêtre.
2. **Comment dimensionner le texte d'un widget ?** Un widget 2×1 et un widget 4×3 affichent le même chiffre. Dans le petit, « 1,840 » doit être modeste ; dans le grand, il doit remplir l'espace. La taille du texte doit suivre **la taille de la cellule**, pas celle de l'écran.

Les *media queries* classiques (`@media (min-width: ...)`) ne savent répondre qu'à « quelle est la largeur de la fenêtre ? ». Il fallait un outil qui demande « quelle est la taille de mon conteneur ? ».

## 2. La notion

### 2.1 Media query ou container query

```
@media (min-width: 780px)        → « la FENÊTRE fait-elle au moins 780px ? »
@container grid (min-width: 780px) → « le CONTENEUR nommé grid fait-il au moins 780px ? »
```

```
┌──────────────── fenêtre : 1400px ─────────────────┐
│ sidebar │┌──────── conteneur grid : ~1100px ─────┐│
│  16rem  ││  ┌─ cellule : 180px ─┐                 ││
│         ││  │  conteneur cell    │                 ││
│         ││  └────────────────────┘                 ││
│         │└────────────────────────────────────────┘│
└───────────────────────────────────────────────────┘
```

Chaque niveau répond à sa propre question.

### 2.2 Déclarer un conteneur

Un élément ne devient un conteneur interrogeable que si on le déclare :

```css
.frame {
    container-type: inline-size;   /* on pourra interroger sa largeur */
    container-name: grid;          /* et l'appeler par son nom */
}

/* raccourci équivalent : container: nom / type */
.frame { container: grid / inline-size; }
```

Les deux types utiles :

- **`inline-size`** : on peut interroger sa **largeur** (la dimension « en ligne », celle dans laquelle le texte s'écrit). Sa hauteur reste libre de suivre son contenu. C'est le cas le plus courant.
- **`size`** : on peut interroger sa largeur **et** sa hauteur. Contrepartie : sa taille ne doit **pas** dépendre de son contenu (sinon on tournerait en rond : le texte dépend de la hauteur, qui dépend du texte…). Il faut donc que quelqu'un d'autre lui impose ses dimensions, par exemple une cellule de grille.

Le **nom** sert à viser un conteneur précis quand plusieurs sont emboîtés. Sans nom, `@container (...)` interroge le plus proche conteneur ancêtre.

### 2.3 La règle `@container`

```css
@container grid (min-width: 780px) {
    .widget-grid { grid-template-columns: repeat(12, minmax(0, 1fr)); }
}
```

Les règles à l'intérieur ne s'appliquent que si le conteneur `grid` fait au moins 780px de large. Attention : un conteneur ne peut pas se styler lui-même avec sa propre container query, seulement ses **descendants**.

### 2.4 Les unités de conteneur

| Unité | Vaut 1 % de… |
|---|---|
| `cqi` | la largeur (inline) du conteneur |
| `cqb` | la hauteur (block) du conteneur |
| `cqw` / `cqh` | la largeur / la hauteur du conteneur (dans un sens d'écriture horizontal, comme `cqi` / `cqb`) |

`100cqi` = toute la largeur du conteneur. Chaque unité se mesure sur le **plus proche ancêtre conteneur** qui expose la bonne dimension : `cqh` a donc besoin d'un conteneur de type `size`. S'il n'y a pas de conteneur, le navigateur se rabat sur les dimensions de la fenêtre.

### 2.5 `clamp()`, `min()` et `max()`

Des fonctions de calcul qui servent beaucoup avec ces unités :

- `min(a, b)` : la plus petite des deux valeurs.
- `max(a, b)` : la plus grande.
- `clamp(min, idéal, max)` : la valeur idéale, mais jamais en dessous de `min` ni au-dessus de `max`. C'est un `max(min, min(idéal, max))`.

```css
font-size: clamp(20px, 12cqi, 48px);
/* 12 % de la largeur du conteneur, mais au moins 20px et au plus 48px */
```

## 3. Exemple minimal

```html
<style>
  .frame { container: box / inline-size; resize: horizontal; overflow: auto;
           width: 400px; border: 2px dashed #99f; padding: 8px; }
  .content { display: grid; grid-template-columns: 1fr; gap: 8px; }
  .content div { background: #eef; padding: 8px; font-size: clamp(14px, 6cqi, 40px); }
  @container box (min-width: 500px) {
    .content { grid-template-columns: 1fr 1fr 1fr; }
  }
</style>
<div class="frame">
  <div class="content"><div>Un</div><div>Deux</div><div>Trois</div></div>
</div>
```

Le cadre pointillé se redimensionne avec la poignée en bas à droite (`resize: horizontal`). À observer : au-delà de 500px de cadre, les blocs passent sur trois colonnes ; et le texte grandit avec le cadre, entre 14 et 40px. La fenêtre, elle, n'a pas changé de taille.

## 4. Dans XiaoTrack

### 4.1 Le conteneur de la grille : bureau ou téléphone

[widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), l. 4 à 6 :

```css
    .widget-grid-frame {
        container: grid / inline-size;
    }
```

Le cadre qui entoure la grille ([WidgetGrid.tsx](../../apps/web/src/components/widgets/WidgetGrid.tsx), l. 88 : `<div className="widget-grid-frame">`) devient un conteneur nommé `grid`, interrogeable en largeur. Il ne fait rien d'autre : pas de padding, pour que `100cqi` soit exactement la largeur disponible pour la grille.

Le mode téléphone est écrit par défaut (l. 9 à 19 : une colonne, des lignes de 110px), et le mode bureau s'ajoute au-dessus du seuil, l. 514 :

```css
    @container grid (min-width: 780px) {
        .widget-grid {
            grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
            grid-auto-rows: var(--col-w);
            gap: var(--gap);
        }
        ...
        .widget-toolbar {
            display: flex;
        }

        .widget-edit-bar {
            display: flex;
        }
```

- Quand la zone de la grille fait au moins 780px : 12 colonnes, positions respectées (chapitre 07), et les outils d'édition apparaissent (barre d'outils, barre d'édition, bouton « Add your first widget »).
- En dessous : une seule colonne en ordre de lecture, et pas d'édition. Il n'y a **pas de mode intermédiaire** : c'est une décision du cadrage V1.
- Comme la question porte sur le conteneur, un écran de 1000px avec la sidebar donne une zone de grille d'environ 700px : on est en mode téléphone, alors qu'une media query aurait dit « bureau ».

### 4.2 Les unités `cqi` dans le calcul de la grille

[widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), l. 10 à 12 :

```css
        --gap: 0.6cqi;
        /* One column (= one row, the cells are square), in desktop mode */
        --col-w: calc((100cqi - (var(--cols) - 1) * var(--gap)) / var(--cols));
```

- `.widget-grid` est à l'intérieur du conteneur `grid` : `100cqi` vaut donc la largeur du cadre.
- `--gap: 0.6cqi` : l'espace entre les cases est proportionnel à la largeur. Sur une grille de 1000px, 6px ; sur 1500px, 9px. Toute la grille grandit d'un bloc, espaces compris, comme une image qu'on agrandit.
- `--col-w` : la largeur exacte d'une colonne. Elle sert aussi de hauteur de ligne (`grid-auto-rows: var(--col-w)`), d'où les cases carrées.

### 4.3 La cellule, conteneur de taille

[widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), l. 27 et 28 :

```css
        /* Size container: the bodies scale their text with the cell (cqi / cqh units) */
        container: cell / size;
```

- Chaque `.widget-cell` est un conteneur **de type `size`** nommé `cell`.
- C'est possible parce que sa taille ne dépend pas de son contenu : c'est la grille qui l'impose (tant de colonnes de large, tant de lignes de haut).
- À l'intérieur d'une cellule, `cqi` et `cqh` parlent donc de **la cellule**, plus de la grille : c'est le conteneur le plus proche.

### 4.4 Les textes et espacements qui suivent la cellule

La carte, l. 86 et 88 :

```css
        gap: clamp(4px, 3cqh, 10px);
        ...
        padding: clamp(10px, 4cqi, 16px);
```

L'espace entre l'en-tête et le contenu suit la hauteur de la cellule (3 %, entre 4 et 10px) ; le padding suit sa largeur (4 %, entre 10 et 16px). Un petit widget est plus serré, un grand plus aéré.

Le chiffre d'un widget stat, l. 213 :

```css
        font-size: clamp(var(--text-heading), min(12cqi, 26cqh), 3rem);
```

Lis-le de l'intérieur vers l'extérieur :

1. `12cqi` : 12 % de la largeur de la cellule. `26cqh` : 26 % de sa hauteur.
2. `min(...)` : on prend le plus petit des deux. Ainsi le chiffre tient à la fois en largeur **et** en hauteur, que le widget soit large et bas ou étroit et haut.
3. `clamp(var(--text-heading), ..., 3rem)` : jamais moins de 20px (le niveau `heading` de l'échelle), jamais plus de 48px.

C'est l'exception prévue par la charte (§5) : la valeur d'un widget suit sa cellule, entre `heading` et 48px.

L'unité, juste à côté (l. 223), utilise l'autre fonction :

```css
        font-size: max(var(--text-caption), 0.4em);   /* never below the caption size */
```

`0.4em` = 40 % de la taille du chiffre. Mais `max()` empêche de descendre sous 12px : avant la migration, dans un widget 2×1, « kcal » tombait à 7px et devenait illisible.

La dernière valeur d'un graphique, l. 248 :

```css
        font-size: clamp(var(--text-title), 6cqh, 1.5rem);
```

6 % de la hauteur de la cellule, entre 16 et 24px.

### 4.5 Le conteneur du contenu principal

[MainContent.tsx](../../apps/web/src/layout/MainContent/MainContent.tsx), l. 6 :

```tsx
        <main className="@container/content grid min-h-0 content-start overflow-y-auto">
```

`@container/content` est la version Tailwind de `container: content / inline-size`. Une page pourrait ensuite utiliser des variantes comme `@md/content:grid-cols-2` (« quand le conteneur `content` est assez large »). Honnêtement : à ce jour, aucune page n'utilise ces variantes. Le conteneur est déclaré, prêt pour les prochains écrans, mais il ne sert encore à rien.

## 5. Pièges

- **Interroger un élément qui n'est pas déclaré conteneur** : `@container` ne trouve rien et la règle ne s'applique jamais. Les unités `cq*` se rabattent alors sur la fenêtre, sans erreur visible.
- **Vouloir styler le conteneur avec sa propre query** : impossible. Une container query ne s'applique qu'aux descendants. C'est pour ça que `.widget-grid-frame` (le conteneur) et `.widget-grid` (le stylé) sont deux éléments distincts.
- **Mettre `container-type: size` sur un élément dont la hauteur vient de son contenu** : sa hauteur s'effondre à 0, car le contenu n'est plus pris en compte. Réserve `size` aux éléments dont la taille est imposée de l'extérieur (une cellule de grille, un élément à hauteur fixe).
- **Ajouter du padding au conteneur** : `100cqi` mesure la boîte de contenu du conteneur. Un padding ailleurs dans la chaîne fausse vite les calculs ; ici, le padding est mis sur un parent (`p-4`), pas sur le cadre.
- **Oublier les bornes** : `font-size: 12cqi` seul peut donner 4px dans une cellule minuscule ou 90px dans une énorme. Toujours encadrer avec `clamp()`.

## 6. À retenir

- Une media query regarde la fenêtre, une container query regarde un ancêtre déclaré avec `container: nom / type`.
- `inline-size` pour interroger la largeur ; `size` pour largeur et hauteur, à condition que la taille soit imposée de l'extérieur.
- `cqi` / `cqh` = 1 % de la largeur / hauteur du plus proche conteneur. Dans une cellule de widget, c'est la cellule.
- `clamp(min, idéal, max)` borne une taille fluide ; `min()` et `max()` choisissent entre deux valeurs.

## 7. Exercice

Le dashboard en mode bureau, avec quelques widgets de tailles différentes.

1. Réduis peu à peu la largeur de la fenêtre (ou utilise le mode responsive des DevTools). Note la largeur de **fenêtre** à laquelle la grille passe en une seule colonne. Pourquoi ce n'est pas 780px ?
2. Dans les DevTools, sélectionne un `.widget-cell` d'un widget stat, et dans *Styles*, remplace `container: cell / size` par `container: cell / inline-size`. Que devient le gros chiffre ?

<details><summary>Solution</summary>

1. La grille bascule quand **sa zone** passe sous 780px. La fenêtre fait alors environ 780px + 16rem de sidebar (256px) + le padding `p-4` des deux côtés (32px), soit un peu plus de 1060px. Une media query à 780px aurait basculé bien trop tard.
2. Avec `inline-size`, la cellule n'expose plus sa hauteur : `26cqh` ne la trouve plus et se mesure sur le prochain conteneur qui expose une hauteur, ou à défaut sur la fenêtre. Le chiffre ne s'adapte plus à la hauteur du widget (et peut grossir dans un widget bas). Recharge pour annuler.
</details>
