# 03. Tailwind v4 : `@import` et `@theme`

> **Prérequis :** chapitres 01 et 02. **Lecture :** ~25 min. **Fichiers concernés :** `vite.config.ts`, `index.css`, `main.tsx`, et tous les `.tsx` qui utilisent des classes comme `bg-surface` ou `text-label`.

## 1. Le problème

Avant la refonte, le code écrivait des couleurs de la palette Tailwind en dur : `text-gray-500`, `bg-sky-50`, `border-gray-200`. Trois soucis :

- **Aucun sens.** `gray-500` dit « gris moyen », pas « texte secondaire ». Le jour où on veut des textes secondaires un peu plus foncés, il faut retrouver tous les `gray-500`... et deviner lesquels sont des textes secondaires.
- **Aucune cohérence.** Rien n'empêche un composant d'utiliser `gray-500` et un autre `gray-600` pour le même rôle. C'est ce que la revue avait trouvé : trois tailles de texte « au feeling » (11, 15, 22 px).
- **Pas de mode sombre possible.** Un `bg-white` écrit en dur restera blanc.

On voudrait des noms **de rôle** (`text-ink-muted`, `bg-surface`, `text-label`), définis une seule fois, et que Tailwind en fasse des classes comme les siennes. C'est exactement ce que fait `@theme`.

## 2. La notion

### 2.1 Comment Tailwind v4 est branché

Tailwind est un **générateur de CSS** : il lit tes fichiers source, repère les noms de classes que tu utilises (`flex`, `p-4`, `bg-surface`...) et produit uniquement le CSS correspondant.

La version 4 s'installe en deux morceaux, et **sans fichier `tailwind.config.js`** :

1. **Un plugin Vite**, qui fait tourner Tailwind à chaque compilation du CSS.
2. **Une ligne d'import dans ta feuille principale** : `@import "tailwindcss";`. Elle charge les couches (`theme`, `base`, `components`, `utilities`, voir chapitre 02), le thème par défaut (la palette `gray-*`, `blue-*`, les tailles `text-sm`...) et la remise à zéro du navigateur.

Toute la configuration se fait ensuite **en CSS**, dans cette même feuille.

### 2.2 `@theme` : déclarer des tokens qui deviennent des classes

Un **token de design** est une valeur nommée par son rôle : la couleur du texte secondaire, la taille d'un libellé, l'arrondi d'une carte.

Dans un bloc `@theme`, tu déclares des variables CSS dont le nom commence par un **espace de noms** connu de Tailwind. Tailwind fait alors deux choses :
- il crée la variable CSS sur `:root` (tu peux la lire avec `var()`, comme au chapitre 01) ;
- il génère les classes utilitaires correspondantes.

| Espace de noms | Exemple de variable | Classes générées |
|---|---|---|
| `--color-*` | `--color-surface` | `bg-surface`, `text-surface`, `border-surface`, `ring-surface`... |
| `--text-*` | `--text-label` | `text-label` (taille de police) |
| `--radius-*` | `--radius-lg` | `rounded-lg`, `rounded-t-lg`... |
| `--shadow-*` | `--shadow-card` | `shadow-card` |
| `--ease-*` | `--ease-out-soft` | `ease-out-soft` (courbe de transition) |
| `--font-*` | `--font-sans` | `font-sans` (famille de police) |

La partie après l'espace de noms devient le nom de la classe : `--color-ink-muted` donne `text-ink-muted`, `bg-ink-muted`, etc. Une seule variable `--color-*` fournit donc la couleur à **toutes** les propriétés qui acceptent une couleur.

### 2.3 Les sous-variables des tailles de texte

Pour `--text-*`, Tailwind accepte des variables compagnes, suffixées par `--` :

```css
--text-label: 0.8125rem;
--text-label--line-height: 1.4;
--text-heading--letter-spacing: -0.01em;
```

La classe `text-label` applique alors la taille **et** la hauteur de ligne associée ; `text-heading` applique aussi son espacement de lettres. Une taille de texte arrive ainsi toujours avec ses réglages, au lieu de les répéter partout.

### 2.4 Remplacer une valeur du thème par défaut

Si tu déclares dans `@theme` une variable qui existe déjà dans le thème de Tailwind, **tu la remplaces**. Tailwind définit par défaut `--radius-lg: 0.5rem` (8 px) ; si tu écris `--radius-lg: 14px`, la classe `rounded-lg` vaudra 14 px **dans toute l'app**.

### 2.5 `@theme` ou `:root` ?

Une variable déclarée dans `:root` (hors `@theme`) est une variable CSS ordinaire : lisible avec `var()`, mais **aucune classe n'est générée**. On l'utilise pour les valeurs qui n'ont pas d'espace de noms Tailwind adapté : un dégradé complet, trois nombres RVB, une durée.

### 2.6 Utiliser n'importe quelle variable dans une classe : `bg-(--x)`

Tailwind v4 accepte une variable CSS entre parenthèses dans une classe :

```
bg-(--tone)          → background-color: var(--tone)
shadow-(--shadow-x)  → box-shadow: var(--shadow-x)
```

Pratique pour une valeur dynamique, posée par React en inline style (chapitre 01), qui n'est pas un token.

## 3. Exemple minimal

Dans un projet Vite + Tailwind v4, une feuille CSS :

```css
@import "tailwindcss";

@theme {
    --color-brand-ink: #3b0764;
    --text-tiny: 0.6875rem;
    --text-tiny--line-height: 1.2;
}
```

et un composant :

```tsx
<p className="text-tiny text-brand-ink">Bonjour</p>
```

Le paragraphe s'affiche en 11 px, violet foncé, avec une hauteur de ligne de 1.2. Les classes `text-tiny` et `text-brand-ink` n'existaient pas : elles sont nées de tes deux variables.

## 4. Dans XiaoTrack

### 4.1 Le branchement

[vite.config.ts](../../apps/web/vite.config.ts) l. 3 et 12-14 :

```ts
import tailwindcss from '@tailwindcss/vite'
...
plugins: [
    react(),
    tailwindcss(),
```

[index.css](../../apps/web/src/assets/css/index.css) l. 1 :

```css
@import "tailwindcss";
```

C'est tout. Les versions sont dans [package.json](../../apps/web/package.json) (`tailwindcss` et `@tailwindcss/vite` en `^4.2.0`).

### 4.2 Le bloc `@theme`

[index.css](../../apps/web/src/assets/css/index.css) l. 9-88. Quelques extraits commentés.

**Les couleurs** (l. 13-21) :

```css
--color-canvas: oklch(0.982 0.004 285);           /* page background, under the halos */
--color-surface: #ffffff;                         /* cards, header, sidebar, bars */
...
--color-ink: oklch(0.21 0.02 280);
--color-ink-soft: oklch(0.45 0.02 280);
--color-ink-muted: oklch(0.55 0.015 280);
```

Chaque nom dit un rôle : `canvas` (le fond de page), `surface` (les cartes), `ink` (l'encre, donc le texte). Les valeurs sont en `oklch(...)`, un format de couleur expliqué au chapitre 05.

Ces tokens deviennent des classes partout dans le JSX. Exemples réels :
- [MainHeader.tsx](../../apps/web/src/layout/Header/MainHeader.tsx) l. 30 : `text-caption text-ink-muted`, la date sous le titre ;
- [CategorySidebar.tsx](../../apps/web/src/layout/Sidebar/CategorySidebar.tsx) l. 7 : `bg-surface text-accent-strong shadow-card-hover`, l'entrée active ;
- [Dashboard.tsx](../../apps/web/src/pages/Dashboard.tsx) l. 27 : `rounded-lg border-line-strong bg-surface`, l'état vide.

Et ils restent lisibles en CSS pur, dans les feuilles de composants : `var(--color-line)`, `var(--color-ink-soft)`... (par exemple [widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css) l. 89-90).

**L'échelle typographique** (l. 57-71) :

```css
--text-caption: 0.75rem;                          /* 12px: captions, dates, trends */
--text-caption--line-height: 1.35;
--text-label: 0.8125rem;                          /* 13px: widget titles, labels */
--text-label--line-height: 1.4;
...
--text-heading: 1.25rem;                          /* 20px: page and empty-state titles */
--text-heading--line-height: 1.3;
--text-heading--letter-spacing: -0.01em;
```

Six niveaux (`caption`, `label`, `body`, `title`, `heading`, `display`) qui remplacent les tailles choisies au feeling. `text-heading` sur le nom « XiaoTrack » ([AppHeader.tsx](../../apps/web/src/layout/Header/AppHeader.tsx) l. 24) applique d'un coup 20 px, une hauteur de ligne de 1.3 et un léger resserrement des lettres.

Note la cohabitation : `text-label` (une **taille**, espace `--text-*`) et `text-ink` (une **couleur**, espace `--color-*`) commencent toutes deux par `text-`. Tailwind les distingue par l'espace de noms de la variable qui existe.

**Les arrondis, remplacés volontairement** (l. 73-76) :

```css
/* ── Shapes. These override Tailwind's rounded-sm / -md / -lg on purpose ── */
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;
```

Ces trois noms existent déjà dans Tailwind (avec 4, 6 et 8 px). En les redéclarant, `rounded-md` et `rounded-lg` adoptent la charte dans toute l'app, y compris dans du code écrit avant elle. Les classes `rounded-xl`, `rounded-full`... gardent leurs valeurs par défaut.

**Les ombres et les courbes** (l. 79-87) :

```css
--shadow-card: 0 1px 2px rgb(var(--shadow-tint) / 0.05), 0 1px 3px rgb(var(--shadow-tint) / 0.04);
...
--ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1);
```

Une variable de `@theme` peut lire une autre variable : les ombres utilisent `--shadow-tint`, déclarée dans `:root`. Elles donnent `shadow-card` (CategorySidebar l. 7) ; la courbe donne `ease-out-soft` ([AppHeader.tsx](../../apps/web/src/layout/Header/AppHeader.tsx) l. 15). Les ombres sont détaillées au chapitre 06, les courbes au chapitre 10.

### 4.3 Le bloc `:root` : des variables sans classe

[index.css](../../apps/web/src/assets/css/index.css) l. 91-105 :

```css
:root {
    --shadow-tint: 49 46 129;
    --brand-gradient: linear-gradient(135deg, var(--color-blue-500), var(--color-indigo-500) 50%, var(--color-purple-600));
    --brand-gradient-text: linear-gradient(90deg, ...);
    --color-scrim: color-mix(in oklch, var(--color-ink) 30%, transparent);
    --motion-fast: 150ms;
    --motion-base: 250ms;
    --motion-slow: 400ms;
}
```

Pourquoi pas dans `@theme` ?
- `--shadow-tint` n'est pas une couleur complète, juste trois nombres : une classe `bg-shadow-tint` n'aurait aucun sens.
- `--brand-gradient` est un dégradé : l'espace `--color-*` attend une couleur. Le dégradé est exposé autrement, par une `@utility` (chapitre 04).
- `--motion-*` sont des durées. Tailwind n'a pas d'espace de noms pour des durées nommées : elles sont lues par `var()` dans les feuilles de composants.
- `--color-scrim` commence par `--color-` mais est déclarée dans `:root`, pas dans `@theme` : elle ne génère donc **pas** de classe. Elle sert uniquement dans [modal.css](../../apps/web/src/components/modals/modal.css), pour le voile derrière les modales.

Remarque : `--brand-gradient` lit `--color-blue-500`, `--color-indigo-500` et `--color-purple-600`. Ce sont des variables **du thème par défaut** de Tailwind : elles existent sans qu'on les ait déclarées.

### 4.4 `bg-(--tone)` dans la sidebar

[CategorySidebar.tsx](../../apps/web/src/layout/Sidebar/CategorySidebar.tsx) l. 18 :

```tsx
const tileActive = "bg-(--tone) text-white";
```

`--tone` n'est pas un token, c'est une variable posée en inline style par React (l. 29, voir chapitre 01). `bg-(--tone)` en fait un fond plein : la tuile active prend la couleur pleine de son domaine.

### 4.5 La police auto-hébergée

La police vit au même endroit que les tokens, d'où cette section.

[main.tsx](../../apps/web/src/main.tsx) l. 3-5 :

```ts
// Inter, self-hosted (variable font: every weight from 100 to 900 in one file)
import '@fontsource-variable/inter'
import './assets/css/index.css'
```

- `@fontsource-variable/inter` est un paquet npm qui contient les fichiers de la police Inter et une feuille CSS déclarant la police (`@font-face`) sous le nom `"Inter Variable"`. Vite copie les fichiers de police dans le build : la police est servie par l'app elle-même, sans appel à Google Fonts.
- Une **police variable** contient toutes les graisses (de 100 à 900) dans un seul fichier, au lieu d'un fichier par graisse. `font-weight: 650` est donc possible.
- L'import est placé **avant** `index.css`, pour que la police soit déclarée avant d'être utilisée.

[index.css](../../apps/web/src/assets/css/index.css) l. 10 :

```css
--font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
```

`--font-sans` remplace la famille par défaut de Tailwind. La remise à zéro de Tailwind (couche `base`) applique cette famille à toute la page : aucun composant n'a besoin d'écrire `font-sans`. Les noms suivants sont des **polices de secours**, utilisées tant qu'Inter n'est pas chargée.

## 5. Pièges

- **Une faute de frappe dans un nom de classe ne lève aucune erreur.** `text-ink-mutted` ne génère rien, et le texte garde sa couleur héritée. Le build passe. Il faut regarder l'écran, ou le panneau Styles.
- **Les classes doivent être écrites en entier dans le code.** Tailwind lit tes fichiers comme du texte : `` `text-${role}` `` ne sera jamais généré, car la chaîne `text-ink` n'apparaît nulle part. C'est pour ça que XiaoTrack range ses chaînes de classes complètes dans des constantes (`tileActive`, `logoTileClasses`...).
- **Remplacer une valeur par défaut touche tout le code.** Redéfinir `--radius-lg` a changé `rounded-lg` partout, y compris dans des composants qu'on n'a pas relus. C'est voulu ici, mais à faire en connaissance de cause.
- **`@theme` n'accepte que des déclarations de variables.** Pas de sélecteurs, pas de règles imbriquées.
- **Ne plus écrire de couleurs de la palette Tailwind** (`gray-500`, `sky-50`) dans les composants. Elles existent toujours, mais la charte les interdit : tokens uniquement (règle 1 du §8 de la charte).

## 6. À retenir

- Tailwind v4 se branche avec un plugin Vite et `@import "tailwindcss"` ; toute la configuration est en CSS.
- Une variable déclarée dans `@theme` avec un espace de noms (`--color-*`, `--text-*`, `--radius-*`, `--shadow-*`, `--ease-*`, `--font-*`) devient à la fois une variable CSS et une famille de classes.
- Une variable déclarée dans `:root` reste une simple variable : aucune classe n'est générée.
- `bg-(--x)` utilise n'importe quelle variable directement dans une classe.
- La police Inter est auto-hébergée via `@fontsource-variable/inter` et appliquée à toute la page par `--font-sans`.

## 7. Exercice

1. Dans [index.css](../../apps/web/src/assets/css/index.css), à la fin du bloc `@theme` (juste avant l'accolade fermante l. 88), ajoute temporairement :
   ```css
   --color-highlight: oklch(0.9 0.15 95);
   ```
2. Dans [MainSidebar.tsx](../../apps/web/src/layout/Sidebar/MainSidebar.tsx), ajoute `bg-highlight` à la classe du paragraphe « Menu » (l. 10). Lance l'app : que vois-tu ?
3. Déplace maintenant la ligne `--color-highlight` du bloc `@theme` vers le bloc `:root`. Que devient le fond de « Menu » ?
4. Annule tout : `git checkout -- apps/web/src/assets/css/index.css apps/web/src/layout/Sidebar/MainSidebar.tsx`.

<details><summary>Solution</summary>

2. « Menu » a un fond jaune pâle : `--color-highlight` dans `@theme` a créé la classe `bg-highlight` (et aussi `text-highlight`, `border-highlight`...).
3. Le fond disparaît. La variable existe toujours (tu pourrais la lire avec `var(--color-highlight)` dans une feuille CSS), mais déclarée dans `:root`, elle n'est plus dans un espace de noms du thème : Tailwind ne génère plus la classe `bg-highlight`, qui ne correspond donc à rien.
4. Le `git checkout` remet les deux fichiers dans leur état du dernier commit.

</details>
