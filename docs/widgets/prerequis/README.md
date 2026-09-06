# Prérequis — fiches détaillées

Support d'apprentissage du système de widgets. Une fiche par notion, dans l'ordre.

Chaque fiche suit la même structure : **pourquoi tu en as besoin** (ancré dans le moteur de widgets), les **notions** avec exemples sur un domaine neutre, des **exercices** gradués, un **critère de réussite** observable, et les **pièges**.

Pas de corrigé. Les exemples illustrent la notion sur autre chose que le POC, pour que l'exercice reste un exercice.

| # | Fiche | Taille | Dépend de |
|---|---|---|---|
| 0 | [Préparer le terrain](00-terrain.md) | S | — |
| 1 | [Dériver des types depuis de la donnée](01-types-derives.md) | S | — |
| 2 | [Union discriminée et narrowing](02-union-discriminee.md) | S | 1 |
| 3 | [**L'algorithme de grille**](03-algo-grille.md) | **L** | 0, 1, 2 |
| 4 | [Props, état, et identité](04-props-etat-key.md) | M | — |
| 5 | [La table de dispatch](05-table-dispatch.md) | S | 1, 4 |
| 6 | [Effets, nettoyage, annulation](06-effets-annulation.md) | L | 2, 4 |
| 7 | [CSS Grid explicite](07-css-grid.md) | S | — |
| 8 | [Pointer Events](08-pointer-events.md) | M | 4 |
| 9 | [Hook headless](09-hook-headless.md) | M | 8 |
| 10 | [Premier feature-module NestJS](10-nestjs-module.md) | L | — |

## Les lots

**Lot 1 — dérisquer** : 0, 1, 2, 3.
À la fin, tu sais si le moteur de grille maison tient, et tu as un catalogue typé. C'est ce lot qui donne de quoi trancher la question 1 du CDC (maison ou bibliothèque) sur du concret plutôt qu'à l'intuition.

**Lot 2 — l'affichage** : 4, 5, 7.
Un dashboard statique s'affiche à partir de positions en dur, avec des valeurs en dur. C'est l'étape 1 de l'ADR.

**Lot 3 — les données** : 6.
Les valeurs en dur deviennent des valeurs chargées.

**Lot 4 — la persistance** : 10.
L'ordre de l'ADR place la persistance avant le drag ; il tient toujours.

**Lot 5 — le drag** : 8, 9, et le branchement de l'algorithme de la fiche 3.

Chaque lot produit quelque chose qui marche. S'arrêter après le lot 3 laisse un dashboard figé mais réel — ce qui vaut mieux qu'un moteur de drag sans rien à afficher.

## Les trois fiches qui comptent le plus

**Fiche 3** — le seul endroit où le projet peut vraiment se planter. C'est du TypeScript pur, testable sans navigateur, et c'est pour ça qu'elle est placée si tôt.

**Fiche 4** — corrige un modèle mental, pas une lacune. Son exercice sur `key` te fait voir de tes yeux un état sauter sur le mauvais élément. Elle se termine sur tes deux bugs ouverts.

**Fiche 6** — la brique qui produit les bugs les plus difficiles à diagnostiquer, parce qu'ils sont invisibles. Le piège de l'`AbortError` t'attend et il te coûtera une soirée si tu ne l'as pas lu avant.

## Ce que tu n'as pas besoin d'apprendre

La liste est en fin de `../02-prerequis.md`. Relis-la quand tu tomberas sur un article expliquant qu'il te faut absolument Redux, React Query ou une lib de layout.

## Contexte

- `../01-analyse.md` — le cahier des charges. À lire avant les fiches.
- `../02-prerequis.md` — la version condensée de ce dossier.
- `.xiaobot/decisions.md` — les ADR, dont six révisions issues de l'analyse.
