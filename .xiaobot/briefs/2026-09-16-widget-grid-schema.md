# Brief Claude Design — Schéma du modèle de placement des widgets

> À passer tel quel à `/design`. Sortie attendue : un canvas d'artboards, pas du code applicatif.

## Objectif

Produire un **schéma de référence** du modèle de placement de la grille de widgets XiaoTrack (décision du 2026-09-16, cf. `.xiaobot/decisions.md`).

**Usage** : aide-mémoire personnel du développeur, consulté avant d'implémenter et relu dans plusieurs mois. Il doit répondre en un coup d'œil à « comment mes widgets sont-ils positionnés, et où vit la donnée ? ».

**Audience** : une seule personne, développeur, qui connaît React et CSS Grid. Pas de vulgarisation, pas de définition de ce qu'est une grille. Aller au modèle.

**Ton** : schématique et technique. Un diagramme d'architecture, pas une infographie marketing. Pas d'icônes décoratives, pas de dégradés, pas de métaphores visuelles.

## Structure attendue

Trois artboards sur un canvas. Le premier est le principal et doit se suffire à lui-même.

---

### Artboard 1 — « Modèle de placement » (principal)

Deux zones côte à côte : le schéma à gauche (~60%), le panneau de règles à droite (~40%).

**Zone gauche — la grille, dessinée.**

Une grille de 5 colonnes × 3 lignes, avec les **indices affichés** : `0 1 2 3 4` en en-tête de colonnes, `0 1 2` en marge de lignes (bien montrer que c'est 0-indexé).

Quatre widgets posés dessus, chacun dessiné comme un rectangle plein couvrant ses cases, étiqueté avec son id et ses dimensions :

| widget | position | taille | cases couvertes |
|---|---|---|---|
| `id 1` | x=0, y=0 | 1×1 | (0,0) |
| `id 2` | x=1, y=0 | 2×1 | (1,0) (2,0) |
| `id 3` | x=3, y=0 | 2×2 | (3,0) (4,0) (3,1) (4,1) |
| `id 4` | x=0, y=1 | 3×2 | (0,1) (1,1) (2,1) (0,2) (1,2) (2,2) |

Les deux cases restantes — (3,2) et (4,2) — sont **vides** : les dessiner en pointillés ou en trame légère, étiquetées « libre ». Elles comptent : elles montrent que les trous sont autorisés et que la grille n'est pas un flux.

Sous la grille, deux blocs de code en vis-à-vis, avec une flèche ou un libellé qui indique clairement le sens de dérivation (**gauche = stocké → droite = calculé**) :

```
SOURCE DE VÉRITÉ (persistée)        DÉRIVÉ (useMemo, jamais en state)

[                                    [1, 2, 2, 3, 3]
  { id: 1, x: 0, y: 0, w: 1, h: 1 }, [4, 4, 4, 3, 3]
  { id: 2, x: 1, y: 0, w: 2, h: 1 }, [4, 4, 4, ·, ·]
  { id: 3, x: 3, y: 0, w: 2, h: 2 },
  { id: 4, x: 0, y: 1, w: 3, h: 2 }, matrice d'occupation
]
```

C'est le message central de tout le schéma : **on stocke des rectangles, on calcule la matrice**. Que ça saute aux yeux.

**Zone droite — panneau « Spécifications & règles ».**

Une liste compacte, groupée en quatre blocs titrés. Texte court, pas de phrases longues.

*Géométrie*
- `cols = 5`, constante en V1
- `grid-template-columns: repeat(5, 1fr)` — pleine largeur
- Lignes illimitées, hauteur fixe, `rows = max(y + h)`
- Rendu : `grid-column: x+1 / span w` · `grid-row: y+1 / span h`

*Donnée*
- Source de vérité : `WidgetPlacement { id, x, y, w, h }`
- Coordonnées 0-indexées, en unités de grille
- Matrice d'occupation = **dérivée**, `useMemo` — jamais de `setOccupancy`

*Invariantes*
- Rectangles uniquement — formes en L et widgets disjoints inexprimables
- Pas de chevauchement
- `w <= cols`, validé à la création **et** clampé à l'affichage
- Trous autorisés : la grille n'est pas un flux

*Règles*
- Le widget **ne connaît pas sa taille** — il remplit ce qu'on lui donne
- Le reflow est une **projection**, jamais une mutation
- Seule une action utilisateur explicite écrit dans les placements
- Un redimensionnement de fenêtre ne modifie **jamais** la donnée

---

### Artboard 2 — « Flux de données »

Un diagramme de dérivation. Une seule boîte en entrée, trois sorties, et surtout : **aucune flèche ne remonte**.

```
        placements: WidgetPlacement[]
        (source de vérité — persistée)
                     │
      ┌──────────────┼──────────────┐
      │              │              │
   useMemo         AABB         projection
      │              │              │
   matrice       collision      placements
 d'occupation                    affichés
      │              │              │
 « où y a-t-il   « est-ce que   → rendu CSS Grid
  de la place ? »  ça rentre ? »
```

Annoter les deux outils de requête avec leur coût, c'est l'information qui justifie d'en avoir deux :

- **AABB** — `O(n)`, sans matérialiser une cellule. Test d'un rectangle précis.
  `a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y`
  *(comparaisons strictes : avec `>=`, deux widgets qui se touchent seraient en collision)*
- **Matrice** — `O(cols × rows)`, vue d'ensemble. Recherche d'un emplacement libre, aperçu de dépose.

Mettre en évidence, visuellement, que **rien ne réécrit la source de vérité** dans ce diagramme. C'est le point que le schéma doit graver.

---

### Artboard 3 — « Responsive »

Deux états côte à côte, en petit.

**Desktop** — la grille 5 colonnes de l'artboard 1, en miniature. Légende : *les coordonnées `x`/`y`/`w`/`h` sont utilisées*.

**Écran étroit** — les mêmes 4 widgets empilés en **une seule colonne**, dans l'ordre de lecture (1, 2, 3, 4). Légende : *les coordonnées sont ignorées, empilement dans l'ordre. Aucune synchronisation JS↔CSS requise, puisque aucune coordonnée n'est utilisée.*

Une note en bas : *la donnée est identique dans les deux états — seule la projection change.*

---

## Contraintes de rendu

- **Français.**
- Le schéma prime sur le texte. Si un arbitrage est nécessaire, réduire le panneau de règles, pas la grille.
- Monospace pour tout ce qui est code, identifiant ou coordonnée.
- Palette sobre, 3 couleurs maximum + neutres. Les 4 widgets peuvent être différenciés par des teintes d'une même couleur — ils ne représentent pas des catégories, juste des entités distinctes.
- Les cases vides doivent être visuellement **inertes** (pointillés, trame légère), pas colorées comme un cinquième widget.
- Lisible en un coup d'œil sur un écran de laptop : pas de texte sous ~11px, pas de bloc de code qui déborde.

## À ne pas inclure

- Le drag & drop, le resize, la préférence utilisateur de colonnes — **reportés en V2**, hors périmètre.
- L'architecture en 5 couches (ADR du 2026-06-15) — c'est un autre schéma.
- Les options rejetées (`auto-fill`, grille 12 colonnes, matrice comme stockage) — elles sont tracées dans l'ADR, elles n'ont pas leur place ici. Ce schéma documente **ce qui est**, pas le raisonnement qui y a mené.
- Tout code React réel. Des pseudo-structures de données, pas des composants.
