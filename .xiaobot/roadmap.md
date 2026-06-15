# Roadmap — XiaoTrack

Vue d'ensemble du projet, gérée par XiaoBot. Mise à jour aux moments charnières (validation utilisateur).

## Done

- Routing data router (index route + `redirect()`, métadonnées sous `handle`, titre via `useMatches`) — cf. session-log 2026-06-11.

## In progress

- **Système de widgets dashboard** — conception 5 couches actée (ADR 2026-06-15). Construction maison (pas de lib layout).
  - Couche 1 (donnée `WidgetInstance`) : en cours de conception fine — interface / discriminated union.
  - Prochaines étapes : signature du hook `useDraggable`, Shell `<Widget>` (physique + effets CSS), puis rendu statique → add/remove → persistance → drag.

## Next / Backlog

- Finir le narrowing du titre `MainHeader` (`handle: unknown`) — bloquant compilation, hérité du 2026-06-11.
- Unifier la source de vérité des sections (routes / sidebar / pages).
- Dette front 2026-05-20 : fallback Avatar (bug), nettoyer `eventClickTest`/`console.log`, `SBCategoriePprops`, `grid` sans cols de `MainContent`, hoist `categories`, logo cliquable.
- Vérifier compat `react-grid-layout` / `Tremor` ↔ React 19 + Tailwind v4 (si on bascule sur une lib un jour).
