# 04. `@utility` et les classes de composants

> **Prérequis :** chapitres 01, 02 et 03. **Lecture :** ~20 min. **Fichiers concernés :** `index.css`, `AppHeader.tsx`, `MainHeader.tsx`, `CategorySidebar.tsx`, `WidgetCard.tsx`, `WidgetPaletteItem.tsx`, `WidgetEditBar.tsx`, `WidgetToolbar.tsx`, `ConfirmDialog.tsx`, `Modal.tsx`, `Dashboard.tsx`, `widget-grid.css`, `palette.css`.

## 1. Le problème

Avant la refonte, les boutons de l'app étaient écrits trois fois, de trois façons différentes :

```tsx
// ConfirmDialog.tsx (avant)
const buttonBase = "min-h-10 rounded-lg px-4 py-2 text-sm font-medium transition-colors";
const declineButton = `${buttonBase} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`;
```

plus une chaîne `headerButton` dans le header, et une règle `.palette-item-add` dans la palette. Trois sources de vérité pour le même objet : un bouton. Changer l'arrondi des boutons voulait dire modifier trois fichiers, et espérer n'en oublier aucun.

Deuxième besoin, différent : le dégradé de marque. On voudrait l'écrire comme une classe Tailwind, `bg-brand`, et pouvoir écrire `hover:bg-brand` si un jour c'est utile. Or Tailwind ne génère pas de classe pour un dégradé stocké dans une variable (chapitre 03, §4.3).

Ces deux besoins ont deux réponses différentes en Tailwind v4 : **une classe de composant** pour le bouton, **une `@utility`** pour le dégradé.

## 2. La notion

### 2.1 Une classe de composant

C'est une classe CSS ordinaire, écrite dans la couche `components` (chapitre 02) :

```css
@layer components {
    .btn { display: inline-flex; padding: ...; border-radius: ...; }
    .btn:hover { ... }
    .btn-primary { background-image: ...; }
}
```

Elle **regroupe beaucoup de déclarations** sous un nom : c'est un composant visuel complet. Elle peut avoir des états (`:hover`, `:disabled`, `:focus-visible`) et des variantes (`.btn-primary`, `.btn-ghost`) qui s'ajoutent à la classe de base.

Pour Tailwind, c'est du CSS qu'il recopie tel quel. Il ne sait pas que `.btn` existe en tant que « classe à lui ».

### 2.2 Une `@utility`

C'est une classe que tu déclares **à Tailwind**, pour qu'il la traite comme les siennes :

```css
@utility bg-brand {
    background-image: var(--brand-gradient);
}
```

Trois différences concrètes avec une classe de composant :

1. **Elle va dans la couche `utilities`**, donc elle bat les classes de composants (chapitre 02).
2. **Les variantes fonctionnent.** Tailwind sait générer `hover:bg-brand`, `md:bg-brand`, `group-hover:bg-brand`, `disabled:bg-brand`... Il écrit lui-même la règle `.hover\:bg-brand:hover { ... }`, comme il le fait pour `hover:bg-surface`.
3. **Elle n'est générée que si elle est utilisée** quelque part dans le code, comme toute classe Tailwind.

### 2.3 Pourquoi les variantes ne marchent pas sur une classe de composant

Les variantes (`hover:`, `md:`...) ne sont pas une fonctionnalité du CSS : c'est Tailwind qui fabrique une nouvelle règle pour chaque combinaison qu'il trouve dans ton code. Il ne peut le faire que pour les classes qu'il connaît : ses utilities et tes `@utility`.

`.btn-primary` est du CSS recopié tel quel. Si tu écris `hover:btn-primary`, Tailwind ne sait pas ce que c'est : **rien n'est généré, et rien ne se passe à l'écran**, sans message d'erreur. (Tailwind v3 l'autorisait pour les classes de `@layer components` ; la v4 ne le fait plus.)

### 2.4 Lequel choisir ?

| Question | Classe de composant (`@layer components`) | `@utility` |
|---|---|---|
| Combien de déclarations ? | Beaucoup : un objet complet | Une ou deux : un réglage |
| Des états propres (`:hover`, `:disabled`) ? | Oui, écrits dans la classe | Non, on utilise les variantes |
| Besoin de `hover:x`, `md:x` dans le JSX ? | Impossible | Oui |
| Doit-elle pouvoir être corrigée par une utility du JSX ? | Oui, c'est le but | Elle est elle-même une utility |
| Exemples XiaoTrack | `.btn`, `.btn-primary`, `.widget-card` | `bg-brand`, `text-brand`, `tone-tile` |

La règle pratique : **un objet visuel → classe de composant ; un réglage qu'on combine avec d'autres classes → `@utility`**.

## 3. Exemple minimal

```css
@import "tailwindcss";

@utility bg-stripes {
    background-image: repeating-linear-gradient(45deg, #0001 0 6px, transparent 6px 12px);
}

@layer components {
    .tag { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #eee; }
}
```

```tsx
<span className="tag hover:bg-stripes">survole-moi</span>   {/* les rayures apparaissent au survol */}
<span className="bg-stripes hover:tag">et moi ?</span>       {/* hover:tag ne fait rien */}
```

Survole les deux étiquettes : la première se raye au survol, la seconde est rayée tout le temps et le survol ne change rien.

## 4. Dans XiaoTrack

### 4.1 Les trois `@utility` d'index.css

[index.css](../../apps/web/src/assets/css/index.css) l. 107-126 :

```css
/*
 * Custom utilities. @utility (not a class in @layer components) makes them real Tailwind utilities:
 * variants work (hover:bg-brand, md:text-brand) and they sort with the other utilities.
 */
@utility bg-brand {
    background-image: var(--brand-gradient);
}

@utility text-brand {
    background-image: var(--brand-gradient-text);
    background-clip: text;
    color: transparent;
}

@utility tone-tile {
    background-color: color-mix(in oklch, var(--tone, var(--color-accent)) 13%, white);
    color: var(--tone, var(--color-accent));
}
```

- **`bg-brand`** : un fond en dégradé de marque. Une seule déclaration, qui lit la variable `--brand-gradient` de `:root`.
- **`text-brand`** : un texte en dégradé. On peint le dégradé en fond, on le **découpe à la forme des lettres** (`background-clip: text`), et on rend la couleur du texte transparente pour que le fond se voie à travers. Le détail est au chapitre 06.
- **`tone-tile`** : une tuile teintée par `--tone` (chapitre 01, §4.5). Fond pâle, icône colorée.

Ce sont bien des **réglages** qu'on combine avec d'autres classes (taille, arrondi, flex...), pas des objets complets : d'où `@utility`.

### 4.2 Où elles sont utilisées

**Le logo**, [AppHeader.tsx](../../apps/web/src/layout/Header/AppHeader.tsx) l. 8-12 et 24 :

```tsx
const logoTileClasses = [
    "bg-brand relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md",
    "shadow-brand ring-1 ring-white/25 ring-inset",
    "before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-linear-to-b before:from-white/25 before:to-transparent",
].join(" ");
...
<span className="text-brand text-heading font-semibold">
    XiaoTrack
</span>
```

`bg-brand` se mélange à une quinzaine d'utilities ordinaires : c'est exactement l'usage prévu. `shadow-brand` n'est pas une `@utility` : elle vient de `--shadow-brand` dans `@theme` (chapitre 03). La charte n'autorise le dégradé qu'au logo et à **une** action principale par écran (charte §3).

**Les tuiles d'icône** :
- [CategorySidebar.tsx](../../apps/web/src/layout/Sidebar/CategorySidebar.tsx) l. 17 : `tone-tile flex h-8 w-8 ...` ;
- [WidgetCard.tsx](../../apps/web/src/components/widgets/WidgetCard.tsx) l. 38 : `widget-card-icon tone-tile` ;
- [WidgetPaletteItem.tsx](../../apps/web/src/components/widgets/palette/WidgetPaletteItem.tsx) l. 25 : `palette-item-icon tone-tile`, sauf pour un widget déjà ajouté (chapitre 02, §4.3).

Dans WidgetCard, la classe de composant `widget-card-icon` ([widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css) l. 119-127) donne la taille et l'arrondi, et l'utility `tone-tile` donne les couleurs. Chacun son rôle, sur le même élément.

### 4.3 La gamme `.btn`, classe de composant

[index.css](../../apps/web/src/assets/css/index.css) l. 128-245, dans `@layer components`. La base (l. 130-150) :

```css
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    min-height: 2.25rem;
    padding: 0.375rem 0.875rem;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    font-size: var(--text-body);
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: background-color var(--motion-fast), ... scale var(--motion-fast);
}
```

Une quinzaine de déclarations : la forme commune de tous les boutons. Puis des états communs (l. 152-168) :

```css
.btn:active:not(:disabled) { scale: 0.97; }          /* léger enfoncement au clic */
.btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.btn:disabled { cursor: not-allowed; background-image: none; background-color: var(--color-line); ... }
```

- `:active` : pendant que le bouton est enfoncé. `scale` est expliqué au chapitre 09.
- `:focus-visible` : le contour n'apparaît qu'à la navigation clavier, pas au clic souris.
- `:disabled` : un seul style « désactivé » pour toutes les variantes. `background-image: none` retire le dégradé d'un `.btn-primary` désactivé.

Puis une classe par variante, qui ne change que les couleurs. Chacune a un usage précis dans la charte (§4) :

| Classe | Rendu | Où dans le code |
|---|---|---|
| `.btn-primary` (l. 171) | Dégradé + halo | Save : [WidgetEditBar.tsx](../../apps/web/src/components/widgets/WidgetEditBar.tsx) l. 32 ; « Add your first widget » : [Dashboard.tsx](../../apps/web/src/pages/Dashboard.tsx) l. 47 |
| `.btn-accent` (l. 182) | Indigo plat | Confirmer : [ConfirmDialog.tsx](../../apps/web/src/components/modals/ConfirmDialog.tsx) l. 18 |
| `.btn-soft` (l. 192) | Fond indigo pâle | « + » de la palette : [WidgetPaletteItem.tsx](../../apps/web/src/components/widgets/palette/WidgetPaletteItem.tsx) l. 59 |
| `.btn-secondary` (l. 201) | Blanc bordé | « Edit widgets » : [WidgetToolbar.tsx](../../apps/web/src/components/widgets/WidgetToolbar.tsx) l. 21 ; Annuler : ConfirmDialog l. 17 |
| `.btn-ghost` (l. 213) | Transparent | Add widget et Cancel : WidgetEditBar l. 25 et 29 ; fermer : [Modal.tsx](../../apps/web/src/components/modals/Modal.tsx) l. 54 ; menu et cloche : [MainHeader.tsx](../../apps/web/src/layout/Header/MainHeader.tsx) l. 13 |
| `.btn-danger` (l. 224) | Rouge plein | Quitter sans enregistrer : ConfirmDialog l. 19 |
| `.btn-lg` (l. 233) | Plus grand | « Add your first widget » : Dashboard l. 47 |
| `.btn-icon` (l. 239) | Carré, sans padding | Modal l. 54, MainHeader l. 13, palette l. 59 |

Un bouton s'écrit donc toujours en deux ou trois classes : la base, une variante, éventuellement une taille.

```tsx
// WidgetEditBar.tsx l. 32
<button type="button" className="btn btn-primary" onClick={onSave} disabled={!isDirty}>
```

`disabled={!isDirty}` suffit : `.btn:disabled` s'occupe de l'apparence.

### 4.4 Ajuster un `.btn` : utilities et feuilles de composants

Parce que `.btn` est dans `components`, on peut l'ajuster au cas par cas de deux façons.

**Par une utility dans le JSX.** [MainHeader.tsx](../../apps/web/src/layout/Header/MainHeader.tsx) l. 13 :

```tsx
const headerButton = "btn btn-ghost btn-icon rounded-full";
```

`rounded-full` (couche `utilities`) bat le `border-radius` de `.btn` : les boutons du header sont ronds.

**Par une règle plus précise dans une feuille de composant.** [widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css) l. 485-487 :

```css
.widget-edit-bar .btn {
    border-radius: 9999px;
}
```

Même couche que `.btn`, mais spécificité (0, 2, 0) contre (0, 1, 0) : les boutons de la barre d'édition flottante sont en pilule.

Et [palette.css](../../apps/web/src/components/widgets/palette/palette.css) l. 63-69 :

```css
/* The "+" button is a .btn-soft (index.css): repeated action, no gradient (charter §3) */
.palette-item-add {
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
    border-radius: var(--radius-sm);
}
```

Le bouton « + » porte `btn btn-soft btn-icon palette-item-add`. `.btn-icon` et `.palette-item-add` ont la même couche et la même spécificité : c'est l'**ordre** qui départage (chapitre 02). `palette.css` est importée par un composant, donc chargée après `index.css` : sa règle arrive plus bas, elle gagne, et le bouton fait 2rem au lieu de 2.25rem.

## 5. Pièges

- **`hover:btn-primary`, `md:btn-ghost` ne font rien**, sans erreur. Les variantes ne s'appliquent qu'aux utilities. Pour un bouton qui change d'apparence au survol, l'état se décrit dans la classe de composant (`.btn-primary:hover:not(:disabled)`, l. 177).
- **Une `@utility` qui grossit est le signe d'un composant.** Si tu te retrouves à écrire huit déclarations dans une `@utility`, c'est probablement une classe de composant.
- **Un nom de `@utility` doit être unique et sans point** : `@utility bg-brand`, pas `@utility .bg-brand`. Choisis un nom qui ne cache pas une classe Tailwind existante, ou tu la remplaceras.
- **Ne recrée pas un bouton en utilities.** La charte l'impose (§4) : tout bouton passe par `.btn` + une variante. Une longue chaîne `px-4 py-2 rounded-lg bg-...` sur un `<button>` est une dette, c'était la situation avant la refonte.
- **Une utility bat une variante de bouton.** `className="btn btn-primary bg-surface"` : `bg-surface` gagne sur le fond, mais pas sur le dégradé (`background-image` n'est pas touché). Le résultat est un mélange imprévisible. N'ajoute pas d'utility de couleur sur un `.btn`.

## 6. À retenir

- Une **classe de composant** (`@layer components`) regroupe un objet visuel complet et ses états ; les variantes Tailwind ne s'y appliquent pas.
- Une **`@utility`** est un réglage court que Tailwind traite comme les siens : couche `utilities`, variantes (`hover:`, `md:`...) disponibles.
- XiaoTrack a trois `@utility` (`bg-brand`, `text-brand`, `tone-tile`) et une gamme de boutons `.btn` + variante (`primary`, `accent`, `soft`, `secondary`, `ghost`, `danger`) + taille (`lg`, `icon`).
- Un `.btn` s'ajuste par une utility du JSX (`rounded-full`) ou par une règle plus précise dans une feuille de composant (`.widget-edit-bar .btn`).

## 7. Exercice

1. Dans [WidgetToolbar.tsx](../../apps/web/src/components/widgets/WidgetToolbar.tsx) l. 21, remplace temporairement `"btn btn-secondary"` par `"btn btn-secondary hover:bg-brand hover:text-white"`. Lance l'app et survole « Edit widgets ».
2. Remplace maintenant par `"btn btn-secondary hover:btn-primary"`. Survole de nouveau.
3. Annule : `git checkout -- apps/web/src/components/widgets/WidgetToolbar.tsx`.

<details><summary>Solution</summary>

1. Au survol, le bouton se remplit du dégradé de marque, texte blanc : `bg-brand` est une `@utility`, Tailwind a généré `hover:bg-brand`. (La charte interdirait ce dégradé ici : c'est juste pour l'expérience.)
2. Rien ne change au survol : `btn-primary` est une classe de composant, Tailwind ne sait pas fabriquer `hover:btn-primary`. Aucun message d'erreur, ni au build, ni dans la console.
3. Le fichier revient à son état du dernier commit.

</details>
