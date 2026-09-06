# Fiche 8 — Pointer Events

> **Taille** : moyenne · **Dépend de** : fiche 4 · **Débloque** : la saisie du drag, couche 2 de l'ADR.

## Pourquoi tu en as besoin

L'ADR du 15/06 a retenu Pointer Events comme base du drag, sans lib. Cette fiche te donne l'API et, surtout, la seule chose qui distingue un drag qui marche d'un drag qui décroche.

Elle ne traite que la **saisie** : capter le geste et le traduire en `{x, y}` de grille. Ce qu'on fait de ce `{x, y}` — la résolution des collisions — c'est la fiche 3, déjà faite.

---

## 1. Une API pour trois périphériques

Historiquement, il fallait gérer `mousedown/mousemove/mouseup` **et** `touchstart/touchmove/touchend`, avec des formes d'événement différentes et des conflits entre les deux.

Pointer Events unifie : souris, doigt et stylet produisent les mêmes événements.

```
pointerdown  →  pointermove (× N)  →  pointerup
```

L'événement porte `pointerType` (`"mouse"`, `"touch"`, `"pen"`) si tu as besoin de distinguer, et `pointerId` pour suivre plusieurs doigts. Tu n'auras besoin ni de l'un ni de l'autre en v1, mais sache qu'ils existent.

## 2. `setPointerCapture` — le cœur de la fiche

Voilà le comportement par défaut, et pourquoi il est inutilisable :

Les événements de pointeur sont envoyés à l'élément **survolé**. Pendant un drag, dès que ton curseur sort du widget — parce que tu bouges plus vite que le rendu, ou que tu passes au-dessus d'un autre widget — les `pointermove` partent ailleurs. Ton drag décroche. Le widget reste planté à mi-chemin.

`setPointerCapture` corrige ça :

```js
element.setPointerCapture(event.pointerId);
```

À partir de cet appel, **tous** les événements de ce pointeur sont envoyés à cet élément, où que soit le curseur — au-dessus d'un autre widget, hors du conteneur, hors de la fenêtre. Jusqu'au `pointerup`, où la capture est relâchée automatiquement.

C'est la ligne à ne pas oublier. Sans elle, ton drag marche dans 90 % des cas et décroche exactement quand l'utilisateur bouge vite.

**L'alternative courante est mauvaise** : beaucoup de tutoriels attachent les `mousemove` sur `window` au lieu de capturer. Ça marche à peu près, puis ça casse dès qu'il y a deux zones draguables, et le nettoyage des écouteurs devient une source de fuites. Tu as un outil natif prévu pour ça — utilise-le.

## 3. Des pixels vers une cellule

Un `pointermove` te donne `clientX` / `clientY` : des coordonnées **dans la fenêtre**. Il te faut une position **dans la grille**.

```js
const rect = conteneur.getBoundingClientRect();
const xLocal = event.clientX - rect.left;
const yLocal = event.clientY - rect.top;
```

Puis diviser par la taille d'une cellule. Attention, une cellule n'est pas `largeur / 12` : il y a les gouttières.

Pour 12 colonnes séparées par 11 gouttières de `g` pixels dans une largeur `L` :

```
largeurColonne = (L - 11 × g) / 12
```

Et le **pas** d'une colonne à la suivante est `largeurColonne + g`, pas `largeurColonne`. C'est la distance qui t'intéresse pour convertir une position en indice.

Ensuite : arrondir, et **borner** entre 0 et `12 - w` pour qu'un widget de 3 colonnes ne commence pas en colonne 11.

**Ne code pas les dimensions en dur.** `getBoundingClientRect()` te donne la largeur réelle du conteneur, qui change avec la fenêtre et l'ouverture de la sidebar. Un `380` écrit en dur marchera sur ton écran et nulle part ailleurs.

## 4. Le décalage de saisie

Détail qui change tout pour la sensation.

Si tu calcules la position du widget directement depuis le curseur, le widget saute pour se centrer sous lui au premier mouvement. Désagréable.

Il faut mémoriser, au `pointerdown`, **où dans le widget** l'utilisateur a cliqué, et conserver ce décalage pendant tout le drag. Le widget suit alors le curseur en gardant le point de saisie.

Ce décalage est une valeur qui ne doit pas provoquer de rendu : c'est un cas d'usage de `useRef` (fiche 9).

## 5. `touch-action`

Sur un écran tactile, le navigateur interprète un glissement comme un défilement. Ton `pointermove` est alors annulé par un `pointercancel`, et ton drag meurt.

```css
touch-action: none;
```

sur l'élément draguable dit au navigateur de ne pas interpréter les gestes lui-même.

Le mode édition est désactivé sur mobile (§3.6 du CDC), donc ce n'est pas critique en v1 — mais un écran tactile n'est pas forcément petit, et un portable convertible passera par ce chemin.

## 6. Ne pas déclencher un clic à la fin

Un `pointerdown` suivi d'un `pointerup` sur le même élément produit aussi un `click`. Si ton widget a une action au clic, elle se déclenchera à la fin de chaque drag.

La parade habituelle : considérer que c'est un drag seulement au-delà d'un **seuil** de quelques pixels. En dessous, c'est un clic. Au-dessus, tu marques un drapeau et tu ignores le `click` qui suit.

Ce seuil a un autre bénéfice : il évite qu'un clic un peu tremblant déplace un widget d'une cellule.

## 7. `preventDefault` sur le `dragstart`

Le navigateur a son propre mécanisme de glisser-déposer (HTML Drag and Drop), qui se déclenche notamment sur les images et le texte sélectionné. Il produit une image fantôme et interfère avec le tien.

Empêcher la sélection de texte (`user-select: none`) sur la poignée, et bloquer l'événement `dragstart` natif si nécessaire.

---

## Exercices

### Exercice 1 — Le trio

Un carré dans un conteneur. Journaliser `pointerdown`, `pointermove`, `pointerup` avec les coordonnées.

**Attendu** : tu vois la séquence, et tu constates la fréquence des `pointermove`.

### Exercice 2 — Le décrochage

Faire suivre le carré au curseur, **sans** `setPointerCapture`. Puis faire un mouvement rapide qui sort du carré.

**Attendu** : tu vois le drag décrocher. C'est le but de l'exercice — provoque-le volontairement pour reconnaître le symptôme.

### Exercice 3 — La capture

Ajouter `setPointerCapture`. Refaire le mouvement rapide, sortir du conteneur, sortir de la fenêtre.

**Attendu** : le carré suit dans tous les cas, et relâcher hors de la fenêtre termine proprement le drag.

### Exercice 4 — Le décalage de saisie

Cliquer dans le coin inférieur droit du carré et le déplacer.

**Attendu** : sans gestion du décalage, le carré saute pour se centrer. Avec, il garde son point de saisie.

### Exercice 5 — L'aimantation

Le carré ne suit plus librement le curseur : il **saute de cellule en cellule** sur une grille de 12 colonnes. Afficher en permanence le `{x, y}` calculé.

**Attendu** : le `{x, y}` affiché correspond à la cellule sous le curseur, sur toute la largeur, et redimensionner la fenêtre ne fausse pas le calcul.

### Exercice 6 — Les bornes

Amener le carré au-delà du bord droit et au-delà du bord gauche.

**Attendu** : `x` ne descend jamais sous 0 ni ne dépasse `12 - w`. Un carré de 3 colonnes s'arrête à `x = 9`.

### Exercice 7 — Le seuil

Ajouter une action au clic sur le carré (journaliser quelque chose). Faire un drag, puis un simple clic.

**Attendu** : le clic déclenche l'action, le drag non.

### Exercice 8 — Deux carrés

Dupliquer le carré. Les déplacer l'un après l'autre, puis tenter de commencer un drag sur l'un pendant que le curseur passe sur l'autre.

**Attendu** : aucune interférence. C'est ce que la capture te garantit et qu'un écouteur global sur `window` ne te donnerait pas.

---

## Réussi quand

- Tu traverses toute la grille, à toute vitesse, en sortant de la fenêtre, sans jamais perdre le carré.
- Le `{x, y}` affiché est juste, y compris après un redimensionnement.
- Le carré ne sort jamais des bornes.
- Un clic reste un clic.

---

## Les pièges

**Oublier `setPointerCapture`.** Le piège numéro un, et il est trompeur : ça marche parfaitement en test lent, ça décroche en usage réel. Si tu te retrouves à ajouter des écouteurs sur `window` pour compenser, c'est le signe que la capture manque.

**Coder les dimensions en dur.** La largeur du conteneur change avec la fenêtre. Mesure au `pointerdown`, ou à chaque `pointermove` si tu veux gérer un redimensionnement pendant le drag.

**Oublier la gouttière dans la conversion.** Symptôme caractéristique : le calcul est juste dans les premières colonnes et dérive de plus en plus vers la droite. Onze gouttières de 16px, c'est 176 pixels de dérive cumulée sur la largeur.

**Ne pas mémoriser le décalage de saisie.** Le widget saute au premier mouvement. Fonctionnellement correct, désagréable à utiliser.

**Mettre la position du pointeur dans un `useState`.** Un rendu à chaque `pointermove`, soit 60 par seconde, de tout le sous-arbre. C'est exactement ce que la décision « transient-local » du 15/06 veut éviter — et c'est le sujet de la fiche 9.

**Oublier de borner.** Un widget en `x = 11` de largeur 3 déborde de la grille, et CSS Grid créera silencieusement des colonnes supplémentaires pour l'accueillir. Ta grille de 12 colonnes en aura 14, et toutes les autres rétréciront.
