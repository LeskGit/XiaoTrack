# Maquettes XiaoTrack

> Export de la toile Claude Design. **La source vivante est l'artefact**, ce dossier en garde la trace dans git.
> Dernier export : 2026-11-23 (version `1795388840-4865` de la toile).

| Quoi | Où |
|---|---|
| Toile des maquettes (« XiaoTrack Mockups ») | https://claude.ai/artifact/JRuQYU7ywca9k7MbjSmR4T |
| Design system (« XiaoTrack ») | https://claude.ai/artifact/8eEDLkekqUK9GJgvHxFhRi, exporté dans [`../design-system/`](../design-system/) |

## Fonctionnement

1. On fait évoluer les maquettes **dans l'artefact** : une page de la toile par domaine, un artboard par écran.
2. Quand un écran est validé, on l'exporte ici (copie exacte des fichiers `project/` de la toile), puis on commit.
3. Le design system est construit depuis `apps/web/src/assets/css/index.css` et [`../charte-graphique.md`](../charte-graphique.md). Si la charte change, on met d'abord à jour le code, puis le design system, puis on réexporte.

## Contenu

- `canvas.json` : l'index de la toile (position de chaque artboard, pages, notes).
- `*.dc.html` : un écran par fichier, préfixé par son domaine (`workouts-…`). `Main.dc.html` est l'entrée de la toile (liste des séances, téléphone).
- `shared/xt-tokens.css` : les tokens en variables CSS (sans le préfixe `--color-` du code : `--accent` ici = `--color-accent` dans l'app).
- Les écrans chargent aussi `ds/xiaotrack/components/bundle.css` : c'est la copie du design system installée sur la toile, identique à [`../design-system/components/bundle.css`](../design-system/components/bundle.css). Elle n'est pas dupliquée ici.

Les fichiers `.dc.html` ne s'ouvrent pas seuls dans un navigateur : ils ont besoin du moteur de la toile (`support.js`). Pour les **voir**, ouvrir l'artefact. Ici, ils servent de référence pour coder (structure, classes, textes).

## Écrans exportés

### Workouts V1 (séances libres, [cadrage](../../workouts/00-cadrage-v1.md))

| Écran | Téléphone | Desktop |
|---|---|---|
| Liste des séances | `Main.dc.html` | `workouts-sessions-desktop.dc.html` |
| Nouvelle séance | `workouts-session-new.dc.html` | |
| Séance planifiée | `workouts-session-planned.dc.html` | |
| Séance en cours | `workouts-session-live.dc.html` | `workouts-session-live-desktop.dc.html` |
| Séance terminée | `workouts-session-done.dc.html` | |
| Catalogue d'exercices | `workouts-exercises.dc.html` | `workouts-exercises-desktop.dc.html` |
| Nouvel exercice perso | `workouts-exercise-new.dc.html` | |
| Fiche exercice et note | `workouts-exercise-detail.dc.html` | |

**Choix faits dans les maquettes, encore à valider :**
- Une séance n'a pas de nom dans le MCD : elle est affichée par sa date (« Tomorrow », « Sat 22 Nov ») et ses exercices.
- Statuts en badge : Planned (neutre), In progress (warning, point qui pulse), Done (success). La classe `.badge` n'existe pas encore dans `index.css`.
- La note durable (`UserExercise.notes`) apparaît en encart indigo partout où l'exercice est utilisé.
- « Used in 3 sessions » sur la fiche exercice : aucun endpoint du plan ne le fournit. À retirer, ou à ajouter à l'API.
