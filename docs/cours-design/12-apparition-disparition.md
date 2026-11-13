# 12. Faire apparaître et disparaître

> **Prérequis :** chapitres 09 (transformations), 10 (transitions) et 11 (@keyframes). **Lecture :** ~20 min. **Fichiers concernés :** `modal.css`, `Modal.tsx`, `WidgetGrid.tsx`, `WidgetGridCell.tsx`, `widget-grid.css`, `widget-grid.constants.ts`.

## 1. Le problème

Animer un élément qui **est là** est facile (chapitres 10 et 11). Animer un élément qui **arrive** ou qui **part** est beaucoup plus difficile, pour deux raisons.

**Côté CSS : `display` n'est pas animable.** Une modale fermée a `display: none` : elle n'est pas dessinée du tout, elle n'a pas de boîte. Quand elle s'ouvre, elle passe à `display: block` d'un coup (c'est une valeur discrète, voir chapitre 10). Deux conséquences :
- à l'ouverture, il n'existe pas d'« état d'avant » visible à partir duquel faire une transition : l'élément surgit directement dans son état final ;
- à la fermeture, `display: none` s'applique immédiatement : l'élément disparaît avant d'avoir pu jouer la moindre animation.

**Côté React : un élément retiré du DOM n'existe plus.** Quand tu cliques sur ✕, la suite logique est de retirer le widget de l'état. React le retire alors du DOM au rendu suivant, dans la même fraction de seconde. Il n'y a plus d'élément sur lequel jouer une animation de sortie.

Ce chapitre présente les deux solutions utilisées dans le projet : une solution **CSS** pour la modale, une solution **React** pour les widgets.

## 2. La notion

### 2.1 Côté CSS : `@starting-style` et `allow-discrete`

Deux fonctionnalités récentes du CSS règlent les deux moitiés du problème.

**`@starting-style` règle l'ouverture.** Il déclare l'état « d'avant » d'un élément qui vient d'apparaître (qui passe de `display: none` à affiché, ou qui vient d'être inséré dans la page). Le navigateur fait comme si l'élément avait d'abord eu ce style, puis lance les transitions vers le style normal.

```css
.panel { opacity: 1; transition: opacity 300ms; }

@starting-style {
    .panel { opacity: 0; }   /* « juste avant d'apparaître, j'étais transparent » */
}
```

Sans `@starting-style`, aucune transition ne joue à l'apparition : il n'y a pas de valeur de départ.

**`transition-behavior: allow-discrete` règle la fermeture.** Normalement, une propriété discrète comme `display` bascule tout de suite. Avec le mot-clé `allow-discrete` dans la transition, le navigateur **retarde** la bascule à la fin de la transition quand l'élément disparaît :

```css
transition:
    opacity 300ms,
    display 300ms allow-discrete;   /* display: none attend la fin des 300ms */
```

Ainsi, à la fermeture, l'élément reste affiché le temps que son opacité descende, et ne passe à `display: none` qu'à la fin.

**Le cas du `<dialog>` : la propriété `overlay`.** Un `<dialog>` ouvert avec `showModal()` est placé dans la **couche supérieure** (*top layer*) : une couche spéciale du navigateur, au-dessus de toute la page, quel que soit le `z-index`. À la fermeture, il en sort aussitôt, et passerait alors **sous** le contenu de la page pendant son animation. La propriété `overlay` représente cette appartenance à la couche supérieure ; avec `allow-discrete`, sa sortie est retardée elle aussi.

**`::backdrop`** est le voile que le navigateur dessine derrière un `<dialog>` modal. C'est un pseudo-élément : on le stylise et on l'anime comme un élément normal.

Compatibilité : ces fonctionnalités sont récentes (2023-2024). Chrome et Safari les gèrent ; Firefox gère `@starting-style` mais pas `overlay` : la fermeture peut y être coupée net. Ce n'est pas grave, la modale fonctionne, elle est seulement moins animée.

### 2.2 Côté React : retarder la suppression

Puisque React retire du DOM tout ce qui sort de l'état, la solution est de **ne pas retirer tout de suite** :

```
clic sur ✕
   │
   ├─ 1. marquer le widget « en sortie » (un Set d'ids dans l'état)
   │      → au rendu, sa cellule reçoit la classe is-exiting → l'animation de sortie joue
   │
   ├─ 2. lancer un minuteur de la durée de l'animation (200ms)
   │
   └─ 3. à la fin du minuteur : retirer le widget de l'état
          → React le retire du DOM, l'animation est déjà finie
```

Le prix : pendant 200ms, l'app est dans un **état intermédiaire** (le widget est encore dans les données, mais il est « en train de partir »). Toute l'app doit le savoir, et les minuteurs doivent être nettoyés si les choses changent entre-temps.

## 3. Exemple minimal

Le volet CSS, à coller dans un fichier `.html` (Chrome ou Safari récents) :

```html
<style>
  dialog { opacity: 0; scale: 0.9;
           transition: opacity 400ms, scale 400ms,
                       overlay 400ms allow-discrete, display 400ms allow-discrete; }
  dialog[open] { opacity: 1; scale: 1; }
  @starting-style { dialog[open] { opacity: 0; scale: 0.9; } }
</style>
<button onclick="d.showModal()">Ouvrir</button>
<dialog id="d"><p>Bonjour</p><button onclick="d.close()">Fermer</button></dialog>
```

Ouvre et ferme : la boîte grossit en apparaissant et rétrécit en disparaissant. Supprime ensuite le bloc `@starting-style` : l'ouverture n'est plus animée. Remets-le et retire les deux lignes `allow-discrete` : c'est la fermeture qui n'est plus animée.

## 4. Dans XiaoTrack

### 4.1 La modale : l'état fermé, l'état ouvert

[modal.css](../../apps/web/src/components/modals/modal.css), l. 8 à 32 :

```css
.modal {
    opacity: 0;
    transition:
        opacity var(--motion-base) var(--ease-out-soft),
        translate var(--motion-slow) var(--ease-out-soft),
        scale var(--motion-base) var(--ease-out-soft),
        overlay var(--motion-slow) allow-discrete,
        display var(--motion-slow) allow-discrete;
}

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

- `.modal` décrit l'état **fermé** : transparent, et selon le placement, poussé hors de l'écran à droite (`modal-right`) ou légèrement réduit (`modal-center`).
- `.modal[open]` décrit l'état **ouvert**. L'attribut `open` est ajouté par le navigateur quand on appelle `showModal()`, et retiré par `close()`.
- `.modal[open]` (une classe + un attribut) est plus spécifique que `.modal-right` (une classe) : il gagne, donc `translate: 0 0` l'emporte quand la modale est ouverte.
- La transition liste les trois propriétés visuelles, plus `overlay` et `display` avec `allow-discrete` : à la fermeture, la modale reste affichée et au-dessus de la page pendant 400ms, le temps de repartir à droite.

### 4.2 La modale : l'état « d'avant »

L. 49 à 66 :

```css
@starting-style {
    .modal[open] {
        opacity: 0;
    }

    .modal-right[open] {
        translate: 100% 0;
    }

    .modal-center[open] {
        scale: 0.96;
    }

    .modal[open]::backdrop {
        background-color: transparent;
        backdrop-filter: blur(0);
    }
}
```

Au moment où la modale s'ouvre, elle passe de `display: none` à affichée. Le navigateur prend ces valeurs comme point de départ (transparente, hors écran à droite), puis fait la transition vers `.modal[open]`. Résultat : le tiroir de la palette **glisse** depuis le bord droit.

Remarque : ces valeurs sont les mêmes que l'état fermé. C'est normal : on veut que l'ouverture parte de l'état fermé et que la fermeture y retourne.

### 4.3 Le voile derrière la modale

L. 34 à 47 :

```css
.modal::backdrop {
    background-color: transparent;
    backdrop-filter: blur(0);
    transition:
        background-color var(--motion-slow) var(--ease-out-soft),
        backdrop-filter var(--motion-slow) var(--ease-out-soft),
        overlay var(--motion-slow) allow-discrete,
        display var(--motion-slow) allow-discrete;
}

.modal[open]::backdrop {
    background-color: var(--color-scrim);
    backdrop-filter: blur(2px);
}
```

Le voile suit exactement la même logique : transparent fermé, teinté (`--color-scrim`, l'encre à 30 %, voir chapitre 05) et légèrement flouté ouvert. `backdrop-filter: blur(2px)` floute ce qui est **derrière** le voile, c'est-à-dire la page.

### 4.4 Qui ouvre et ferme la modale ?

[Modal.tsx](../../apps/web/src/components/modals/Modal.tsx), l. 12 à 25 :

```tsx
useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
}, [isOpen])

const dialogClasses = [
    // modal + modal-{placement}: open / close animations (modal.css)
    `modal modal-${placement} shadow-float`,
    ...
].join(" ");
```

- React ne retire **jamais** le `<dialog>` du DOM : il est toujours rendu. Seul l'attribut `open` change, via `showModal()` et `close()`. C'est ce qui rend possible l'animation purement CSS : l'élément existe toujours, le CSS s'occupe du reste.
- `modal-${placement}` produit `modal-right` ou `modal-center` selon la prop, d'où le comportement différent du tiroir et de la boîte de confirmation.

### 4.5 Le widget supprimé : marquer, attendre, retirer

[WidgetGrid.tsx](../../apps/web/src/components/widgets/WidgetGrid.tsx), l. 50 à 52, puis 70 à 84 :

```tsx
// Removal: the widget plays its exit animation first, and leaves the draft afterwards
const [exitingIds, setExitingIds] = useState<ReadonlySet<string>>(NO_IDS);
const exitTimersRef = useRef<Map<string, number>>(new Map());
```
```tsx
const handleRemove = (id: string) => {
    // Already leaving: a second click on ✕ does nothing
    if (!onRemoveWidget || exitTimersRef.current.has(id)) return;
    setExitingIds((prev) => new Set(prev).add(id));
    const timer = window.setTimeout(() => {
        exitTimersRef.current.delete(id);
        setExitingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
        onRemoveWidget(id);
    }, prefersReducedMotion() ? 0 : WIDGET_EXIT_MS);
    exitTimersRef.current.set(id, timer);
};
```

Ligne à ligne :
- `exitingIds` : l'ensemble (`Set`) des widgets en train de partir. C'est de l'**état** (`useState`), car son changement doit provoquer un rendu (pour ajouter la classe `is-exiting`).
- `exitTimersRef` : les minuteurs en cours, par id. C'est une **ref** (`useRef`), car ils ne s'affichent pas : les changer ne doit pas provoquer de rendu.
- `if (... exitTimersRef.current.has(id)) return;` : un double clic sur ✕ ne lance pas deux minuteurs.
- `new Set(prev).add(id)` : on crée un **nouveau** Set. React compare l'ancien et le nouvel état par référence ; modifier le Set existant ne déclencherait pas de rendu.
- `window.setTimeout(..., WIDGET_EXIT_MS)` : 200ms plus tard, on retire l'id des sortants et on appelle `onRemoveWidget(id)`, qui retire le widget du brouillon dans `Dashboard.tsx`.
- `prefersReducedMotion() ? 0 : …` : si le système demande moins d'animations, pas d'attente (chapitre 16).

Au rendu, l. 99 et 109 :

```tsx
const isExiting: boolean = exitingIds.has(w.id);
```
```tsx
className={`widget-cell ${isDragged ? "is-dragging" : ""} ${isExiting ? "is-exiting" : ""}`}
```

La classe `is-exiting` déclenche l'animation `widget-exit` (200ms, `forwards`, voir chapitre 11). L. 121 et 122, un widget qui part ne reçoit plus `onRemove` ni `onHandlePointerDown` : on ne peut plus le supprimer à nouveau ni l'attraper.

### 4.6 Ajuster l'état pendant le rendu quand une prop change

Que se passe-t-il si tu cliques sur ✕ puis sur **Cancel** dans les 200ms ? Le mode édition s'arrête, le widget doit rester, et le minuteur ne doit surtout pas le supprimer après coup. L. 54 à 68 :

```tsx
// Leaving edit mode (Cancel, Save) forgets the removals in progress.
// Adjusting state while rendering, when a prop changes: React's recommended pattern (no effect needed).
const [wasEditing, setWasEditing] = useState(isEditing);
if (wasEditing !== isEditing) {
    setWasEditing(isEditing);
    setExitingIds(NO_IDS);
}
// ...and their timers, so a Cancel is not followed by a late removal (also on unmount)
useEffect(() => {
    const timers = exitTimersRef.current;
    return () => {
        timers.forEach((timer) => window.clearTimeout(timer));
        timers.clear();
    };
}, [isEditing]);
```

Deux mécanismes complémentaires :

**1. Vider `exitingIds` : ajuster l'état pendant le rendu.** On veut réagir au changement de la prop `isEditing`. Le réflexe serait un `useEffect` qui appelle `setExitingIds` ; mais un effet s'exécute **après** l'affichage, donc l'écran montrerait d'abord un rendu faux (les widgets encore en sortie), puis un second rendu corrigé. Le pattern recommandé par React :
- on garde en état la valeur précédente de la prop (`wasEditing`) ;
- pendant le rendu, si elle diffère de la valeur actuelle, on met à jour les deux états **tout de suite** ;
- React voit qu'on a appelé un `set` pendant le rendu, **abandonne** ce rendu avant de l'afficher, et le recommence avec les nouveaux états. Un seul affichage, déjà correct.

Ce pattern ne fonctionne que parce que le `if` empêche la boucle : au second passage, `wasEditing === isEditing`, on ne rappelle pas `set`.

**2. Annuler les minuteurs : le nettoyage d'un effet.** Les minuteurs sont un effet de bord (ils vivent en dehors de React) : c'est bien le rôle d'un `useEffect`. Le nettoyage (la fonction retournée) s'exécute quand `isEditing` change **et** quand le composant disparaît. Il annule tous les minuteurs en attente : plus de suppression tardive. `const timers = exitTimersRef.current` est lu au moment de l'effet : c'est le même objet `Map` pendant toute la vie du composant, donc le nettoyage vide bien les minuteurs ajoutés entre-temps.

### 4.7 Le widget ajouté : un état gelé au montage

À l'inverse, un widget **ajouté** doit défiler jusqu'à l'écran et recevoir un anneau lumineux (l'animation `widget-ring`, chapitre 11). [WidgetGridCell.tsx](../../apps/web/src/components/widgets/WidgetGridCell.tsx), l. 17 à 31 :

```tsx
export default function WidgetGridCell({ id, className, style, isAddedNow, children }: WidgetGridCellProps) {
    const ref = useRef<HTMLDivElement>(null);
    // Frozen at mount: later renders must not turn the highlight on or off
    const [isNew] = useState(isAddedNow);

    useEffect(() => {
        if (!isNew) return;
        ref.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest" });
    }, [isNew]);

    return (
        <div ref={ref} data-id={id} className={`${className} ${isNew ? "is-new" : ""}`} style={style}>
            {children}
        </div>
    );
}
```

- La grille passe `isAddedNow={isSettled && isEditing}` ([WidgetGrid.tsx](../../apps/web/src/components/widgets/WidgetGrid.tsx), l. 108) : « on est en mode édition, et la cascade du premier affichage est finie ». Mais cette valeur est vraie pour **toutes** les cellules pendant toute l'édition, y compris celles qui étaient déjà là.
- `useState(isAddedNow)` règle ça : **la valeur initiale d'un `useState` n'est lue qu'au montage**. Une cellule montée pendant l'édition (donc un widget qui vient d'être ajouté) garde `isNew = true` ; une cellule déjà présente quand on est entré en édition garde `isNew = false`, même si la prop devient `true` ensuite. On n'appelle jamais `setIsNew` : c'est volontaire, la valeur est gelée.
- L'effet fait défiler la page jusqu'au nouveau widget (`scrollIntoView`), en douceur sauf si le système demande moins d'animations. `block: "nearest"` : on ne défile que si le widget est hors de l'écran.
- La classe `is-new` active l'anneau (`.widget-cell.is-new::after`).

### 4.8 Un défaut connu : Save pendant une sortie

Il faut le dire honnêtement : la solution React a un trou.

Scénario : en mode édition, tu as déjà déplacé un widget (le brouillon est modifié, Save est actif). Tu cliques sur ✕ sur un autre widget, puis sur **Save moins de 200ms après**.

1. Le ✕ marque le widget en sortie et lance le minuteur. Le widget est **encore** dans le brouillon (`draftWidgets`).
2. Save appelle `onSave` ([Dashboard.tsx](../../apps/web/src/pages/Dashboard.tsx), l. 91 à 102), qui enregistre `draftWidgets`, **avec** le widget, puis repasse `isEditing` à `false`.
3. Le changement de `isEditing` déclenche le nettoyage du §4.6 : le minuteur est annulé, `onRemoveWidget` n'est jamais appelé.

Résultat : le widget que tu as supprimé est toujours là après l'enregistrement. La suppression est perdue.

Pourquoi le trou existe : la suppression ne touche les **données** qu'à la fin de l'**animation**. Tant que ce délai court, l'état « en sortie » n'existe que dans `WidgetGrid`, et `Dashboard` (qui enregistre) l'ignore. La fenêtre est étroite (200ms), et Save est désactivé si la suppression en attente est la seule modification, mais le défaut est réel.

Pistes de correction (à concevoir ensemble, pas encore faites) :
- retirer le widget du brouillon **immédiatement**, et garder une copie « fantôme » à l'écran le temps de l'animation (les données sont toujours justes, seul l'affichage attend) ;
- ou, au moment de Save, exécuter tout de suite les suppressions en attente avant d'enregistrer.

C'est la leçon générale : **une animation qui retarde une mutation de données crée un état intermédiaire, que toute l'app doit connaître.** Animer une sortie n'est jamais « juste du CSS ».

## 5. Pièges

- **Oublier `@starting-style`** : l'élément apparaît sans animation, il n'y a pas d'état de départ.
- **Oublier `allow-discrete` sur `display`** : la fermeture est coupée net.
- **Oublier `overlay` pour un `<dialog>`** : pendant la fermeture, la modale passe sous le contenu de la page.
- **Rendre conditionnellement un `<dialog>`** (`{isOpen && <dialog>}`) : React le retire du DOM à la fermeture, aucune animation CSS ne peut jouer. Il faut le garder rendu et piloter `open`.
- **Modifier un `Set` ou un objet d'état en place** : React ne voit pas le changement. Toujours créer une copie.
- **Oublier de nettoyer les minuteurs** : une suppression arrive « en retard », après un Cancel ou après la disparition du composant.
- **Utiliser un `useEffect` pour recalculer un état à partir d'une prop** : un rendu faux s'affiche avant la correction. Préférer le calcul direct ou l'ajustement pendant le rendu.
- **Une animation qui retarde des données** : vérifier tout ce qui peut lire ces données pendant l'attente (ici, Save).

## 6. À retenir

- `display` et la présence dans le DOM ne s'animent pas : il faut une technique dédiée pour l'apparition et la disparition.
- En CSS, `@starting-style` donne l'état de départ à l'ouverture, et `allow-discrete` (sur `display` et `overlay`) retarde la disparition à la fermeture.
- Le `<dialog>` reste toujours dans le DOM ; React ne pilote que `showModal()` / `close()`.
- En React, une sortie animée = marquer « en sortie », attendre la durée de l'animation, puis retirer de l'état ; et nettoyer les minuteurs.
- Retarder une modification de données pour une animation crée un état intermédiaire : ici, cliquer sur Save pendant une sortie perd la suppression.

## 7. Exercice

1. Dans [modal.css](../../apps/web/src/components/modals/modal.css), mets en commentaire tout le bloc `@starting-style` (l. 49 à 66). Ouvre la palette de widgets, puis ferme-la. Quelle moitié de l'animation a disparu ?
2. Remets le bloc. Cette fois, retire uniquement la ligne `display var(--motion-slow) allow-discrete;` de `.modal` (l. 15). Ouvre et ferme. Que se passe-t-il ?
3. Reproduis le défaut du §4.8 : dans [widget-grid.constants.ts](../../apps/web/src/components/widgets/widget-grid.constants.ts), passe `WIDGET_EXIT_MS` à `3000` (et le `200ms` de `widget-exit` dans `widget-grid.css` à `3000ms`) pour élargir la fenêtre. Entre en édition, déplace un widget, clique ✕ sur un autre, puis Save tout de suite.

Annule tout avec `git checkout -- apps/web/src`.

<details><summary>Solution</summary>

1. L'**ouverture** n'est plus animée : le tiroir apparaît directement à sa place. Sans `@starting-style`, le navigateur n'a pas d'état de départ pour la transition. La fermeture, elle, glisse toujours vers la droite : pour fermer, il part de l'état ouvert (qui existe) vers l'état fermé (`.modal`).
2. L'ouverture fonctionne, mais la **fermeture** est coupée net : sans `allow-discrete`, `display: none` s'applique tout de suite, avant que la transition ait pu jouer. (Selon le navigateur, le voile peut encore s'animer, car `::backdrop` a sa propre transition.)
3. Le widget supprimé est toujours là après Save : il a été enregistré dans le brouillon, et le passage hors du mode édition a annulé son minuteur. Avec 3 secondes, le défaut devient évident ; avec 200ms, il est rare mais identique.
</details>
