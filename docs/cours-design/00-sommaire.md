# Cours : comprendre la refonte design de XiaoTrack

Ce cours explique **tout ce qui a été écrit pendant la refonte design** (commits du 12 et du 13 novembre 2026, jusqu'à `0cd8d24`) : le système de tokens, le CSS moderne, les animations CSS et JavaScript. Il part de zéro : aucune connaissance en CSS moderne ni en animation n'est supposée. Il suppose seulement que tu connais React et TypeScript.

## Comment l'utiliser

- **Lis dans l'ordre.** Chaque chapitre s'appuie sur les précédents, et les prérequis sont indiqués en tête.
- **Garde l'app ouverte** (`npm run dev:web`) et les fichiers cités à côté. Chaque chapitre pointe vers le code réel, avec le numéro de ligne au moment de l'écriture (commit `0cd8d24`). Si une ligne a bougé depuis, cherche l'extrait cité.
- **Fais l'exercice de fin de chapitre.** C'est là que la notion s'installe. Annule tes essais ensuite avec `git restore`.
- **Pour retrouver une notion**, le chapitre 17 se termine par un index « notion → fichier → chapitre ».

## La même logique dans chaque chapitre

| Section | Ce qu'elle t'apporte |
|---|---|
| 1. Le problème | Pourquoi la notion existe : ce qu'on ne pourrait pas faire sans elle |
| 2. La notion | L'explication à partir de zéro, chaque terme défini |
| 3. Exemple minimal | Un code court à coller et tester tout de suite |
| 4. Dans XiaoTrack | Où et comment l'app l'utilise, extrait réel expliqué ligne à ligne |
| 5. Pièges | Les erreurs fréquentes, et celles rencontrées dans ce projet |
| 6. À retenir | L'essentiel en quelques phrases |
| 7. Exercice | Une manipulation dans le projet, avec sa solution |

## Le parcours

### Partie 1 : les fondations du style

Comment les styles sont déclarés, organisés et partagés.

| # | Chapitre | En une phrase |
|---|---|---|
| 01 | [Les variables CSS](01-variables-css.md) | Des valeurs nommées, héritées dans le DOM, que React peut poser |
| 02 | [La cascade et les couches](02-cascade-et-couches.md) | Qui gagne quand deux règles se contredisent |
| 03 | [Tailwind v4 : @import et @theme](03-tailwind-theme.md) | Comment un token devient une classe utilitaire |
| 04 | [@utility et les classes de composants](04-utility-et-composants.md) | Écrire ses propres classes, et choisir la bonne forme |

### Partie 2 : l'apparence

Couleurs, profondeur et mise en page.

| # | Chapitre | En une phrase |
|---|---|---|
| 05 | [Couleurs modernes](05-couleurs-modernes.md) | oklch, color-mix, et nommer les couleurs par rôle |
| 06 | [Dégradés, ombres et halos](06-degrades-ombres-halos.md) | Donner de la lumière et de la profondeur |
| 07 | [Le layout de l'app](07-layout-de-l-app.md) | Grid, hauteur d'écran, qui défile, sticky |
| 08 | [Container queries](08-container-queries.md) | S'adapter à la taille de son parent, pas de la fenêtre |

### Partie 3 : le mouvement en CSS

Bouger, changer d'état, apparaître et disparaître.

| # | Chapitre | En une phrase |
|---|---|---|
| 09 | [Transformations](09-transformations.md) | Déplacer, agrandir, tourner sans toucher à la mise en page |
| 10 | [Transitions et courbes d'accélération](10-transitions-et-easings.md) | Passer en douceur d'un état à un autre |
| 11 | [Les animations @keyframes](11-keyframes.md) | Des animations scénarisées, en boucle ou en cascade |
| 12 | [Faire apparaître et disparaître](12-apparition-disparition.md) | Le cas difficile : ce qui entre ou sort du DOM |

### Partie 4 : le mouvement en JavaScript

Quand le CSS ne suffit plus.

| # | Chapitre | En une phrase |
|---|---|---|
| 13 | [requestAnimationFrame et useCountUp](13-raf-et-usecountup.md) | Animer un nombre image par image |
| 14 | [FLIP et la Web Animations API](14-flip-et-waapi.md) | Animer ce que le CSS ne sait pas animer : un changement de case |
| 15 | [SVG pour les graphiques](15-svg-graphiques.md) | Dessiner une courbe qui s'étire à toutes les tailles |
| 16 | [Réduire les animations](16-reduced-motion.md) | Respecter l'utilisateur qui demande moins de mouvement |

### Partie 5 : synthèse

| # | Chapitre | En une phrase |
|---|---|---|
| 17 | [Un widget de bout en bout](17-recap-un-widget.md) | Toutes les notions, dans l'ordre où un widget les traverse, et l'index du cours |

## Les fichiers au cœur de la refonte

| Fichier | Rôle | Chapitres |
|---|---|---|
| [index.css](../../apps/web/src/assets/css/index.css) | Tokens, utilities, boutons, fond, règle reduced-motion | 01 à 06, 10, 16 |
| [widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css) | Grille, cartes, corps des widgets, drag, animations | 01, 02, 06 à 11, 15 |
| [modal.css](../../apps/web/src/components/modals/modal.css) | Ouverture et fermeture animées des `<dialog>` | 12 |
| [palette.css](../../apps/web/src/components/widgets/palette/palette.css) | Palette de widgets, badge « Added » | 02, 11 |
| [WidgetGrid.tsx](../../apps/web/src/components/widgets/WidgetGrid.tsx) | Variables de placement, cascade d'entrée, sortie différée | 01, 07, 11, 12, 14 |
| [useFlipAnimation.ts](../../apps/web/src/components/widgets/hooks/useFlipAnimation.ts) | Glissement des widgets qui changent de case | 09, 14 |
| [useCountUp.ts](../../apps/web/src/components/widgets/hooks/useCountUp.ts) | Compteur animé | 13 |
| [ChartBody.tsx](../../apps/web/src/components/widgets/bodies/ChartBody.tsx) | Courbe en SVG | 15 |
| [MainLayout.tsx](../../apps/web/src/layout/MainLayout.tsx) | Squelette de l'app | 07 |

La charte qui a guidé ces choix est dans [docs/design/charte-graphique.md](../design/charte-graphique.md).
