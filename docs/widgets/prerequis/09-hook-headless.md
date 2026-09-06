# Fiche 9 — Hook headless

> **Taille** : moyenne · **Dépend de** : fiche 8 · **Débloque** : `useDraggable` — la couche 2 de l'ADR, le comportement séparé de la présentation.

## Pourquoi tu en as besoin

L'ADR du 15/06 sépare cinq couches, et la deuxième est « comportement = hook headless `useDraggable`, retourne `{position, handlers}`, ne rend aucun JSX ». Cette fiche construit exactement ça.

L'enjeu réel : le drag est de la logique (mémoriser un décalage, convertir des pixels, borner) et le widget est de la présentation. Mélangés, tu obtiens un composant que tu ne peux ni tester, ni réutiliser, ni lire.

C'est aussi la réponse React à une question que ton passé POO pose naturellement : **comment partager un comportement entre plusieurs composants sans héritage ?**

---

## 1. Ce qu'est un hook headless

*Headless* = sans tête, sans rendu. Le hook gère un comportement et retourne de quoi le brancher. Il ne décide d'aucun pixel.

```
useDraggable(...)
      │
      ├── retourne : l'état du drag (en cours ? position ?)
      └── retourne : des gestionnaires d'événements à poser sur un élément

le composant décide : à quoi ça ressemble, où vont les gestionnaires
```

Le partage de responsabilité :

| Le hook sait | Le composant sait |
|---|---|
| Comment convertir un pixel en cellule | Quelle bordure a un widget qu'on déplace |
| Quand un geste commence et finit | Que la poignée est en haut à gauche |
| Comment borner une position | Quelle ombre porter pendant le drag |

Deux composants d'apparence totalement différente peuvent utiliser le même hook.

## 2. Le pattern « objet de gestionnaires »

La convention : le hook retourne un objet de props, que le composant étale sur l'élément concerné.

```tsx
const { isDragging, handlers } = useDraggable(...);

return <div {...handlers} className={isDragging ? "..." : "..."} />;
```

L'intérêt de regrouper plutôt que de retourner chaque gestionnaire séparément : le jour où le hook a besoin d'un événement de plus, ou d'un attribut (`touch-action`, `role`), il l'ajoute à l'objet sans que les composants consommateurs changent d'une ligne.

Une précaution : si le composant a **aussi** ses propres gestionnaires sur le même élément, l'étalement les écrase. Il faut alors les composer explicitement.

## 3. `useRef` : ce qui survit sans re-rendre

C'est la notion centrale de la fiche, et celle que tu as déjà creusée le 16/06.

| | `useState` | `useRef` |
|---|---|---|
| Survit aux rendus | oui | oui |
| Déclenche un rendu quand ça change | **oui** | **non** |
| Lecture | directe | via `.current` |
| Modification | via le setter | par affectation |

Un `useRef` est une boîte que React conserve entre les rendus et qu'il ignore complètement.

**Quand utiliser lequel** : si la valeur change ce qui est **affiché**, c'est `useState`. Si elle ne sert qu'à ton calcul, c'est `useRef`.

Pour le drag :

- le **décalage de saisie** (où l'utilisateur a cliqué dans le widget) : `useRef`. Il est fixé au `pointerdown`, ne change plus, et personne ne l'affiche.
- la **position de départ** : `useRef`, même raison.
- le fait qu'un drag soit **en cours** : `useState`, parce que le widget change d'apparence.
- la **position courante** : c'est la question de la section suivante.

## 4. Le piège de performance

L'implémentation naïve met la position courante dans un `useState` et la met à jour à chaque `pointermove`.

Résultat : 60 rendus par seconde. Si ce state vit dans le Dashboard, c'est **tout le dashboard** qui se re-rend 60 fois par seconde — tous les widgets, tous leurs contenus.

C'est précisément ce que la décision du 15/06 appelle « transient-local » : pendant le déplacement, la position du widget déplacé vit **localement**, sans remonter au parent. Elle n'est commitée dans le state du Dashboard qu'au `pointerup`.

Trois niveaux, du plus simple au plus rapide :

1. **`useState` local au widget.** Le widget déplacé se re-rend 60 fois par seconde, mais lui seul. Souvent suffisant, et c'est là qu'il faut commencer.
2. **`useRef` + écriture directe du `transform`.** Le hook écrit dans le style de l'élément sans passer par React. Zéro rendu. Plus rapide, moins « React ».
3. **Ne rien optimiser avant d'avoir mesuré.**

Commence par le niveau 1. Mesure. N'optimise que si tu vois quelque chose.

**Attention à une nuance du CDC (§4.2)** : ce raisonnement vaut pour le widget *déplacé*. Les widgets *poussés*, eux, doivent bouger pendant le drag — donc leur position doit être recalculée en continu, et ça, ça passe par le parent. Le transient-local ne les concerne pas.

## 5. Pourquoi un hook plutôt que de l'héritage

La question que ton modèle POO pose : en Delphi, tu ferais une classe `TDraggableControl` dont les widgets hériteraient.

React n'a pas ça, et c'est délibéré. L'héritage impose une hiérarchie unique : un widget qui doit être draguable **et** redimensionnable devrait hériter de deux classes, ou d'une classe qui fait les deux.

Avec des hooks, il en appelle simplement deux :

```tsx
const drag = useDraggable(...);
const resize = useResizable(...);
```

Aucune hiérarchie, aucun ordre imposé, aucune classe intermédiaire. C'est ce qui rendra `useResizable` facile à ajouter le jour venu — il ne touchera à rien de ce qui existe.

## 6. La signature à concevoir

C'est le vrai travail de conception de cette fiche. Réfléchis avant de coder :

**Ce que le hook doit recevoir.** De quoi a-t-il besoin pour convertir des pixels en cellules ? Comment obtient-il les dimensions du conteneur ? Comment prévient-il le parent qu'un drag est terminé ?

**Ce qu'il doit retourner.** Quel est le minimum pour que le composant sache s'afficher correctement pendant un drag ?

**Ce qu'il ne doit pas savoir.** Il ne doit connaître ni le catalogue, ni les autres widgets, ni l'algorithme de collision. Il traduit un geste en position, point.

Un signe que ta signature est bonne : le hook est utilisable sur un carré gris sans aucun rapport avec les widgets. C'est ce que teste l'exercice 3.

---

## Exercices

### Exercice 1 — `useState` contre `useRef`

Un composant avec un compteur en `useState` et un en `useRef`, tous deux incrémentés par le même bouton, tous deux affichés.

**Attendu** : le compteur `useRef` ne se met pas à jour à l'écran, mais tu peux prouver (par un journal, ou en forçant un rendu) qu'il a bien été incrémenté. Tu peux expliquer pourquoi.

### Exercice 2 — L'extraction

Reprendre le carré draguable de la fiche 8 et extraire toute la logique de pointeur dans un hook. **Sans changer le comportement.**

**Attendu** : le composant ne contient plus que du JSX et un étalement de gestionnaires. Aucune arithmétique de pixels, aucun `getBoundingClientRect`, aucun `setPointerCapture`.

### Exercice 3 — La réutilisation

Brancher le hook sur **deux** éléments d'apparence totalement différente dans la même page — un carré et, disons, une carte avec du texte.

**Attendu** : les deux se déplacent, indépendamment, sans interférence, et le hook n'a pas été modifié pour accueillir le second.

### Exercice 4 — La bonne boîte

Repérer, dans ton hook, chaque valeur conservée entre les rendus, et justifier son `useState` ou son `useRef`.

**Attendu** : tu peux dire pour chacune « celle-ci change l'affichage » ou « celle-ci ne sert qu'au calcul ». Si tu as un `useState` dont la valeur n'apparaît nulle part dans le JSX, c'est un `useRef` déguisé.

### Exercice 5 — Compter les rendus

Ajouter un compteur de rendus dans le composant draguable (un `useRef` incrémenté à chaque rendu, journalisé). Faire un drag de deux secondes.

**Attendu** : tu connais le nombre de rendus produits par un drag, et tu peux dire si c'est un problème.

### Exercice 6 — L'isolation

Placer le composant draguable à côté de trois autres composants qui journalisent leurs rendus. Faire un drag.

**Attendu** : les trois voisins ne se re-rendent pas. Si tu les vois se re-rendre, la position remonte trop haut dans l'arbre — c'est le sujet de la section 4.

### Exercice 7 — La composition (optionnel)

Écrire un second hook trivial — `useHover`, par exemple, qui retourne un booléen et des gestionnaires — et l'utiliser sur le **même** élément que `useDraggable`.

**Attendu** : les deux fonctionnent ensemble. Tu constateras que l'étalement naïf des deux objets de gestionnaires écrase l'un par l'autre, et tu devras les composer. C'est le problème que l'héritage résoudrait mal.

---

## Réussi quand

- Le composant draguable ne contient aucune logique de pointeur.
- Le hook marche sur deux éléments visuellement sans rapport.
- Tu peux justifier chaque `useState` et chaque `useRef` de ton hook.
- Un drag ne re-rend pas les composants voisins.

---

## Les pièges

**La position en `useState` remontée au parent.** 60 rendus par seconde de tout le sous-arbre. C'est le piège que l'ADR nomme et que l'exercice 6 détecte.

**Un `useState` pour une valeur jamais affichée.** Chaque mise à jour déclenche un rendu inutile. Passe en revue tes états : si la valeur n'apparaît pas dans le JSX, elle n'a rien à faire dans un `useState`.

**Un `useRef` pour une valeur affichée.** L'inverse : l'écran ne se met jamais à jour, et tu cherches le bug dans ta logique alors qu'elle est correcte.

**Un hook qui rend du JSX.** Ce n'est plus un hook headless, c'est un composant mal nommé. Un hook retourne des données et des fonctions, jamais des éléments.

**Un hook qui en sait trop.** Si `useDraggable` importe le catalogue de widgets ou l'algorithme de collision, il n'est plus réutilisable et l'exercice 3 échouera. Il traduit un geste en position ; ce qu'on fait de cette position ne le regarde pas.

**Écraser les gestionnaires.** `<div {...handlers} onPointerDown={monTruc} />` remplace celui du hook et casse le drag. L'ordre d'écriture compte, et la composition explicite est plus sûre que l'ordre.
