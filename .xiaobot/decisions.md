# Décisions techniques — XiaoTrack (ADR-light)

Journal des décisions structurantes, géré par XiaoBot. Une entrée par décision réelle.

---

## 2026-06-15 — Architecture du système de widgets en 5 couches

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
