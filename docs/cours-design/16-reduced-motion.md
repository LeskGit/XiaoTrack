# 16. Réduire les animations : prefers-reduced-motion

> **Prérequis :** chapitres 02 (cascade et couches), 10 (transitions), 11 (`@keyframes`), 13 (`requestAnimationFrame`) et 14 (FLIP). **Lecture :** ~12 min. **Fichiers concernés :** `assets/css/index.css`, `shared/utils/motion.ts`, `useCountUp.ts`, `useFlipAnimation.ts`, `WidgetGrid.tsx`, `WidgetGridCell.tsx`.

## 1. Le problème

La charte a choisi des animations « expressives » (choix 9A) : cascade d'entrée, rebonds, compteurs, pastille qui pulse. Pour la plupart des gens, c'est agréable. Mais pour une partie des utilisateurs, ce n'est pas qu'une question de goût :

- les personnes atteintes de **troubles vestibulaires** (l'oreille interne, qui gère l'équilibre) peuvent avoir des vertiges ou des nausées quand de grands éléments glissent ou rebondissent à l'écran ;
- certaines personnes avec des troubles de l'attention trouvent les animations en boucle très difficiles à ignorer ;
- d'autres préfèrent simplement une interface calme.

Ces personnes l'ont déjà dit à leur système d'exploitation. Notre travail : **écouter ce réglage**, et couper nos animations quand il est actif. C'est la condition non négociable de la charte (§7).

## 2. La notion

### Le réglage du système

- **Windows 11** : Paramètres > Accessibilité > Effets visuels > **Effets d'animation**, à désactiver.
- **macOS** : Réglages Système > Accessibilité > Affichage > **Réduire les animations**.
- **iOS** : Réglages > Accessibilité > Mouvement > Réduire les animations. **Android** : Accessibilité > Supprimer les animations.

Le navigateur lit ce réglage et l'expose aux pages web.

### La media query

En CSS, une **media query** applique des règles seulement si une condition sur l'environnement est vraie (taille d'écran, mode sombre...). Celle-ci teste le réglage :

```css
@media (prefers-reduced-motion: reduce) {
    /* règles appliquées seulement si l'utilisateur a demandé moins d'animations */
}
```

Elle a deux valeurs : `reduce` (le réglage est actif) et `no-preference` (rien de demandé).

### Deux mondes à couvrir : le CSS et le JavaScript

La media query règle les animations **écrites en CSS** : transitions et `@keyframes`. Mais l'app anime aussi en JavaScript, et ces animations-là n'obéissent pas aux propriétés CSS :

- `element.animate()` (WAAPI, chapitre 14) a sa propre durée, passée en option ;
- une boucle `requestAnimationFrame` (chapitre 13) ne connaît pas le CSS du tout ;
- `scrollIntoView({ behavior: "smooth" })` : le `"smooth"` écrit en JS l'emporte sur la propriété CSS `scroll-behavior` ;
- un `setTimeout` qui attend la fin d'une animation attend toujours le même temps, même si l'animation CSS a été raccourcie.

En JavaScript, on lit le même réglage avec `window.matchMedia` :

```js
window.matchMedia("(prefers-reduced-motion: reduce)").matches   // true ou false
```

`matchMedia` prend exactement le texte d'une media query et renvoie un objet dont la propriété `matches` dit si elle est vraie **en ce moment**.

## 3. Exemple minimal

Colle ceci dans `reduced.html` :

```html
<style>
  .ball { width: 40px; height: 40px; border-radius: 50%; background: #6366f1;
          animation: bounce 0.8s ease-in-out infinite alternate; }
  @keyframes bounce { to { translate: 0 80px; } }

  @media (prefers-reduced-motion: reduce) {
    .ball { animation: none; }
  }
</style>
<div class="ball"></div>
<p id="js"></p>
<script>
  document.getElementById("js").textContent =
    "JS : prefers-reduced-motion = " + window.matchMedia("(prefers-reduced-motion: reduce)").matches;
</script>
```

Ce que tu dois observer : la balle rebondit et le texte dit `false`. Active l'émulation (voir « Comment tester » au §4) et recharge : la balle ne bouge plus, et le texte dit `true`.

## 4. Dans XiaoTrack

### Côté CSS : une seule règle pour toute l'app, [index.css](../../apps/web/src/assets/css/index.css) (l. 261-273)

```css
/* One switch for the whole app: when the system asks for less motion, CSS animations and
   transitions end at once. JS animations (FLIP, count-up) check prefersReducedMotion(). */
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-delay: 0ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}
```

Plutôt que d'écrire une exception dans chaque fichier CSS, une seule règle touche **tous les éléments** :

- `*, *::before, *::after` : tous les éléments, et leurs pseudo-éléments. Les guides de la grille (`.widget-grid::before`) et l'anneau d'un widget ajouté (`.widget-cell.is-new::after`) sont des pseudo-éléments : sans les deux dernières lignes du sélecteur, ils continueraient d'animer.
- `animation-duration: 0.01ms` : chaque animation dure un centième de milliseconde, donc elle saute directement à sa fin.
- `animation-delay: 0ms` : la cascade d'entrée des widgets (un délai croissant par widget) disparaît.
- `animation-iteration-count: 1` : les animations infinies (la pastille « Unsaved changes » qui pulse, le reflet du squelette de chargement, le « + » de l'état vide qui respire) ne tournent qu'une fois, puis s'arrêtent.
- `transition-duration: 0.01ms` : survols et changements d'état sont instantanés.
- `scroll-behavior: auto` : pas de défilement doux déclenché par le CSS.

**Pourquoi 0,01 ms et pas 0 ?** Une transition de durée nulle n'existe tout simplement pas : le navigateur ne la lance pas, et l'événement `transitionend` ne se déclenche jamais. Un code qui l'attendrait resterait bloqué. Avec 0,01 ms, l'animation ou la transition existe bel et bien, se termine aussitôt, applique son état final (par exemple `forwards` sur la sortie d'un widget, chapitre 11) et émet ses événements. Le résultat est le même à l'œil, sans casser la mécanique. C'est la recette classique.

**Pourquoi `!important` ?** Les règles des composants (`widget-grid.css`, `modal.css`...) déclarent leurs propres durées, avec des sélecteurs plus précis que `*`. Sans `!important`, elles gagneraient. Avec `!important`, cette règle passe devant toutes les déclarations normales. Et comme elle est dans `@layer base`, la plus ancienne des couches, elle gagne aussi contre d'éventuels `!important` des couches suivantes : pour les déclarations importantes, l'ordre des couches s'inverse, la première couche l'emporte (chapitre 02).

### Côté JavaScript : [motion.ts](../../apps/web/src/shared/utils/motion.ts)

```ts
/**
 * The system asks for less motion (accessibility setting).
 * CSS is already handled globally in index.css; JS animations (WAAPI, requestAnimationFrame,
 * smooth scrolling, timers waiting for an animation) must check this themselves.
 */
export function prefersReducedMotion(): boolean {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
```

Une petite fonction pure, dans `shared/utils` (pas de React, réutilisable partout), importée sous la forme `import { prefersReducedMotion } from "@/shared/utils"`. Elle relit le réglage à chaque appel : si l'utilisateur change son réglage pendant que l'app est ouverte, la prochaine animation en tient compte.

Elle est consultée à quatre endroits, un par type d'animation JavaScript :

| Fichier | Ligne | Ce qui change avec le réglage actif |
|---|---|---|
| [useCountUp.ts](../../apps/web/src/components/widgets/hooks/useCountUp.ts) | l. 17 et 22 | `instant` vaut `true`, la progression vaut 1 dès la première image : le nombre s'affiche directement à sa valeur finale. |
| [useFlipAnimation.ts](../../apps/web/src/components/widgets/hooks/useFlipAnimation.ts) | l. 48 | `animate` vaut `false` : les positions sont toujours mesurées, mais aucune cellule ne glisse, elles changent de case directement. |
| [WidgetGrid.tsx](../../apps/web/src/components/widgets/WidgetGrid.tsx) | l. 82 | Le minuteur de suppression passe de `WIDGET_EXIT_MS` (200 ms) à 0. Sans ça, l'animation de sortie CSS serait instantanée, mais le widget resterait en place, invisible, pendant 200 ms. |
| [WidgetGridCell.tsx](../../apps/web/src/components/widgets/WidgetGridCell.tsx) | l. 24 | `scrollIntoView` utilise `behavior: "auto"` (saut direct) au lieu de `"smooth"` pour amener à l'écran un widget qu'on vient d'ajouter. |

L'extrait de `WidgetGrid.tsx` (l. 74-82), pour voir le principe :

```ts
const timer = window.setTimeout(() => {
    exitTimersRef.current.delete(id);
    // ...
    onRemoveWidget(id);
}, prefersReducedMotion() ? 0 : WIDGET_EXIT_MS);
```

Et celui de `WidgetGridCell.tsx` (l. 24) :

```ts
ref.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest" });
```

### Comment tester sans changer le réglage de Windows

Dans Chrome ou Edge :

1. Ouvre les DevTools (F12).
2. `Ctrl+Shift+P`, tape « rendering » et choisis **Show Rendering**. Un panneau « Rendering » s'ouvre en bas.
3. Dans **Emulate CSS media feature prefers-reduced-motion**, choisis `prefers-reduced-motion: reduce`.

L'onglet se comporte alors comme si le réglage du système était actif, pour le CSS **et** pour `matchMedia`. L'émulation ne dure que tant que les DevTools sont ouverts sur cet onglet.

## 5. Pièges

- **Ne traiter que le CSS.** La règle globale ne touche ni la WAAPI, ni `requestAnimationFrame`, ni les options de `scrollIntoView`, ni les minuteurs. Toute nouvelle animation en JavaScript doit appeler `prefersReducedMotion()`.
- **Mettre une durée de 0** au lieu de 0,01 ms : les transitions ne démarrent plus et leurs événements ne partent jamais.
- **Écrire `animation: none`** : l'animation est supprimée, et avec elle son état final (une sortie en `forwards` ne laisserait pas l'élément invisible).
- **Oublier `::before` et `::after`** dans le sélecteur : les pseudo-éléments continuent d'animer.
- **Croire que « réduire » veut dire « supprimer »** : ici, on coupe tout, c'est le plus sûr. Une approche plus fine remplacerait les grands mouvements par de simples fondus, que la plupart des personnes concernées supportent bien. Ce serait une évolution possible de la charte.

## 6. À retenir

- `prefers-reduced-motion: reduce` traduit un réglage d'accessibilité du système : le respecter n'est pas optionnel.
- Une seule règle CSS globale (`@layer base`, `!important`, 0,01 ms) neutralise toutes les animations et transitions CSS de l'app.
- Le JavaScript n'est pas concerné par cette règle : chaque animation JS consulte `prefersReducedMotion()` (`window.matchMedia`).
- On teste avec DevTools > Rendering > Emulate CSS media feature `prefers-reduced-motion`.

## 7. Exercice

1. Active l'émulation `prefers-reduced-motion: reduce` dans les DevTools.
2. Recharge le dashboard (avec des widgets enregistrés) : comment arrivent les widgets et leurs chiffres ?
3. Passe en mode édition : la pastille de la barre d'édition pulse-t-elle après une modification ?
4. Fais un drag qui pousse des voisins, puis lâche.
5. Dans la console, tape `window.matchMedia("(prefers-reduced-motion: reduce)").matches`, puis désactive l'émulation et retape-le.

Question : un développeur ajoute demain un graphique dont les barres montent avec `element.animate()`. Que doit-il faire pour respecter la règle ?

<details><summary>Solution</summary>

2. Les widgets apparaissent tous en même temps, sans glissement ni cascade, et les chiffres s'affichent directement à leur valeur (pas de défilement depuis 0).
3. La pastille passe en ambre mais ne pulse pas : l'animation infinie ne tourne qu'une fois, en 0,01 ms.
4. Le widget tenu suit toujours le pointeur (ce n'est pas une animation, c'est un suivi direct). Les voisins changent de case d'un coup, et le widget lâché se pose sans glisser ni rebondir.
5. `true` avec l'émulation, `false` sans.

Question : `element.animate()` ignore la règle CSS globale. Il doit tester `prefersReducedMotion()` avant de lancer l'animation, et soit ne pas l'animer du tout, soit lui donner une durée de 0, comme le fait `useFlipAnimation` avec sa variable `animate`.

</details>
