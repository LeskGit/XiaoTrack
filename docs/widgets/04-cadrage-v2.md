# Système de widgets — Cadrage V2 (déplacement)

> **Statut** : cadrage validé le 2026-10-30. **Ce document fait foi pour la V2.**
> **S'ajoute à** : `00-cadrage-v1.md`, qui reste valable pour tout ce que ce document ne modifie pas. Le §2 liste les règles V1 remplacées.
> **Remplace** : la section « V2 » de `00-cadrage-v1.md` §2, et les §4.2 à §4.5 de `01-analyse.md` (déplacement, base du recalcul, push vertical, compaction).

---

## 1. Périmètre

### V2

| | |
|---|---|
| Geste | Déplacer un widget en l'attrapant par sa **barre de titre** (Pointer Events) |
| Bascule de case | Dès que le coin du widget a dépassé **la moitié d'une case** |
| Aperçu | Les voisins sont poussés **pendant** le geste, après un court délai sur la case visée |
| Collision | Le widget gêné part **à droite** s'il tient dans les 12 colonnes, sinon **en bas** |
| Trous | **Compaction automatique** : tout remonte après chaque action |
| Annulation du geste | `Échap` |
| Défilement | La page défile toute seule quand le pointeur approche du bord de l'écran |
| Écriture | Dans le brouillon, **au drop** seulement |

### Hors périmètre V2

- **Resize** (reporté).
- **Drag au clavier.** C'est une dette d'accessibilité assumée.
- **Drag depuis la palette.** L'ajout reste un clic (§6).
- **Bouton « Ranger ».** Inutile avec la compaction automatique. À revoir si les trous volontaires reviennent.
- **Édition en mode téléphone.** Elle reste indisponible sous le seuil (V1 §4.4).

---

## 2. Ce que la V2 change dans la V1

| Règle V1 | Devient en V2 |
|---|---|
| §4.3 « Aucune mesure JS de l'écran » | Toujours vrai **hors geste**. Pendant un geste, la grille est mesurée à chaque mouvement (§3.2). |
| §5.3 Ajout à la première place libre | Ajout en bas, puis compaction (§6). |
| §5.4 « Le trou reste : pas de compaction » | Compaction après chaque action (§5). |
| §9 critère 5 « Une suppression laisse un trou » | Remplacé par le critère V2 n°6 (§9). |

---

## 3. Le geste

### 3.1 Prise

- La **barre de titre** de la carte sert de poignée. Le corps du widget reste libre pour ses propres interactions, et le `✕` garde son clic.
- La poignée n'est active qu'en mode édition.
- `setPointerCapture` au `pointerdown` : le geste continue même si le pointeur sort de la poignée ou de la grille.
- `touch-action: none` sur la poignée, pour que le tactile (tablette au-dessus du seuil) ne fasse pas défiler la page à la place.

### 3.2 Pixels → case

À **chaque** `pointermove`, on relit `getBoundingClientRect()` de `.widget-grid` :

```
pas horizontal = (largeur de la grille + gap) / 12
pas vertical   = hauteur de rangée + gap
coin du widget = pointeur − décalage pris au pointerdown (où on a attrapé la carte)
case visée     = arrondi((coin du widget − début de la grille) / pas)
bornes         : 0 ≤ x ≤ 12 − w,  y ≥ 0
```

- **L'arrondi, c'est la règle de la moitié** : on bascule sur la case voisine dès que le coin a fait plus de la moitié du chemin.
- **Pourquoi relire à chaque mouvement** : la position de la grille change quand la page défile, ce qui arrive pendant un geste (§3.5). `getBoundingClientRect` tient compte du scroll et coûte quelques microsecondes.
- **Pourquoi pas `ResizeObserver`** : il ne signale que les changements de **taille**, pas de position. Il ne verrait pas le scroll, qui est le cas courant.
- Le gap et la hauteur de rangée se lisent dans les styles calculés de la grille, et non en dupliquant les formules CSS en JS.

### 3.3 Aperçu et délai

```
la case visée change
   ├─ tout de suite : calcul de la disposition provisoire (§4), pointillés à l'atterrissage du widget
   └─ minuteur DRAG_DWELL_MS relancé
        ├─ la case change encore avant la fin → minuteur annulé et relancé
        └─ fin du minuteur → les voisins prennent leur place provisoire
au drop → disposition de la case finale appliquée tout de suite, sans attendre
```

- **Le calcul est immédiat**, parce qu'il ne coûte presque rien. **Le mouvement des voisins est différé**, pour éviter que la grille s'agite quand on survole vite. Le délai est un choix d'expérience utilisateur, pas une optimisation.
- Les **pointillés** montrent où le widget **atterrira réellement**, après la compaction. Cette case peut être plus haute que celle sous le pointeur.
- Le widget attrapé suit le pointeur au pixel près, via `transform`, avec un état local au geste et sans render du Dashboard.

### 3.4 Fin du geste

| Événement | Effet |
|---|---|
| `pointerup` | La disposition provisoire de la case finale est écrite dans le **brouillon**. |
| `Échap` | Retour à la photo du `pointerdown`. Rien n'est écrit. |
| Pointeur hors de la grille | La case est bornée au bord. Pas d'annulation. |
| `pointercancel` (système) | Comme `Échap`. |

Le brouillon change **une fois par geste**. `isDirty`, Annuler, Enregistrer et `useBlocker` fonctionnent sans modification.

### 3.5 Défilement automatique

Quand le pointeur entre dans une bande proche du bord haut ou bas de la zone qui défile, celle-ci défile à chaque frame (`requestAnimationFrame`) tant que le pointeur y reste. Le défilement déclenche un nouveau calcul de la case visée, même si le pointeur ne bouge pas.

**À identifier pendant le développement** : l'élément qui défile (la fenêtre ou `MainContent`).

---

## 4. Résolution de la disposition

Une fonction pure, dans `engine/` :

```ts
resolveLayout(snapshot: readonly WidgetInstance[], movedId: string, target: GridPosition): WidgetInstance[]
```

### 4.1 Base : la photo

Chaque calcul part de la **disposition figée au `pointerdown`**, jamais du provisoire précédent. Si on ramène le pointeur en arrière, les widgets poussés reviennent : le geste est réversible et sans mémoire.

### 4.2 Algorithme (modèle Grafana, décision du 2026-10-30)

```
1. RETIRER   M (le widget déplacé) de la photo.
2. COMPACTER le reste (§5) : la place que M occupait est refermée.
3. INSÉRER   M à la case visée. posés = [M].             ← M est ÉPINGLÉ pendant l'étape 4
4. REPOUSSER chaque autre widget W, dans l'ordre de lecture du résultat de l'étape 2 :
     hauteur = W.y
     boucle :
        a. W à sa colonne, à cette hauteur : libre ? → posé
        b. sinon, à DROITE en cascade : x = bord droit du widget posé qu'il chevauche,
           recommencer tant que x + w ≤ 12. Une place libre ? → posé
        c. sinon : hauteur = bas du widget posé qu'il chevauche, et on recommence en a.
5. COMPACTER toute la disposition (§5), M compris.
```

**Pourquoi l'étape 2.** Sans elle, la place d'origine de M reste vide jusqu'à l'étape 5, et M y remonte : **un widget ne pourrait jamais descendre**. react-grid-layout (la grille de Grafana) règle ce problème autrement : le widget gêné monte au-dessus du widget déplacé s'il y tient. Mais cette règle ne marche que si l'on recalcule à partir du provisoire précédent, case par case. Avec notre photo (§4.1), qui permet de sauter plusieurs cases d'un coup, compacter avant d'insérer donne le même comportement.

**Exemples de référence** (des widgets de pleine largeur, hauteur 1, empilés) :

| Photo | Geste | Résultat |
|---|---|---|
| A, B, C | A vers y1 | B, A, C |
| A, B, C | A vers y2 | B, C, A |
| A, B, C | C vers y0 | C, A, B |
| A, B, C | A vers y0 (sur place) | A, B, C |
| A, B | A vers y5 (dans le vide) | B, A (A remonte sous B) |

**Limite connue (comme Grafana).** La compaction est uniquement verticale. Si M part vers la droite et que rien ne peut tomber dans la place qu'il a libérée à gauche, ce trou reste. Exemple : A et B côte à côte sur une rangée, avec une pleine largeur en dessous. On pose A sur B : B part en bas, et la place de A reste vide. L'échange de deux widgets de même taille (comme dans gridstack) réglerait ce cas, mais il est hors V2.

**Propriétés attendues** (elles deviennent des tests) :
- **Aucun chevauchement** en sortie, et tout tient dans les 12 colonnes.
- **Aucun trou vertical** : chaque widget est soit en `y = 0`, soit posé sur un autre.
- **Terminaison** : à chaque hauteur, le nombre d'essais à droite est fini, et la hauteur ne fait qu'augmenter.
- **Déterministe** : même photo et même case donnent la même disposition.
- **M ne bouge pas à l'étape 4.** Un widget poussé ne peut pas pousser M en retour. M peut en revanche remonter à l'étape 5.
- **Pureté** : la photo n'est pas modifiée.

---

## 5. Compaction

- **Définition** : chaque widget, dans l'ordre de lecture, remonte tant qu'il ne chevauche aucun widget déjà traité et que `y > 0`. La compaction est uniquement verticale.
- **Quand** : après **chaque action** dans le brouillon (drop, ajout, suppression), et deux fois dans l'aperçu du geste (§4.2, étapes 2 et 5).
- **Pas au chargement.** Une disposition enregistrée avec des trous (venue de la V1) s'affiche telle quelle. Elle est compactée à la première action en mode édition. C'est la même logique que la réparation du V1 §6.3 : seule une action de l'utilisateur modifie les données.
- **Conséquence** : on ne peut plus poser un widget « dans le vide ». Il remonte jusqu'à toucher un autre widget ou le haut de la grille. Les pointillés le montrent avant le drop.

---

## 6. Ajout et suppression

- **Ajout** : le clic dans la palette pose le widget en `x: 0`, `y: bottomY`, puis la compaction le remonte. On le déplace ensuite à la main. La palette reste ouverte pour enchaîner, comme en V1.
- **Suppression** : le `✕` retire l'instance, puis la compaction referme le trou.

---

## 7. Animation et style (dernière étape de la V2)

- **Le widget attrapé** : élevé (ombre portée), au-dessus des autres, et il suit le pointeur.
- **Les pointillés** : un rectangle à l'emplacement d'atterrissage.
- **Les voisins qui se déplacent** : animés.

**Contrainte technique** : la position d'une cellule vient de `grid-column` et `grid-row`, et **CSS ne sait pas animer un changement de placement dans une grille**. Pour animer un voisin, il faut la technique **FLIP** :
1. mesurer la position avant le changement ;
2. appliquer le changement ;
3. mesurer la nouvelle position ;
4. appliquer un `transform` qui ramène visuellement l'élément à l'ancienne position ;
5. retirer ce `transform` avec une transition.

C'est une étape à part entière, qui vient **après** une V2 fonctionnelle sans animation.

---

## 8. Où vit chaque morceau

```
engine/    (pur, testé)  pointToCell · resolveLayout · compactLayout
hooks/     useGridDrag   pointer capture, mesure, photo, case visée, délai, Échap, défilement
WidgetGrid               affiche la disposition provisoire pendant le geste, les pointillés, le widget attrapé
WidgetCard               expose la barre de titre comme poignée
Dashboard                reçoit la disposition au drop → setDraftWidgets ; compaction après ajout et suppression
```

Aucune librairie (V1 §10 : moteur maison). Aucun store global.

---

## 9. Critères d'acceptation V2

1. `npm run build` passe.
2. En mode édition, on attrape un widget par sa barre de titre et il suit le pointeur. En mode lecture, la barre de titre n'est pas une poignée.
3. On bascule sur une case voisine dès que le coin du widget a dépassé la moitié d'une case.
4. Les pointillés montrent la case d'atterrissage réelle. Les voisins se déplacent après `DRAG_DWELL_MS` sur la même case, et pas avant.
5. Un widget gêné part à droite s'il tient dans les 12 colonnes, sinon en bas. Aucun chevauchement n'est possible.
6. Après un drop, un ajout ou une suppression, il ne reste aucun trou vertical.
6 bis. Dans une colonne pleine, on peut descendre un widget d'une ou de plusieurs cases (exemples du §4.2).
7. Ramener le pointeur à sa case de départ remet tous les voisins à leur place.
8. `Échap` pendant le geste restaure la disposition d'avant le geste.
9. Le drop modifie le brouillon : Annuler le défait, Enregistrer le fait survivre à un rechargement.
10. Le geste fonctionne quand la page défile, y compris par le défilement automatique près du bord.
11. Une disposition V1 avec des trous s'affiche telle quelle au chargement, et n'est compactée qu'à la première action.

---

## 10. Valeurs à fixer

- `DRAG_DWELL_MS` : **300 ms** au départ, à régler au ressenti.
- Défilement automatique : largeur de la bande sensible et vitesse.
- Durée et courbe des animations (§7).

---

## 11. Options écartées — pour ne pas y revenir

| Option | Pourquoi écartée |
|---|---|
| `ResizeObserver` pour mesurer la grille | Il ne voit pas la position, donc pas le scroll. |
| Mesurer une seule fois au `pointerdown` | Fausse dès que la page défile pendant le geste. |
| Recalculer depuis le provisoire précédent | Les poussées s'accumulent, et le geste n'est plus réversible. |
| Bascule à « la moitié du widget » | Lourd pour les grands widgets, qui doivent parcourir plusieurs cases avant de basculer. |
| Délai de 1 s | La grille paraît ne pas répondre. |
| Échanger les deux widgets (swap) | Incohérent dès que les tailles diffèrent. |
| Refuser le drop en cas de collision | Oblige à libérer la place à la main. |
| Pousser seulement vers le bas | Décision du 2026-10-30 : essayer à droite d'abord. |
| Pousser à gauche ou à droite selon le côté le plus proche | Écarté au profit d'une règle unique (droite, puis bas). |
| Garder les trous (flottant, comme `float: true` de gridstack) | Décision du 2026-10-30 : compaction automatique, modèle Grafana. |
| Garder seulement le trou d'origine du widget déplacé | Incohérent avec la compaction après chaque action : le trou serait comblé à l'action suivante. |
| Règle de react-grid-layout « le gêné monte au-dessus du déplacé » | Suppose un recalcul case par case depuis le provisoire précédent. Remplacée par « compacter avant d'insérer », qui fonctionne avec la photo. |
| Échange des widgets de même taille (gridstack) | Hors V2 (voir la limite connue du §4.2). |
| Liste ordonnée sans positions (iOS, Muuri) | Incompatible avec les positions explicites (V1 §3.3). |
| Mode placement depuis la palette | Un second type de geste à coder, pour un gain faible. |
| Resize en V2 | Reporté. |
