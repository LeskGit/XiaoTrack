# Système de widgets — Cadrage V1

> **Statut** : cadrage validé les 2026-09-24 et 2026-09-25. **Ce document fait foi.**
> **Remplace** : `01-analyse.md` (CDC du 2026-09-05), l'ADR « géométrie » du 2026-09-16 (supprimé avec `.xiaobot/`, consultable via `git show 6c2fe62:.xiaobot/decisions.md`) et le chapitre `vol-cookbook/05-widget-framework.md`, pour tout ce qui les contredit. Les fiches `prerequis/` restent valables comme supports d'apprentissage.

---

## 1. Objet

Une grille de widgets **neutre** : aucune connaissance d'un domaine métier (nutrition, workouts…). Le système fournit l'affichage et la mécanique complète. Les vraies données se brancheront plus tard, sur une source non encore décidée.

**Définition de « prêt à brancher »** : brancher une vraie donnée, c'est écrire une fonction source et modifier une ligne du catalogue. Ni la grille, ni la carte, ni le dashboard ne changent. Si ça demande plus, la frontière est mal placée.

---

## 2. Périmètre

### V1

| | |
|---|---|
| Actions | Ajouter, supprimer |
| Placement | Automatique (première place libre) |
| Mode édition | Explicite : brouillon, Annuler / Enregistrer |
| Grille | 12 colonnes, cases proportionnelles, trous conservés |
| Responsive | Échelle pure au-dessus du seuil, une colonne en dessous |
| Persistance | `localStorage` derrière une interface `load()` / `save()` |
| Archétypes | `stat` ; `chart` déclaré mais pas encore rendu |
| États d'un widget | `loading`, `success`, `error`, **fournis en dur** pour l'instant (cf. §7.3) |
| Moteur de disposition | Maison, aucune librairie |

### V2 (prévue, préparée par le modèle)

- **Drag** : conversion pixels → cases en mesurant la grille au `pointerdown`.
- **Resize**, borné par le `minSize` de l'archétype.

### Hors périmètre

- Domaines métier réels, vrais endpoints, API NestJS.
- Configuration d'un widget (métrique, période, titre).
- Plusieurs dashboards.
- Librairies de graphiques.
- Temps réel, rafraîchissement automatique.
- Mode intermédiaire « tablette » (écarté, cf. §10).

---

## 3. Modèle — trois niveaux et un état

| Niveau | Identifiant | Exemple | Répond à | Où ça vit |
|---|---|---|---|---|
| **Archétype** | `archetype` | `"stat"` | *Comment* ça s'affiche | Code |
| **Entrée de catalogue** | `type` | `"demo.bigNumber"` | *Quel* indicateur | Code |
| **Instance** | `id` | `"3f2a…"` (UUID) | *Ce* widget, posé *ici* | `localStorage` (plus tard : API) |
| **État runtime** | — | `{ status: "loading" }` | *Où en est* sa donnée | Mémoire, par composant monté |

### 3.1 Archétype — la table de dispatch

Une entrée par forme de rendu. Elle regroupe le composant de rendu **et** ses contraintes géométriques :

```
stat  → { Body, defaultSize, minSize }
chart → { Body, defaultSize, minSize }
```

- `defaultSize` est **obligatoire** : c'est le vrai défaut (un chart a besoin de plus de place qu'un stat).
- `minSize` relève le plancher global de **2×1** si l'archétype l'exige. Il sert à la validation au chargement (§6.3) et au resize V2.
- Chaque archétype définit aussi son **contrat de données** (§7.1).

### 3.2 Catalogue

Une entrée par indicateur. C'est de la donnée, pas un composant :

```
{ title, icon, archetype, defaultSize? }
```

- `defaultSize` est **optionnel** : il surcharge celui de l'archétype.
- `WidgetType = keyof typeof widgetCatalog`, dérivé via `as const satisfies`, jamais maintenu à la main.
- Pas de `domain` ni d'`endpoint`. La source de données viendra au branchement (§7.2).
- Clés neutres en V1 (`demo.*`).
- Le catalogue n'est **jamais persisté** (il contient des composants d'icônes).

### 3.3 Instance — ce qui est persisté

```
{ id: string, type: WidgetType, size: { width, height }, position: { x, y } }
```

- `id` : UUID généré par `crypto.randomUUID()`. Le même `type` peut être posé plusieurs fois.
- `size` est **obligatoire** : elle appartient à l'emplacement, pas au type (c'est ce qui prépare le resize).
- `position` est **toujours explicite**, même quand c'est la machine qui la choisit. Revenir à une liste ordonnée imposerait une migration au drag V2.
- Coordonnées en **cases**, 0-indexées.

### 3.4 Règle des défauts de taille

À l'ajout : `taille = entrée.defaultSize ?? archétype.defaultSize`, **copiée dans l'instance**.

Le défaut ne joue qu'à la création, jamais à l'affichage. Sinon, modifier un défaut dans le code ferait grossir d'un coup des widgets déjà posés, qui se chevaucheraient dans les données enregistrées.

---

## 4. La grille

### 4.1 Géométrie

- **12 colonnes**, toujours (au-dessus du seuil). Seule leur **largeur** varie.
- **Taille minimale d'un widget : 2×1.**
- Une rangée a la hauteur d'une colonne × **1.3** (cases légèrement plus hautes que larges).
- Rangées non bornées vers le bas : la grille grandit toute seule avec `max(y + h)`.
- **Les trous sont autorisés** : la grille n'est pas un flux.
- Rectangles uniquement. Pas de chevauchement, et `x + w ≤ 12`.

### 4.2 Responsabilités

- La **grille** possède le placement.
- `<Widget>` et `WidgetCard` ne lisent jamais `size` ni `position` : ils remplissent leur case (`h-full`).

### 4.3 Mécanique CSS (`components/widgets/widget-grid.css`, `@layer components`)

```
div.p-4                      ← padding, à l'extérieur du cadre
 └ div.widget-grid-frame     ← container: grid / inline-size — SANS padding
    └ div.widget-grid        ← colonnes, rangées, gouttière
       └ div.widget-cell     ← une par widget : --col --row --w --h en inline
          └ <Widget />
```

- Variables posées en inline : `--col = x + 1`, `--row = y + 1`, `--w`, `--h`. Les lignes CSS Grid commencent à 1.
- Elles ne sont lues **que dans la container query**, ce qui permet au mode téléphone de les ignorer. C'est pour ça qu'on n'utilise pas de style `gridColumn` en inline : l'inline battrait toute règle responsive.
- Dimensions en `cqi` (1 % de la largeur du cadre) : `--gap: 0.6cqi`, rangée = `calc((100cqi - 11 * var(--gap)) / 12 * 1.3)`.
- **Aucune classe Tailwind de grille sur ces éléments** : la couche `utilities` passe devant `components` et écraserait la container query.
- **Aucune mesure JS de l'écran**, pas de `ResizeObserver`.

### 4.4 Responsive — deux régimes

| Largeur du cadre | Rendu |
|---|---|
| **≥ seuil** | 12 colonnes. Tout grandit et rétrécit proportionnellement, « comme une image ». Positions et trous identiques. |
| **< seuil** | Mode téléphone : 1 colonne, positions ignorées, empilement dans l'ordre de lecture. Hauteur = `h` rangées de 110px. |

- **Ordre de lecture** : la grille rend une **copie triée** des placements, par `y` puis `x`. L'ordre du DOM n'a aucune importance en mode 12 colonnes, mais il décide de l'empilement en mode téléphone.
- **Seuil actuel : 866px de cadre.** Avec cette valeur, un 2×1 fait au moins 140px de large. Formule : case ≈ 0.0778 × L, donc 2×1 ≈ 0.1617 × L. Le seuil s'écrit en dur (une condition `@container` ne lit pas de variable) : garder la formule en commentaire. Piste envisagée : un minimum à 160px, soit un seuil ≈ 990px.
- **Édition indisponible en mode téléphone** (repris du CDC du 05/09) : le bouton « Éditer » n'y est pas rendu.

---

## 5. Comportement

### 5.1 Mode lecture (défaut)

Aucun `✕`, aucune palette. Le bouton « Éditer » vit **dans la page Dashboard**, pas dans `MainHeader`, qui est partagé par toutes les pages.

### 5.2 Mode édition

- Travaille sur un **brouillon**. *Annuler* restaure exactement la disposition enregistrée ; *Enregistrer* l'écrit via `save()`.
- Un simple état **modifié / non modifié** active *Enregistrer*. Pas de compteur.
- Quitter la page avec des modifications → **demande de confirmation** (`useBlocker` de React Router).

### 5.3 Ajouter

- Palette en **panneau latéral** : entrées du catalogue regroupées par archétype, sans recherche.
- Un clic pose le widget, et la palette reste ouverte pour enchaîner.
- Taille selon §3.4.
- Placement à la **première place libre**, en balayant de haut en bas puis de gauche à droite (ce qui remplit les trous). À défaut, sous la dernière rangée. L'ajout n'échoue jamais.

### 5.4 Supprimer

Le `✕` retire l'instance du brouillon. Pas de confirmation (*Annuler* suffit). **Le trou reste** : pas de compaction.

### 5.5 Premier lancement

Rien en stockage → dashboard vide, avec « Ajouter mon premier widget » (qui entre en mode édition et ouvre la palette).

---

## 6. Persistance

### 6.1 Interface

Le front parle à `load()` / `save()`, jamais directement à `localStorage`. L'API NestJS se branchera plus tard sur la même interface.

### 6.2 Format

Le tableau d'instances **seul**, sans enveloppe. Si une version apparaît plus tard, `Array.isArray` distinguera l'ancien format du nouveau.

### 6.3 Chargement et réparation

Principe : **ce qui est récupérable n'est jamais perdu**.

| Problème | Traitement |
|---|---|
| JSON illisible | Dashboard vide, sans écran d'erreur |
| Widget illisible : pas d'`id`, coordonnées qui ne sont pas des nombres | Écarté, avec `console.warn` |
| `type` absent du catalogue | Écarté, avec `console.warn` |
| Géométrie invalide : hors des 12 colonnes, coordonnées négatives, sous le minimum | Taille ramenée entre le minimum et 12, puis **replacé en fin de grille** |
| Chevauchement | Le **second** dans l'ordre de lecture est replacé en fin de grille |

- « Fin de grille » = **sous le widget le plus bas** (`y = max(y + h)`), et non dans le premier trou : le widget réparé arrive en dernier dans l'ordre de lecture.
- On pose d'abord tous les widgets valides, puis on replace les invalides dans leur ordre d'origine. Même JSON → même résultat.
- **La réparation n'est pas enregistrée** : elle ne s'applique qu'à l'affichage, jusqu'au prochain *Enregistrer*. Seule une action de l'utilisateur écrit dans les données.
- Un type inconnu n'est pas une erreur de données : c'est un widget sans définition. Il ne passe donc pas par l'état `error` (§7.3).

---

## 7. Données et états

### 7.1 Contrat par archétype

Chaque archétype fixe la forme de la donnée qu'il affiche. Toutes les sources d'un même archétype la respectent.

- `stat` : `{ value: number, unit?: string, caption?: string }`
- `chart` : à définir quand l'archétype sera rendu.

### 7.2 Source (cible, au branchement)

Une fonction `(signal: AbortSignal) => Promise<Données de l'archétype>`, déclarée par l'entrée de catalogue. Le chargement vit dans un hook ; le Body reste un composant pur qui reçoit ses valeurs en props. Annulation par `AbortController` au démontage.

### 7.3 États d'un widget

- Union discriminée : `loading | success | error`. Jamais deux booléens indépendants.
- **V1 : états fournis en dur**, pour ne travailler que l'affichage.
- *Recommandation* : les fournir depuis l'emplacement du futur hook de chargement. Le jour du branchement, seul le contenu de ce hook change.
- Chaque état occupe la **taille finale** du widget : la grille ne saute pas.
- L'erreur reste confinée à la carte (message court, *Réessayer*).

### 7.4 Formatage

La donnée reste **brute** (`1840`). Le Body formate à l'affichage (`Intl.NumberFormat`, locale `en`).

Raisons :
- une vraie API renverra des nombres ;
- un chart ne peut rien faire d'une chaîne ;
- tout le formatage est au même endroit.

---

## 8. Organisation du code

- **Fonctions pures de géométrie** (collision, première place libre, validation et réparation, tri) dans un fichier sans React, testées avec **Vitest**.
- **État** (disposition enregistrée, brouillon, mode édition) dans `pages/Dashboard.tsx`, éventuellement extrait dans un hook.
- **`components/widgets/`** : ce qui s'affiche (grille, carte, Bodies, table des archétypes, catalogue).
- Pas de store global (Redux / Zustand).

---

## 9. Critères d'acceptation V1

1. `npm run build` passe.
2. Un dashboard vide affiche l'écran d'accueil. Son bouton entre en mode édition et ouvre la palette.
3. Un widget ajouté apparaît à la première place libre, avec la taille de son entrée, ou à défaut de son archétype.
4. En mode lecture : aucun `✕`, aucune palette. En mode édition : les deux.
5. Une suppression laisse un trou. Le prochain ajout peut le combler s'il y tient.
6. *Annuler* restaure exactement la disposition enregistrée. *Enregistrer* la fait survivre à un rechargement complet.
7. Quitter la page avec des modifications non enregistrées demande confirmation.
8. Au-dessus du seuil : positions et trous identiques quelle que soit la largeur, et tout est proportionnel.
9. Sous le seuil : une colonne, dans l'ordre `y` puis `x`, et pas de bouton « Éditer ».
10. Un JSON corrompu donne un dashboard vide, sans erreur. Un type inconnu est écarté. Une géométrie invalide est réparée en fin de grille, sans être enregistrée tant que l'utilisateur n'enregistre pas.
11. Chaque état (`loading`, `success`, `error`) s'affiche à la taille finale du widget.

---

## 10. Options écartées — pour ne pas y revenir

| Option | Pourquoi écartée |
|---|---|
| `repeat(auto-fill, minmax(…))` | Le nombre de colonnes n'est connu que du navigateur, donc des positions enregistrées n'ont pas de sens. |
| 5 ou 6 colonnes | 12 pour la granularité (quarts possibles). |
| Mode intermédiaire à 6 colonnes | Diviser positions **et** tailles par 2 crée des chevauchements. Diviser les seules tailles ne grossit pas les widgets (1 colonne sur 6 ≈ 2 colonnes sur 12). Un mode sans positions rendrait le drag V2 impossible sur portable. |
| Placement par classes Tailwind (`col-start-*`) | Tailwind ne génère que les classes écrites en toutes lettres, et `y` n'a pas de borne. |
| Style inline `gridColumn` | L'inline bat les règles responsive : le mode téléphone ne pourrait plus l'annuler. |
| Taille portée par le type (`WidgetSize` + `widgetSizeClasses`) | La taille appartient à l'emplacement (ADR du 16/09). |
| Défaut de taille appliqué à l'affichage | Un changement de défaut dans le code créerait des chevauchements dans les données enregistrées. |
| Unicité par type, `type` servant d'identité (CDC du 05/09) | Pas de sens pour un système générique ; l'`id` revient. |
| Persistance directe vers l'API | Hors périmètre ; l'interface `load()` / `save()` la préparera. |
| `react-grid-layout` | Moteur maison, choix pédagogique. |

---

## 11. Valeurs encore à fixer

- `defaultSize` et `minSize` de `stat` et de `chart` (le chart au moins 4×2, à confirmer au rendu).
- Seuil de bascule définitif : 866px (actuel) ou ≈ 990px (2×1 ≥ 160px).
- Padding de la carte proportionnel (`clamp(8px, 1cqi, 16px)`) à la place de `px-4 py-3.5`.
