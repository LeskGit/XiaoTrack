# Système de widgets — Plan de développement V2 (déplacement)

> **Pour qui** : toi, clavier en main, avec Claude en assistant (règle du CLAUDE.md : tu codes la logique, Claude t'aide sur les notions nouvelles et écrit le HTML/CSS répétitif à ta demande).
> **Spec de référence** : [`04-cadrage-v2.md`](04-cadrage-v2.md) (les renvois `§` pointent vers lui ; `V1 §` renvoie à [`00-cadrage-v1.md`](00-cadrage-v1.md)).
> **Point de départ** : la V1 validée le 2026-10-30 (persistance `localStorage`, ajout et suppression, mode édition).
> **Règle d'or** : chaque étape laisse une app **qui compile et qui tourne**. Ne passe à l'étape suivante que quand le « Terminé quand » est vrai. Un commit par étape.
> **Moteur maison** : décision confirmée le 2026-10-30. react-grid-layout sert seulement de **référence de lecture** (`node_modules/react-grid-layout/dist/`, chercher `compact` et `moveElementAwayFromCollision`).

---

## Vue d'ensemble

```
PHASE 0 ─ Préparation            V1 commitée, moteur géométrique redevenu pur, constantes V2
   │
PHASE 1 ─ Moteur pur (Vitest)    compactLayout, poussée, resolveLayout, pointToCell — sans React
   │
PHASE 2 ─ Le geste, sans aperçu  poignée, useGridDrag, le widget suit le pointeur, drop, Échap
   │
PHASE 3 ─ L'aperçu               disposition provisoire, pointillés, délai sur la case
   │
PHASE 4 ─ Défilement automatique la page défile près des bords pendant le geste
   │
PHASE 5 ─ Style et animation     état visuel du geste, voisins animés (FLIP)
   │
PHASE 6 ─ Recette                les critères du §9, plus la non-régression V1
```

La phase 1 est **entièrement testable sans navigateur**. C'est là que se trouve la difficulté algorithmique : ne passe pas à la phase 2 tant qu'elle n'est pas verte. Les phases 4 et 5 sont indépendantes l'une de l'autre.

---

## Les schémas de référence

### A. Arborescence (ajouts V2)

```
components/widgets/
├─ widget-grid.constants.ts      + DRAG_DWELL_MS, AUTO_SCROLL_*
├─ engine/
│  ├─ geometry.ts                ← redevient du calcul pur (aucun import du catalogue)
│  ├─ instance.ts                ← + minSizeOf, hasValidSize ; createInstance place en bas
│  ├─ compact.ts   + .test.ts    ← compactLayout
│  ├─ resolve.ts   + .test.ts    ← findPushedSpot, resolveLayout
│  └─ pointer.ts   + .test.ts    ← pointToCell
├─ hooks/
│  └─ useGridDrag.ts             ← le geste : capture, mesure, photo, case visée, délai, Échap, défilement
├─ WidgetGrid.tsx                ← rend la disposition provisoire, les pointillés, le widget attrapé
└─ WidgetCard.tsx                ← la barre de titre devient la poignée
```

Les noms sont des propositions. Seule la **séparation** compte : calcul pur dans `engine/`, geste dans le hook, affichage dans les composants.

### B. Les états du geste

```
            pointerdown sur la poignée (mode édition)
  ┌──────┐  ─────────────────────────────────────────►  ┌───────────┐
  │ IDLE │                                              │ DRAGGING  │ ◄─┐ pointermove / scroll :
  └──────┘  ◄─────────────────────────────────────────  └───────────┘ ──┘ case visée recalculée
     ▲        pointerup  → onDrop(disposition finale)         │
     │                                                        │
     └──────── Échap / pointercancel → rien n'est écrit ◄─────┘
```

### C. Le flux de données pendant un geste

```
pointeur (px) ──► pointToCell ──► case visée ──┬─► resolveLayout(photo, M, case) ──► provisoire
                    ▲                          │        (calcul immédiat)              │
       getBoundingClientRect                   │                                       ├─► pointillés : tout de suite
       à chaque mouvement                      │                                       │
                                               └─► minuteur DRAG_DWELL_MS ─────────────┴─► voisins : après le délai

pointerup ──► resolveLayout(photo, M, case finale) ──► onDrop ──► setDraftWidgets   (UNE écriture)
```

### D. La résolution

Voir §4.2 : retirer M, compacter, insérer M (épinglé), repousser (colonne d'origine, puis droite en cascade, puis bas), compacter. Les exemples du tableau du §4.2 sont tes tests de référence.

---

## PHASE 0 — Préparation

### Étape 0.1 — Clore la V1
- **Fichiers** : aucun nouveau.
- **À faire** : commiter la phase 6 de la V1 si ce n'est pas fait. Vérifier `npm run build`, `npm run lint` et `npm test`.
- **Terminé quand** : `git status` est propre, et tout est vert.

### Étape 0.2 — Rendre `geometry.ts` pur à nouveau
- **Fichiers** : `engine/geometry.ts`, `engine/instance.ts`, `engine/repair.ts`, les tests concernés.
- **À faire** : déplacer `minSizeOf` et `hasValidSize` dans `instance.ts`, à côté de `resolveWidgetDefaultSize`. `geometry.ts` ne doit plus importer ni le catalogue, ni les archétypes.
- **Pourquoi maintenant** : toute la phase 1 s'appuie sur `geometry.ts`. Sans dépendance au catalogue, ses tests restent simples, sans `vi.mock`.
- **Terminé quand** : `geometry.ts` n'importe que des types et `GRID_COLS`, et les tests passent toujours.

### Étape 0.3 — Les constantes V2
- **Fichiers** : `widget-grid.constants.ts`.
- **À faire** : `DRAG_DWELL_MS = 300`. Les constantes du défilement automatique attendront la phase 4.
- **Terminé quand** : la constante existe, avec un commentaire qui renvoie au §3.3.

---

## PHASE 1 — Moteur pur (§4, §5)

Tout se teste avec Vitest. Aucun React, aucun DOM.

### Étape 1.1 — `compactLayout`, test d'abord
- **Fichiers** : `engine/compact.ts` + `compact.test.ts`.
- **À faire** : `compactLayout(layout): WidgetInstance[]`, conforme au §5. Chaque widget, dans l'ordre de lecture, remonte tant qu'il ne chevauche aucun widget déjà traité et que `y > 0`.
- **Cas obligatoires** :
  - grille vide → `[]` ;
  - un widget en `y = 5`, seul → `y = 0` ;
  - une colonne avec un trou → le trou est refermé ;
  - un widget qui touche déjà le bas d'un autre → il ne bouge pas ;
  - deux colonnes indépendantes → chacune se compacte séparément ;
  - `x` et `size` ne changent jamais ;
  - **idempotence** : `compactLayout(compactLayout(l))` égale `compactLayout(l)` ;
  - l'entrée n'est pas modifiée.
- **Piège** : l'ordre de lecture compte. Si un widget est traité avant celui qui le soutient, il « traverse » sa place. Trie d'abord, avec `sortReadingOrder`.
- **Terminé quand** : tous les cas sont verts.

### Étape 1.2 — La compaction sur les actions existantes (§6)
- **Fichiers** : `engine/instance.ts`, `instance.test.ts`, `pages/Dashboard.tsx`.
- **À faire** :
  - `createInstance` pose le nouveau widget en `x: 0`, `y: bottomY(existing)` (et non plus à la première place libre) ;
  - dans le Dashboard, l'ajout et la suppression passent le nouveau brouillon par `compactLayout`.
- **Piège n°1** : les tests de `createInstance` attendent la première place libre. Ils doivent changer **avec** la règle : c'est une décision, pas une régression. `findFirstFreeSpot` devient inutilisé (supprime-le, ou garde-le en le documentant).
- **Piège n°2** : ne compacte pas au chargement (§5). La disposition enregistrée s'affiche telle quelle.
- **Terminé quand** : dans l'app, supprimer un widget fait remonter ceux du dessous, et un ajout remonte se poser sous le dernier widget de sa colonne.

### Étape 1.3 — Placer un widget gêné, test d'abord
- **Fichiers** : `engine/resolve.ts` + `resolve.test.ts`.
- **À faire** : `findPushedSpot(placed, widget): GridPosition`, qui applique la boucle de l'étape 4 du §4.2 : colonne d'origine, puis droite en cascade tant que `x + w ≤ 12`, puis descendre sous le widget posé chevauché, et recommencer.
- **Cas obligatoires** :
  - pas de chevauchement → position inchangée ;
  - chevauchement, place libre juste à droite → à droite, même `y` ;
  - à droite, un autre widget gêne mais il reste de la place plus loin → cascade ;
  - pas de place à droite (dépasserait 12) → en bas ;
  - pleine largeur → toujours en bas ;
  - après être descendu, la colonne d'origine est retentée avant la droite.
- **Piège** : « le bord droit du widget chevauché ». S'il y en a **plusieurs**, prends le plus à droite. Sinon tu testes une position qui chevauche encore.
- **Terminé quand** : tous les cas sont verts.

### Étape 1.4 — `resolveLayout`, test d'abord
- **Fichiers** : `engine/resolve.ts` + `resolve.test.ts`.
- **À faire** : `resolveLayout(snapshot, movedId, target)`, avec les 5 étapes du §4.2, en réutilisant `compactLayout` et `findPushedSpot`.
- **Cas obligatoires** : les 5 lignes du tableau du §4.2, plus :
  - la poussée à droite (une colonne de droite libérée par M) ;
  - la limite connue (A posé sur B côte à côte → la place de A reste vide) ;
  - une case visée hors bornes (`x` trop grand, `y` négatif) → bornée ;
  - un `movedId` inconnu → la photo est renvoyée sans changement ;
  - les propriétés : aucun chevauchement, aucun trou vertical, déterministe, photo non modifiée.
- **Piège n°1** : M est **épinglé** à l'étape 4 seulement. Il participe à la compaction finale (étape 5) et peut y remonter.
- **Piège n°2** : à l'étape 4, parcours les autres widgets dans l'ordre de lecture **du résultat de l'étape 2**, pas de la photo d'origine.
- **Lecture conseillée** : `moveElementAwayFromCollision` dans react-grid-layout, pour voir la règle « le gêné monte » qu'on a remplacée par « compacter avant d'insérer ».
- **Terminé quand** : tous les cas sont verts.

### Étape 1.5 — `pointToCell`, test d'abord
- **Fichiers** : `engine/pointer.ts` + `pointer.test.ts`.
- **À faire** : une fonction pure qui reçoit la position du pointeur, le décalage pris au `pointerdown`, le rectangle de la grille, les pas horizontal et vertical, et la taille du widget. Elle renvoie la case visée (§3.2) : arrondi, puis bornes `0 ≤ x ≤ 12 − w` et `y ≥ 0`.
- **Pourquoi pure** : la mesure du DOM se fait dans le hook (phase 2). La conversion, elle, se teste avec de faux rectangles.
- **Cas obligatoires** : coin pile sur une case ; juste avant et juste après la moitié d'une case (c'est la règle de bascule) ; pointeur à gauche de la grille → `x = 0` ; widget large près du bord droit → `x = 12 − w` ; pointeur au-dessus de la grille → `y = 0` ; grille décalée dans la page (le scroll) → même case.
- **Terminé quand** : tous les cas sont verts.

---

## PHASE 2 — Le geste, sans aperçu (§3)

À la fin de cette phase, on peut déplacer un widget. Les voisins ne bougent qu'au drop.

### Étape 2.1 — La poignée
- **Fichiers** : `WidgetCard.tsx`, `Widget.tsx`.
- **À faire** : la barre de titre reçoit des props de poignée (au minimum `onPointerDown`), seulement en mode édition, avec `touch-action: none` et un curseur `grab`.
- **Piège** : le `✕` est **dans** la barre de titre. Un `pointerdown` sur lui ne doit pas démarrer de geste. Teste la cible de l'événement, ou arrête la propagation sur le bouton.
- **Terminé quand** : un `pointerdown` sur la barre de titre affiche l'id dans la console, et un clic sur `✕` supprime sans rien afficher.

### Étape 2.2 — `useGridDrag` : du `pointerdown` au drop
- **Fichiers** : `hooks/useGridDrag.ts`, `WidgetGrid.tsx`, `pages/Dashboard.tsx`.
- **À faire** :
  - au `pointerdown` : `setPointerCapture`, prendre la photo de la disposition et noter le décalage entre le pointeur et le coin du widget ;
  - à chaque `pointermove` : relire `getBoundingClientRect()` de `.widget-grid`, lire le gap et la hauteur de rangée dans `getComputedStyle`, puis appeler `pointToCell` ;
  - au `pointerup` : `onDrop(resolveLayout(photo, id, case))`. Le Dashboard en fait son nouveau brouillon.
- **Notions** : Pointer Events et capture ; `useRef` pour ce qui change sans devoir provoquer de render (la photo, le décalage) ; `getComputedStyle`.
- **Piège n°1** : un handler créé au premier render voit les valeurs de **ce** render (closure). Ce qui doit être lu « à jour » pendant le geste va dans des refs.
- **Piège n°2** : un drop sur la case de départ produit un **nouveau tableau** identique, et `isDirty` passe à `true` alors que rien n'a changé. Si la disposition est identique, garde l'ancienne référence.
- **Piège n°3** : `gap` vaut `0.6cqi`. `getComputedStyle` te renvoie déjà la valeur en pixels. Ne réécris pas la formule CSS en JS.
- **Terminé quand** : on glisse un widget, on lâche, et il est à sa nouvelle place, les voisins poussés et la grille compactée. Annuler restaure tout. Enregistrer puis F5 conserve le résultat.

### Étape 2.3 — Le widget suit le pointeur
- **Fichiers** : `hooks/useGridDrag.ts`, `WidgetGrid.tsx`.
- **À faire** : pendant le geste, la cellule de M garde sa place dans la grille et reçoit un `transform: translate(dx, dy)` égal au déplacement du pointeur, ainsi qu'un `z-index` au-dessus des autres.
- **Piège n°1** : le déplacement en pixels change à chaque `pointermove`. Il doit provoquer un render du **seul** widget déplacé (ou de la grille), jamais du Dashboard.
- **Piège n°2** : le `transform` est relatif à la place d'origine de la cellule. Si la cellule changeait de place pendant le geste, le widget sauterait. La cellule de M ne bouge donc pas avant le drop.
- **Terminé quand** : le widget colle au pointeur au pixel près, et le Profiler des React DevTools ne montre pas le Dashboard pendant un geste.

### Étape 2.4 — Annuler le geste
- **Fichiers** : `hooks/useGridDrag.ts`.
- **À faire** : `Échap` et `pointercancel` remettent l'état à `IDLE` sans appeler `onDrop`.
- **Piège** : l'écouteur `keydown` sur `window` ne doit exister **que pendant** le geste. Ajoute-le au début et retire-le à **toutes** les sorties (drop, Échap, `pointercancel`, démontage).
- **Terminé quand** : `Échap` en plein geste remet le widget en place, et le brouillon n'a pas changé (le bouton Save reste désactivé).

---

## PHASE 3 — L'aperçu (§3.3)

### Étape 3.1 — La disposition provisoire et les pointillés
- **Fichiers** : `hooks/useGridDrag.ts`, `WidgetGrid.tsx`, `widget-grid.css`.
- **À faire** :
  - quand la case visée change, calculer `resolveLayout(photo, id, case)` ;
  - afficher une cellule « pointillés » à la position de M **dans ce résultat** ;
  - pour l'instant, sans délai : les voisins prennent tout de suite leur place provisoire.
- **Piège** : ne recalcule que si la case visée **change**, et non à chaque `pointermove`. Garde la dernière case dans une ref et compare `x` et `y`.
- **Terminé quand** : les voisins se poussent pendant le geste, les pointillés montrent l'atterrissage réel (y compris quand M remonte dans le vide), et ramener le pointeur au départ remet tout en place.

### Étape 3.2 — Le délai sur la case
- **Fichiers** : `hooks/useGridDrag.ts`.
- **À faire** : séparer la disposition **calculée** (immédiate, pour les pointillés) de la disposition **affichée pour les voisins** (après `DRAG_DWELL_MS` sur la même case). Chaque changement de case relance le minuteur.
- **Notions** : le debounce ; garder l'identifiant d'un `setTimeout` dans une ref.
- **Piège n°1** : le minuteur peut se déclencher **après** le drop ou `Échap`. Annule-le à toutes les sorties, comme l'écouteur de l'étape 2.4.
- **Piège n°2** : au drop, on n'attend pas le délai. La disposition écrite est celle de la case finale.
- **Terminé quand** : en survolant vite plusieurs cases, les voisins ne bougent pas. En s'arrêtant 300 ms sur une case, ils bougent. Un drop rapide applique quand même la bonne disposition.

---

## PHASE 4 — Défilement automatique (§3.5)

### Étape 4.1 — Trouver ce qui défile
- **Fichiers** : aucun, c'est une étape d'investigation.
- **À faire** : avec un dashboard plus haut que l'écran, déterminer l'élément qui défile : `window`, ou le conteneur de `MainContent` dans le layout en grille.
- **Terminé quand** : tu sais quel élément porte le `scrollTop` qui change, et tu l'as noté dans le §3.5 du cadrage.

### Étape 4.2 — La boucle de défilement
- **Fichiers** : `hooks/useGridDrag.ts`, `widget-grid.constants.ts`.
- **À faire** : quand le pointeur est dans la bande sensible près du bord haut ou bas, faire défiler à chaque frame (`requestAnimationFrame`). Après chaque défilement, recalculer la case visée avec la **dernière position connue** du pointeur, même s'il ne bouge plus.
- **Notions** : `requestAnimationFrame` et son annulation.
- **Piège** : la boucle doit s'arrêter quand le pointeur quitte la bande, et à toutes les sorties du geste.
- **Terminé quand** : on peut amener un widget du haut tout en bas d'un dashboard plus haut que l'écran, sans relâcher.

---

## PHASE 5 — Style et animation (§7)

### Étape 5.1 — L'état visuel du geste
- **Fichiers** : `widget-grid.css`, `WidgetGrid.tsx`.
- **À faire** : le widget attrapé élevé (ombre, léger agrandissement), le curseur `grabbing`, les pointillés lisibles, et pas de sélection de texte pendant le geste (`user-select: none`).
- **Note** : c'est du CSS répétitif, à déléguer à Claude si tu veux.
- **Terminé quand** : on comprend à l'œil quel widget est tenu et où il va atterrir.

### Étape 5.2 — Animer les voisins (FLIP)
- **Fichiers** : `WidgetGrid.tsx` (ou un petit hook dédié).
- **À faire** : quand les voisins changent de case, les faire glisser au lieu de les téléporter. Il faut mesurer les positions avant le changement, les remesurer après, appliquer un `transform` inverse, puis le retirer avec une transition (§7).
- **Notions** : FLIP ; `useLayoutEffect` (mesurer avant que le navigateur peigne) ; `prefers-reduced-motion`.
- **Piège** : n'anime **pas** le widget tenu : il suit déjà le pointeur.
- **Terminé quand** : les voisins glissent vers leur nouvelle place, et rien n'est animé quand le système demande de réduire les animations.

---

## PHASE 6 — Recette

Reprends un par un les **critères du §9** du cadrage V2, sur l'app réelle. Refais aussi les critères de la V1 (V1 §9), **sauf le n°5**, remplacé par le critère V2 n°6. Chaque critère qui échoue renvoie à une étape de ce plan. Une fois tout validé, la V2 est finie.
