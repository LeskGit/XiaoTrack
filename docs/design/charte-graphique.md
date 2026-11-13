# Charte graphique XiaoTrack — v1

> Décidée le 2026-11-13. Référence visuelle : [`apps/web/planche-charte-v1.html`](../../apps/web/planche-charte-v1.html), à ouvrir dans un navigateur, ou sur `http://localhost:5173/planche-charte-v1.html` quand `npm run dev:web` tourne. Les variables CSS de la planche sont les tokens cibles de `apps/web/src/assets/css/index.css`.
>
> **État :** appliquée au code le 2026-11-13 (tokens dans `index.css`).

## 1. Décisions

| # | Sujet | Choix |
|---|---|---|
| 1 | Personnalité | **C, hybride** : structure sobre (fond uni, bordures nettes), une seule signature : **les halos** (deux lavis bleu et violet en haut du fond). Header et sidebar pleins, plus de verre dépoli. |
| 2 | Accent et données | **B** : indigo pour l'interface, turquoise en tête des couleurs de données. |
| 3 | Dégradé de marque | **B** : logo + une seule action principale par écran. Ailleurs, accent plat. |
| 4 | Couleurs de statut | **A** : couleurs Tailwind standard, rangées en tokens (plein, doux, texte). |
| 5 | Couleur par domaine | **B** : une teinte par onglet, uniquement sur les tuiles d'icône. |
| 6 | Mode sombre | **B** : pas maintenant, mais préparé (zéro couleur en dur). |
| 7 | Typographie | **B** : échelle maison à 6 niveaux, en Inter. |
| 8 | Formes | **A** : 3 arrondis (pilule réservée aux flottants), toutes les ombres teintées indigo. |
| 9 | Mouvement | **A** : expressif (cascade, compteurs, tracés, rebonds, pulsation). |

## 2. Couleurs

Quatre familles, quatre rôles. Une couleur n'est jamais utilisée hors de son rôle.

### 2.1 Surfaces, lignes, texte

| Token | Valeur | Rôle |
|---|---|---|
| `canvas` | `oklch(0.982 0.004 285)` | Fond de page (sous les halos) |
| `surface` | `#ffffff` | Cartes, header, sidebar, barres |
| `line` | `oklch(0.93 0.008 280)` | Bordures par défaut |
| `line-strong` | `oklch(0.87 0.014 280)` | Bordures au survol, en édition |
| `ink` | `oklch(0.21 0.02 280)` | Texte principal |
| `ink-soft` | `oklch(0.45 0.02 280)` | Texte secondaire |
| `ink-muted` | `oklch(0.55 0.015 280)` | Légendes, métadonnées |

Les tokens `ink-*` remplacent `gray-900/600/400` dans les composants.

### 2.2 Accent d'interface : indigo

Tout ce qui se clique ou se sélectionne : boutons, liens, focus, navigation active, guides et pointillés du drag.

| Token | Valeur | Rôle |
|---|---|---|
| `accent` | `oklch(0.585 0.233 277)` (indigo-500) | Remplissage, icônes actives |
| `accent-strong` | `oklch(0.457 0.24 277)` (indigo-700) | Texte accent sur fond clair |
| `accent-line` | `oklch(0.785 0.115 275)` (indigo-300) | Bordures, guides |
| `accent-soft` | `oklch(0.962 0.018 272)` (indigo-50) | Fonds, survols |

### 2.3 Données

Réservées aux graphiques et aux progressions. **L'ordre compte** : une série seule est toujours `data-1`.

| Token | Valeur | Teinte |
|---|---|---|
| `data-1` | `oklch(0.72 0.13 190)` | Turquoise |
| `data-2` | `oklch(0.62 0.19 277)` | Indigo |
| `data-3` | `oklch(0.79 0.15 75)` | Ambre |
| `data-4` | `oklch(0.68 0.19 10)` | Rose |
| `data-5` | `oklch(0.7 0.03 260)` | Ardoise |

Le turquoise (teinte 190) reste à distance du vert succès (163).

### 2.4 Statuts

Chaque statut existe en trois variantes : plein (`success`), doux (`success-soft`, fond) et texte (`success-strong`).

| Statut | Base Tailwind | Usage |
|---|---|---|
| `success` | emerald | Enregistré, terminé |
| `warning` | amber | Modifications non enregistrées, en attente |
| `danger` | red | Erreur, suppression |
| `info` | blue | Nouveauté, information neutre |

**Règle :** une couleur de statut n'apparaît jamais seule. Elle est toujours accompagnée d'une icône ou d'un texte.

### 2.5 Domaines

| Domaine | Token | Teinte |
|---|---|---|
| Dashboard | `accent` | Indigo |
| Nutrition | `domain-nutrition` | Orange (50) |
| Workouts | `domain-workouts` | Rose (12) |
| Planning | `domain-planning` | Ciel (232) |
| Habits | `domain-habits` | Violet (300) |
| Notes | `domain-notes` | Jaune (88) |

**Règles :**
- Une couleur de domaine n'apparaît **que sur une tuile d'icône** : fond doux (13 % de la teinte) et icône teintée au repos ; tuile pleine et icône blanche quand l'onglet est actif. Jamais sur un bouton, un texte ou un graphique.
- Les widgets héritent de la couleur de leur domaine sur leur tuile d'icône, par la propriété de présentation `tone` de leur entrée de catalogue (`tone: domainToneMap.nutrition`). Le système de widgets ne l'interprète pas : c'est une couleur CSS, l'accent si elle est absente. Les entrées sans domaine (`body.*`, `learning.*`, `chartExemple`) restent en accent.
- Tension assumée : Notes est proche de `warning`, Planning de `info`, Workouts de `danger`. La règle précédente et celle du §2.4 évitent la confusion.

## 3. Dégradé de marque

`--brand-gradient` : bleu-500 → indigo-500 → purple-600, à 135°.

**Autorisé :** le logo (tuile et nom), et **une seule** action principale par écran (`.btn-primary`).

**Interdit partout ailleurs :** navigation active, pastilles, anneaux d'avatar, boutons « + » de la palette, badges.

## 4. Boutons

| Classe | Rendu | Usage |
|---|---|---|
| `.btn-primary` | Dégradé + ombre de marque | L'action principale de l'écran, une seule fois |
| `.btn-accent` | Indigo plat | Action importante secondaire |
| `.btn-soft` | Fond `accent-soft`, texte `accent-strong` | Actions répétées (ajout dans une liste) |
| `.btn-secondary` | Blanc bordé | Action neutre |
| `.btn-ghost` | Transparent | Actions de barre d'outils, Cancel |
| `.btn-danger` | Rouge plein | Uniquement une suppression confirmée |

Tous les boutons de l'app passent par ces classes, sans chaînes de classes locales.

## 5. Typographie

Police : **Inter**, hébergée localement (`@fontsource/inter`, à installer à la place de Google Fonts).

| Token | Taille | Graisse | Usage |
|---|---|---|---|
| `display` | 28 px | 650 | Valeurs principales des widgets |
| `heading` | 20 px | 600 | Titres de page et d'état vide |
| `title` | 16 px | 600 | Titres de panneau et de modale |
| `body` | 14 px | 400 | Texte courant |
| `label` | 13 px | 500 | Titres de widget, libellés, boutons compacts |
| `caption` | 12 px | 500 | Légendes, dates, tendances |

Aucune autre taille. Les chiffres utilisent `font-variant-numeric: tabular-nums`. Exception : la valeur d'un widget (stat, dernière valeur d'un chart) suit la taille de sa cellule (unités `cqi`/`cqh`), entre `heading` (20 px) et 48 px.

## 6. Formes

| Token | Valeur | Usage |
|---|---|---|
| `radius-sm` | 6 px | Badges, cases à cocher, petites tuiles |
| `radius-md` | 10 px | Boutons, champs, tuiles d'icône |
| `radius-lg` | 14 px | Cartes, modales, panneaux |
| pilule | `9999px` | **Uniquement** les éléments flottants (barre d'édition) et les badges |

Ombres : une seule teinte, `--shadow-tint: 49 46 129` (indigo-900).

| Token | Usage |
|---|---|
| `shadow-card` | Carte au repos |
| `shadow-card-hover` | Survol, navigation active |
| `shadow-float` | Barre flottante, widget tenu, modales |
| `shadow-brand` | Sous le dégradé uniquement |

## 7. Mouvement

| Token | Valeur | Usage |
|---|---|---|
| `ease-out-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | La plupart des mouvements |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Ce qui « atterrit » (drop, barre d'édition, badge) |
| `motion-fast` | 150 ms | Survols, pressions |
| `motion-base` | 250 ms | Changements d'état |
| `motion-slow` | 400 ms | Entrées, sorties |

Style expressif conservé : cascade d'entrée, compteurs, tracés de courbes, rebonds, pulsation des états en attente.

**Non négociable :** `prefers-reduced-motion` coupe tout. En CSS via la règle globale d'`index.css`, en JS via `prefersReducedMotion()`.

## 8. Règles pour le futur mode sombre

1. Aucune couleur en dur dans un composant : ni `rgb()`, ni `oklch()`, ni couleur de palette Tailwind (`bg-sky-50`, `text-gray-500`). Uniquement des tokens.
2. Les ombres passent par `--shadow-tint`.
3. Le texte passe par `ink`, `ink-soft`, `ink-muted`.
4. Toute nouvelle couleur entre d'abord dans `@theme`, avec un nom de rôle, jamais un nom de teinte.

## 9. Points ouverts

- **Texte UI en français.** La date du header est en `fr-FR` (dette §10 des conventions), hors charte.
