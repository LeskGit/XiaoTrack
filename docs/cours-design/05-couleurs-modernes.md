# 05. Couleurs modernes : oklch, color-mix et tokens sémantiques

> **Prérequis :** chapitres 01 (variables CSS) et 03 (Tailwind `@theme`). **Lecture :** ~20 min. **Fichiers concernés :** `index.css`, `widget-grid.css`, `domainTone.styles.ts`, `CategorySidebar.tsx`.

## 1. Le problème

Avant la refonte, les composants écrivaient leurs couleurs « en dur » : `bg-sky-50`, `text-gray-500`, `rgb(15 23 42 / 0.18)`. Trois soucis en découlaient :

1. **Aucun sens.** `gray-500` dit *quelle* couleur, pas *à quoi elle sert*. Le jour où on veut changer la couleur des textes secondaires, il faut retrouver tous les `gray-500`… et deviner lesquels sont des textes secondaires et lesquels sont des bordures.
2. **Pas de variantes faciles.** Pour un fond « l'accent, mais en très clair », ou « l'ombre, mais à 8 % d'opacité », on devait inventer une nouvelle couleur à la main.
3. **Pas de mode sombre possible.** Une couleur écrite dans 40 fichiers ne peut pas changer d'un coup.

Il nous fallait donc : un espace de couleurs où les nuances se calculent proprement (oklch), un moyen de mélanger des couleurs existantes (color-mix), et des noms par rôle (tokens sémantiques).

## 2. La notion

### 2.1 Les anciennes écritures : hex et rgb

Un écran mélange trois lumières : rouge, vert, bleu. `#4f46e5` et `rgb(79 70 229)` décrivent la même couleur : 79 de rouge, 70 de vert, 229 de bleu (chaque canal va de 0 à 255).

C'est la langue de l'écran, pas celle de l'œil. Si tu veux « le même indigo, un peu plus clair », il faut toucher aux trois chiffres à la fois, sans savoir lesquels.

### 2.2 oklch : décrire une couleur comme on la perçoit

`oklch(L C H)` décrit une couleur avec trois réglages qui ont un sens pour un humain :

```
oklch( 0.585   0.233   277 )
        │       │       └─ H, teinte (hue) : un angle sur le cercle des couleurs, de 0 à 360
        │       │            ~25 rouge · ~70 orange/ambre · ~145 vert · ~190 turquoise · ~260 bleu · ~277 indigo · ~300 violet
        │       └───────── C, chroma : l'intensité de la couleur. 0 = gris, ~0.37 = le plus vif possible
        └───────────────── L, luminosité (lightness) : 0 = noir, 1 = blanc
```

Le « ok » du nom vient de l'espace de couleurs **Oklab**, construit pour être **perceptuellement régulier** : deux couleurs avec le même `L` paraissent vraiment aussi claires l'une que l'autre, quelle que soit leur teinte. Ce n'est pas le cas de l'ancien `hsl()` : en `hsl`, un jaune et un bleu à « 50 % de luminosité » n'ont pas du tout l'air aussi clairs.

Conséquence pratique : pour faire une nuance, on ne touche qu'à un chiffre.

```
--color-accent:        oklch(0.585 0.233 277);   /* indigo moyen          */
--color-accent-strong: oklch(0.457 0.24  277);   /* même teinte, plus sombre */
--color-accent-soft:   oklch(0.962 0.018 272);   /* très clair, presque blanc */
```

### 2.3 Le canal alpha : la transparence

Toutes ces écritures acceptent une quatrième valeur après une barre oblique : l'**alpha**, de 0 (invisible) à 1 (opaque).

```css
oklch(0.9 0.07 265 / 0.45)   /* un bleu clair à 45 % d'opacité */
rgb(49 46 129 / 0.08)        /* un indigo foncé à 8 % */
```

### 2.4 `color-mix()` : mélanger deux couleurs

```css
color-mix(in oklch, A 30%, B)
```

se lit « mélange A et B, dans l'espace oklch, avec 30 % de A ». B reçoit le reste, soit 70 %. On peut aussi mettre le pourcentage sur B : `color-mix(in oklch, A, B 35%)` donne 65 % de A et 35 % de B.

Deux usages très fréquents :

- **éclaircir** une couleur en la mélangeant avec du blanc : `color-mix(in oklch, var(--tone) 13%, white)` ;
- **la rendre transparente** en la mélangeant avec `transparent` : `color-mix(in oklch, var(--color-ink) 30%, transparent)` donne l'encre à 30 % d'opacité.

C'est ce qui permet de dériver une couleur d'un token **sans connaître sa valeur**.

### 2.5 Le piège des variables et de l'alpha, et l'astuce « r g b »

On voudrait écrire « la couleur de l'ombre, à 8 % ». Si la variable contient une couleur complète, on ne peut pas lui ajouter d'alpha :

```css
--shadow-color: rgb(49 46 129);
box-shadow: 0 1px 2px rgb(var(--shadow-color) / 0.08);  /* ✗ devient rgb(rgb(49 46 129) / 0.08) : invalide */
```

L'astuce consiste à stocker **seulement les trois nombres** :

```css
--shadow-tint: 49 46 129;
box-shadow: 0 1px 2px rgb(var(--shadow-tint) / 0.08);   /* ✓ devient rgb(49 46 129 / 0.08) */
```

Ça marche parce que `var()` est remplacé par son texte **avant** que le navigateur lise la couleur (voir chapitre 01). Les navigateurs récents ont aussi une syntaxe plus moderne, `rgb(from var(--c) r g b / 0.08)`, mais l'astuce « r g b » marche partout et reste la plus simple à lire.

### 2.6 Les tokens sémantiques

Un **token** est une variable de design. Il est **sémantique** quand son nom dit son *rôle*, pas son *apparence* :

| Couleur brute (à éviter dans un composant) | Token sémantique |
|---|---|
| `gray-900` | `ink` (texte principal) |
| `white` | `surface` (fond des cartes) |
| `indigo-500` | `accent` (ce qui se clique) |
| un turquoise | `data-1` (première série d'un graphique) |
| `emerald-50` | `success-soft` (fond d'un message de succès) |

```
  composant ──utilise──▶ token sémantique ──vaut──▶ valeur brute
  .widget-card            --color-surface            #ffffff
```

Le composant ne connaît que le rôle. Changer la valeur ne touche qu'une ligne. Et le **mode sombre** devient possible : il suffira de redéfinir les mêmes tokens avec d'autres valeurs (par exemple sous `@media (prefers-color-scheme: dark)`), sans ouvrir un seul composant.

## 3. Exemple minimal

Colle ceci dans un fichier `test.html` et ouvre-le :

```html
<style>
  :root {
    --accent: oklch(0.585 0.233 277);
    --tint: 49 46 129;
  }
  .box { width: 120px; height: 60px; display: inline-block; margin: 8px; border-radius: 10px; }
</style>

<div class="box" style="background: var(--accent)"></div>
<div class="box" style="background: oklch(0.457 0.24 277)"></div>
<div class="box" style="background: color-mix(in oklch, var(--accent) 13%, white)"></div>
<div class="box" style="background: color-mix(in oklch, var(--accent) 30%, transparent)"></div>
<div class="box" style="background: white; box-shadow: 0 6px 16px rgb(var(--tint) / 0.2)"></div>
```

À observer : 1) l'indigo ; 2) le même plus sombre (seul `L` a bougé) ; 3) un indigo très pâle, obtenu sans écrire de nouvelle couleur ; 4) un indigo translucide ; 5) une carte blanche avec une ombre teintée indigo.

## 4. Dans XiaoTrack

### 4.1 Les tokens, dans `@theme`

[index.css](../../apps/web/src/assets/css/index.css), l. 12 à 55 (extrait) :

```css
    /* ── Surfaces and lines ── */
    --color-canvas: oklch(0.982 0.004 285);           /* page background, under the halos */
    --color-surface: #ffffff;                         /* cards, header, sidebar, bars */
    ...
    /* ── Text ── (replaces gray-900 / gray-600 / gray-400) */
    --color-ink: oklch(0.21 0.02 280);
    --color-ink-soft: oklch(0.45 0.02 280);
    --color-ink-muted: oklch(0.55 0.015 280);
    ...
    /* ── Data: charts and progress only. A single series is always data-1 ── */
    --color-data-1: oklch(0.72 0.13 190);             /* turquoise */
    ...
    --color-success: oklch(0.596 0.145 163);          /* emerald-500 */
    --color-success-soft: oklch(0.979 0.021 166);
    --color-success-strong: oklch(0.432 0.095 166);
```

- Chaque nom commence par `--color-` : c'est l'espace de noms de Tailwind (chapitre 03). Tailwind crée donc `bg-surface`, `text-ink-muted`, `border-line`…
- Lis la colonne `L` des textes : `0.21`, `0.45`, `0.55`. Trois gris de plus en plus clairs, avec la même teinte (280) et une chroma minuscule (`0.02`) : des gris très légèrement violacés, accordés à la marque.
- Le canvas (`L = 0.982`, chroma `0.004`) est un blanc *à peine* teinté. C'est ce qui donne à l'app sa nuance violette sans qu'on la remarque.
- Chaque statut existe en trois rôles : plein (`success`), doux pour les fonds (`-soft`, `L` proche de 1) et fort pour le texte (`-strong`, `L` bas pour être lisible sur fond clair).
- Les domaines (l. 51 à 55) ont tous une chroma de 0.14 à 0.21 et une luminosité de 0.62 à 0.78 : ils ont à peu près la même « force » visuelle. C'est oklch qui rend cet équilibre facile à régler.

### 4.2 Les variables hors `@theme`

[index.css](../../apps/web/src/assets/css/index.css), l. 91 à 100 :

```css
:root {
    /* The shadow tint, as "r g b": the day dark mode comes, only this line changes */
    --shadow-tint: 49 46 129;
    ...
    /* Overlay behind modals: the ink colour, see-through */
    --color-scrim: color-mix(in oklch, var(--color-ink) 30%, transparent);
```

- `--shadow-tint` contient les trois nombres de l'indigo-900 (`#312e81`), selon l'astuce du §2.5. Les ombres de `@theme` (l. 79 à 81) l'utilisent : `rgb(var(--shadow-tint) / 0.05)`.
- `--color-scrim` est le voile derrière les modales : l'encre à 30 %. Il est déclaré dans `:root` et non dans `@theme`, donc Tailwind ne génère pas de classe `bg-scrim` : il n'est lu que par [modal.css](../../apps/web/src/components/modals/modal.css) (l. 45, `background-color: var(--color-scrim);`).

### 4.3 `tone-tile` : une teinte de domaine éclaircie

[index.css](../../apps/web/src/assets/css/index.css), l. 123 à 126 :

```css
@utility tone-tile {
    background-color: color-mix(in oklch, var(--tone, var(--color-accent)) 13%, white);
    color: var(--tone, var(--color-accent));
}
```

- `var(--tone, var(--color-accent))` : la couleur du domaine si `--tone` est défini, sinon l'accent (la valeur de secours, chapitre 01).
- Le fond est cette couleur à 13 % dans du blanc : une version très pâle. L'icône, elle, prend la couleur pure.
- Une seule règle sert donc à six domaines : on ne fournit que la couleur de base.

D'où vient `--tone` ? De [domainTone.styles.ts](../../apps/web/src/shared/styles/domainTone.styles.ts), l. 8 à 15 :

```ts
export const domainToneMap = {
    dashboard: "var(--color-accent)",
    nutrition: "var(--color-domain-nutrition)",
    ...
} as const satisfies Record<MainDomain, string>;
```

Les valeurs sont des **chaînes CSS** qui pointent vers les tokens. [CategorySidebar.tsx](../../apps/web/src/layout/Sidebar/CategorySidebar.tsx), l. 29, les pose sur le lien :

```tsx
style={{ "--tone": tone } as CSSProperties}
```

Et la tuile active (l. 18) utilise `bg-(--tone) text-white` : le fond prend la couleur pure, l'icône devient blanche.

### 4.4 Survol d'un bouton doux

[index.css](../../apps/web/src/assets/css/index.css), l. 197 à 199 :

```css
    .btn-soft:hover:not(:disabled) {
        background-color: color-mix(in oklch, var(--color-accent-soft), var(--color-accent-line) 35%);
    }
```

Au survol, le fond pâle (`accent-soft`, 65 %) se fonce un peu en recevant 35 % de `accent-line`. Aucune nouvelle couleur n'a été inventée.

### 4.5 La pulsation « Unsaved changes » et les guides

[widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css), l. 473 à 476 :

```css
    @keyframes dot-pulse {
        from { box-shadow: 0 0 0 0 color-mix(in oklch, var(--color-warning) 50%, transparent); }
        to { box-shadow: 0 0 0 8px transparent; }
    }
```

Un anneau qui part de l'ambre à 50 % d'opacité et s'efface en grandissant (les `@keyframes` sont au chapitre 11). Avant la migration, cet ambre était écrit en dur : `oklch(0.769 0.188 70.08 / 0.5)`. Maintenant il suit le token `warning`.

Même principe pour les guides de la grille (l. 537 : `color-mix(in oklch, var(--color-accent-soft) 70%, transparent)`), le placeholder du drag (l. 381) et le fond translucide de la barre d'édition (l. 434 : `color-mix(in oklch, var(--color-surface) 88%, transparent)`).

## 5. Pièges

- **Mettre un alpha sur une variable qui contient une couleur complète** : `rgb(var(--c) / 0.5)` avec `--c: #312e81` est invalide. Utilise l'astuce « r g b » ou `color-mix(..., transparent)`.
- **Oublier `in oklch`** : `color-mix()` exige l'espace de mélange. Le résultat change selon l'espace (`in srgb` donne des mélanges plus ternes au milieu).
- **Pousser la chroma trop haut** : au-delà de ce que l'écran sait afficher, le navigateur ramène la couleur dans les limites. Le résultat est correct, mais pas exactement celui que tu as écrit.
- **Écrire une couleur brute « juste pour cette fois »** : c'est exactement ce qui a fait dériver le système en un jour (ombre en `violet-600` au lieu de `purple-600`, ombre du drag en gris ardoise…). La règle du projet : aucune couleur brute dans un composant.
- **Nommer un token par sa teinte** (`--color-orange`) : le jour où le domaine change de couleur, le nom ment. Nomme par rôle (`--color-domain-nutrition`).

## 6. À retenir

- `oklch(L C H)` décrit une couleur par sa luminosité, son intensité et sa teinte. Une nuance se fait en changeant un seul chiffre.
- `/ 0.5` ajoute de la transparence. `color-mix(in oklch, A x%, B)` dérive une couleur d'un token sans connaître sa valeur.
- Pour ajouter un alpha à une couleur stockée en variable, on stocke seulement `r g b`.
- Les composants n'utilisent que des tokens nommés par rôle. C'est la condition d'un futur mode sombre.

## 7. Exercice

Dans le navigateur, sur le dashboard en mode édition, ouvre les DevTools (F12), onglet *Elements*, sélectionne `<html>` et, dans *Styles*, trouve la règle `:root` de Tailwind.

1. Change `--color-accent` de `oklch(0.585 0.233 277)` en `oklch(0.585 0.233 190)`. Que se passe-t-il, et qu'est-ce qui ne change **pas** ?
2. Change `--shadow-tint` en `0 0 0`. Regarde les cartes.

<details><summary>Solution</summary>

1. Tout ce qui utilise l'accent passe au turquoise : barre active de la sidebar, survol des boutons fantômes, bordure des cartes survolées en édition, pastille de notification, tuile du Dashboard. Ce qui ne bouge pas : le dégradé du logo et du bouton Save (il utilise les couleurs Tailwind `blue-500`, `indigo-500`, `purple-600`, pas le token), les `accent-soft` / `accent-strong` / `accent-line` (ce sont des tokens séparés, écrits en dur dans `@theme`). C'est une limite du système actuel : les variantes ne sont pas encore *dérivées* de l'accent.
2. Toutes les ombres deviennent grises au lieu d'indigo : une seule ligne a changé toutes les élévations. C'est ce qu'on fera pour le mode sombre.

Recharge la page pour annuler : les DevTools ne modifient pas le fichier.
</details>
