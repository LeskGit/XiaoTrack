# Décisions techniques — XiaoTrack (ADR-light)

Journal des décisions structurantes, géré par XiaoBot. Une entrée par décision réelle.

---

## 2026-06-15 — Architecture du système de widgets en 5 couches

> **Partiellement précisée par l'entrée du 2026-09-16.** Les 5 couches restent valides. La géométrie du `layout` (colonnes, placement, collision, responsive) y est détaillée. Le champ `position: number` apparu dans le code entre-temps est une dérive de cette ADR, corrigée le 2026-09-16.

**Contexte.** Le dashboard doit afficher des widgets déplaçables (drag), redimensionnables plus tard, avec des contenus variés (chart, table, draw, stat) et une disposition persistante. Projet d'apprentissage : on construit le « mini framework » de widgets **soi-même** plutôt que d'adopter `react-grid-layout` (besoin peu poussé, valeur pédagogique, et risque de compat React 19 / `findDOMNode` sur la lib). Tension apprentissage vs side-project sérieux assumée.

**Options envisagées.**
- Option A : un composant `WidgetInstance` unique portant TOUT (donnée + physique drag + UI + CSS). → Rejeté : god-component, intestable, persistance impossible (donnée et DOM enchevêtrés), collision de nom donnée/composant.
- Option B (retenue) : séparation stricte comportement (hook) / présentation (composant) / donnée (type) / contenu (body par type) / orchestration (parent).

**Décision.** Architecture en 5 couches étanches :

1. **Donnée (sérialisable, JSON pur)** — `WidgetInstance` = description persistable : `{ id, type, layout: {x,y,w,h}, style?, data }`. Aucune fonction ni ref DOM. Vit dans un `WidgetInstance[]` chez le parent.
2. **Comportement (headless)** — hook `useDraggable` (Pointer Events → position), plus tard `useResizable`. Retourne `{ position, handlers }`, ne rend aucun JSX. C'est là qu'est la « physique ».
3. **Présentation** — Shell `<Widget>` : carte (bordure, ombre, barre de titre, ✕), effets CSS/hover, branche les `handlers` du hook sur la poignée. Composant « bête ».
4. **Contenu** — Body dispatché par `type` via le Registry (`chart`/`table`/`draw`/`stat`), modélisé en **discriminated union** sur `type`.
5. **Orchestration** — `<Dashboard>` détient le `WidgetInstance[]` en state, map → un `<Widget>` par instance, gère add/remove/reorder, persiste.

```
<Dashboard>                 ← state: WidgetInstance[] (source de vérité)
 └─ <Widget> (×N)           ← présentation + useDraggable()
     └─ <WidgetBody>        ← Registry: type → composant
         └─ <ChartBody> | <TableBody> | ...
```

**Principes React-friendly tenus.**
- Source de vérité = le tableau chez le parent, JAMAIS la position DOM (cf. règle « l'URL est le state »). Le drag mute `layout` dans le tableau.
- Drag perf : position **transient locale** pendant le déplacement (state interne du hook ou `transform` via ref qui bypasse le render), **commit** dans le state parent au `pointerup`. Évite N re-renders à 60 fps. (À confirmer définitivement.)
- Pas de store (Redux/Zustand) tant qu'il n'y a pas de prop-drilling douloureux. Persistance = pyramide `useState → localStorage → API Nest`.
- Data du contenu : **option A** (Body nourri par le parent, pur et testable) plutôt qu'option B (widget autonome qui fetch). Tranche la question laissée ouverte le 2026-06-11.

**Conséquences.**
- `WidgetInstance` doit avoir sa **forme complète sérialisable dès maintenant** (même si les Body restent des stubs) pour ne pas migrer la persistance plus tard.
- `layout` reste agnostique de toute lib (données maison, JSON pur) → bascule possible vers une lib en couche layout sans toucher aux couches 1-4.
- Ordre de construction : (1) rendu statique → (2) remove → (3) add → (4) persistance → (5) reorder par drag → (6) resize/responsive plus tard. Le drag arrive APRÈS la persistance.

**À revisiter si.** Besoin de free-2D + collision + breakpoints responsive complexes → le maison gonfle, signal = « je débugge plus ma géométrie que je ne construis de widgets » → basculer sur `react-grid-layout` ou `@dnd-kit`. Vérifier alors compat React 19 + StrictMode.

---

## 2026-09-16 — Géométrie de la grille de widgets : placement en rectangles sur grille à cases

**Contexte.** Les widgets portaient leur propre taille (`WidgetSize` = `small|medium|large|wide` dans le catalogue, traduite en classes Tailwind `col-span-*` par `widgetSizeClasses`). Trois problèmes constatés à l'usage :

1. **Couplage fragile.** Les seuils responsive (`@min-[732px]/content:col-span-2`) étaient calés à la main sur l'unité de piste (`minmax(360px,1fr)`) et le padding de la grille (`p-4`), répartis sur deux fichiers, sans vérification possible par le compilateur. Un bug réel s'est produit : seuil à 732px alors que le calcul correct donnait 768px (le `p-4` avait été oublié), créant une fenêtre de 36px où les widgets débordaient horizontalement.
2. **Non-adaptatif.** Avec un nombre de colonnes figé en CSS, le nombre de widgets par ligne ne pouvait pas varier selon la largeur disponible.
3. **Mauvaise attribution de responsabilité.** La taille d'un widget est une propriété de son *emplacement*, pas de son *type*. Lier les deux rend le widget non composable : le même « daily kcal » ne peut pas être petit sur le dashboard et large sur une page dédiée sans dupliquer l'entrée du catalogue.

Objectif : permettre à terme le drag & drop et le resize, avec des positions persistées.

**Options envisagées.**

- **Option A — grille proportionnelle fine (12 colonnes, spans en douzièmes).** La colonne est une unité de mesure, un petit widget en occupe 3. Pour : granularité (moitiés, tiers, quarts, sixièmes en spans entiers — la raison historique du 12 depuis 960.gs). Contre : ne répond pas au besoin d'adaptativité (nombre de widgets par ligne toujours constant) ; matrice d'occupation 12 cellules/ligne pour la même information ; snapping du drag au 1/12 trop nerveux. → Rejeté : répondait à une grille proportionnelle, pas à une grille à cases.

- **Option B — `auto-fill` + `minmax()` (implémenté puis abandonné).** `repeat(auto-fill, minmax(360px,1fr))` : le navigateur calcule le nombre de colonnes. Pour : adaptatif, zéro breakpoint, pur CSS. Contre : **le nombre de colonnes n'est connu que du moteur de layout**. Incompatible avec des positions persistées (`grid-column: x+1` exige que JS et CSS partagent le même N) et avec le drag & drop (conversion pixels ↔ cellules). Le lire via `getComputedStyle` réinjecte du layout calculé dans la logique — fragile, et un frame en retard. → Rejeté.

- **Option C — matrice de cellules aplatie comme source de vérité.** Tableau row-major `[id1, id2, -1, id5, id5, ...]`, l'étendue d'un widget déduite de la répétition de son id sur des cases adjacentes. Pour : intuitif, les règles d'occupation s'écrivent facilement. Contre, trois défauts rédhibitoires :
  - *Valide pour un seul nombre de colonnes.* Le tableau est aplati en row-major : sa signification dépend entièrement de la largeur de ligne. Relu avec 3 colonnes au lieu de 5, un rectangle devient une forme non rectangulaire, impossible à rendre en CSS Grid.
  - *Autorise des états non rendables.* Rien n'empêche `[id5, -1, id5]` (widget disjoint) ni une forme en L. Impose un validateur « ce semis forme-t-il un rectangle plein ? » à chaque mutation, drag, resize, désérialisation.
  - *Duplique la donnée.* L'étendue d'un widget 3×2 est stockée 6 fois. Un déplacement = 6 écritures cohérentes ; un update partiel = corruption silencieuse.

  → Rejeté **comme stockage**, retenu **comme index dérivé** (cf. Décision, point 4).

- **Option D (retenue) — rectangles par widget + matrice dérivée.**

**Décision.**

*1. Inversion de la responsabilité de la taille.* Le widget **ne connaît plus sa taille**. Il remplit le rectangle qu'on lui donne. Trois responsabilités, trois propriétaires : la **grille** sait combien de place il y a, le **layout utilisateur** sait qui occupe quoi, le **widget** sait seulement se dessiner dans un rectangle.

*2. Source de vérité = rectangles, un par widget.*

```ts
type WidgetPlacement = { id: number; x: number; y: number; w: number; h: number };
```

Coordonnées en unités de grille, 0-indexées. Mappe directement sur CSS Grid : `grid-column: x+1 / span w`, `grid-row: y+1 / span h`. Aucune logique de placement à écrire, le moteur fait le travail.

*3. Rectangles uniquement.* Les formes en L et les widgets disjoints deviennent **inexprimables** par construction (*make illegal states unrepresentable*). Il ne reste que deux invariantes à valider : le **non-chevauchement** et **`x + w <= cols`**.

*4. Matrice d'occupation = vue dérivée, jamais du state.* Reconstruite à la demande depuis les placements, via `useMemo(() => buildOccupancy(placements, cols), [placements, cols])`. **Jamais** de `setOccupancy`. Le nombre de lignes se déduit de `max(y + h)` — les lignes s'ajoutent donc toutes seules quand un widget est déposé plus bas, sans état à gérer.

*5. Deux questions, deux outils.*

- « Ce rectangle rentre-t-il ici ? » → **AABB direct** sur la liste, O(n), sans matérialiser une seule cellule :
  `a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y`
  Comparaisons strictes : avec des `>=`, deux widgets qui se touchent seraient déclarés en collision.
- « Où y a-t-il de la place ? » → **matrice d'occupation**, scannée en first-fit.

*6. Colonnes V1 : 5, constante, pleine largeur.* `grid-template-columns: repeat(5, 1fr)`. Les cases s'adaptent à l'écran via `1fr`.

*7. Écrans trop petits : effondrement en colonne unique.* Sous un seuil, on ignore `x`/`y`/`w`/`h` et on empile dans l'ordre de lecture. Aucune coordonnée n'étant utilisée en mode effondré, aucune synchronisation JS↔CSS n'est requise.

*8. Le reflow est une projection, jamais une mutation.* Seule une **action utilisateur explicite** (drag, resize, ajout, suppression) écrit dans les placements. Un redimensionnement de fenêtre ne fait que projeter. Sans cette règle, un utilisateur qui réduit puis ré-agrandit sa fenêtre perd définitivement son rangement.

*9. Contrainte `w <= cols` appliquée deux fois.* Validée à la création **et** clampée à l'affichage (`Math.min(w, cols)`). Une seule des deux ne suffit pas dès lors que `cols` peut varier.

**Conséquences.**

- **`WidgetInstance.position: number` disparaît**, remplacé par `{x, y, w, h}` — retour à la forme déjà actée dans l'ADR du 2026-06-15, dont le code avait dérivé.
- **`widgetSizeClasses` et les variantes `@min-[…]/content:` disparaissent**, avec la dette de seuils couplés qui les accompagnait. Le conteneur `@container/content` posé sur `MainContent` devient inutilisé pour les widgets (à conserver ou retirer selon d'autres usages).
- **`WidgetSize` (`small|medium|large|wide`) survit comme preset de création** — un `{w, h}` par défaut dans le catalogue — et non plus comme propriété de style.
- **Pas de `ResizeObserver` en V1.** `cols` étant une constante, JS et CSS partagent la même valeur par construction. Ce besoin réapparaîtra dès que `cols` deviendra variable.
- **Dette acceptée — pas de plafond de taille de case.** 5 colonnes en pleine largeur donne des cases de ~218px sur un viewport de 1440px (serré) et ~618px sur un ultrawide de 3440px (trop gros). Correctif connu et non bloquant : `max-width` + `mx-auto` sur la grille.
- **Reportés en V2** : nombre de colonnes configurable par l'utilisateur (la préférence servirait de *plafond* : `cols = clamp(1, floor((W+gap)/(CELL_MIN+gap)), préférence)`), plafond `CELL_MAX`, drag & drop, resize.
- **Migration.** Passer de 5 colonnes à une autre valeur est **avec perte** (aucun multiple commun) : tout layout persisté devra être réinterprété. Une base de 6 aurait permis une migration 6→12 sans perte (×2 sur tous les `x` et `w`). Choix de 5 assumé pour la V1, coût connu.
- **Note d'implémentation** : si le placement est posé en style inline (`gridColumn`), l'inline bat les classes Tailwind et empêche l'override en media query. Poser des **variables CSS** en inline (`--wx`, `--ww`) et laisser une règle CSS les consommer, pour que l'effondrement mobile puisse reprendre la main.

**Question laissée ouverte.** Grille **compactante** ou **trous persistants** à la suppression d'un widget ? Le placement libre (trous conservés) est plus proche d'un éditeur et cohérent avec le modèle retenu, mais impose de fournir un « ranger automatiquement » un jour. À trancher à l'implémentation du remove.

**À revisiter si.** (a) Les cases sur ultrawide deviennent gênantes → ajouter `CELL_MAX` + centrage. (b) Besoin de granularité plus fine que le 1/5 → passer à une grille à unité de mesure, en acceptant la migration avec perte. (c) `cols` devient variable → `ResizeObserver` obligatoire, et l'alignement JS↔CSS redevient un invariant à tenir. (d) La géométrie maison coûte plus cher à débugger qu'à construire → signal de bascule vers `react-grid-layout` / `@dnd-kit`, déjà identifié dans l'ADR du 2026-06-15.
