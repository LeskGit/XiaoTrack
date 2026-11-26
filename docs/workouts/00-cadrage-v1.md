# Workouts — Cadrage V1

> **Statut** : cadrage validé le 2026-11-22. **Ce document fait foi** pour le périmètre du domaine Workouts.
> **Modèle de données** : `mcd-v1.md` (mis à jour le même jour avec les décisions ci-dessous).
> Les points du §8 restent à trancher avant ou pendant le développement de la V1.

---

## 1. Objet

Suivre ses séances de sport (musculation et cardio) : préparer une séance, la faire, garder l'historique.

**Principe directeur : aucun calcul imposé.** L'app ne réécrit jamais ce que l'utilisateur a saisi. Elle peut **proposer** des raccourcis (boutons qui pré-remplissent), toujours modifiables, toujours ignorables. Tout le reste se fait à la main.

**Méthode de travail** : une V1 simple et fonctionnelle d'abord, puis des étapes successives. Chaque étape est livrée et utilisable avant de passer à la suivante.

---

## 2. Périmètre

### Étape 1 (V1) : séances libres

| | |
|---|---|
| Types d'exercices | Musculation et cardio uniquement |
| Catalogue | Exercices fournis par l'app (seed) + exercices personnels (§3.5) |
| Notes durables | Une note par exercice et par utilisateur (`UserExercise.notes`) |
| Séance | Libre (sans template ni programme), saisie entièrement à la main |
| Cycle de vie | Créer (`planned`) → **Start session** (`in_progress`) → terminer (`done`) |
| Saisie | Objectif et réalisé sur chaque série |
| Historique | Liste des séances passées et leur détail |
| Calculs | Aucun |

Tables utilisées : `Exercise`, `UserExercise`, `WorkoutSession`, `SessionExercise`, `SessionSet`.

### Étape 2 : programmes et templates (prévue)

Décrite au §5 pour que le modèle la prépare dès maintenant. Elle ne commence qu'une fois l'étape 1 terminée.

### Hors périmètre (pour l'instant)

- Sports collectifs, mobilité, technique (volley, yoga…).
- Calcul automatique de progression (au-delà du bouton de surcharge de l'étape 2).
- Tags (`Tag`, `TemplateTag`, `WorkoutSessionTag`).
- Parties du corps (`BodyPart`, `ExerciseBodyPart`) et statistiques par muscle.
- Statistiques et courbes de progression.
- Fréquence cardiaque, calories, autres métriques.
- Copier un exercice fourni pour le personnaliser (`variantOfId`) : retiré du MCD le 2026-11-26, faute de besoin prouvé. Un exercice perso créé de zéro couvre le cas.

---

## 3. Exercices et métriques

### 3.1 Deux profils de mesure

Chaque exercice déclare **ce qu'on mesure** avec un profil fermé (`measureType`), pas une liste libre :

| `measureType` | Champs saisis | Exemples |
|---|---|---|
| `REPS_WEIGHT` | reps + charge | développé couché, tractions (charge 0), tractions lestées |
| `DURATION_DISTANCE` | durée + distance | course, vélo, gainage (sans distance), corde à sauter |

Le front choisit les champs à afficher avec un simple `switch` sur le profil.

### 3.2 Catégorie

`category` (`RESISTANCE` | `CARDIO`) sert à **filtrer le catalogue**. Elle n'est pas redondante avec le profil : le gainage est de la musculation (`RESISTANCE`) mesurée en durée (`DURATION_DISTANCE`).

### 3.3 Valeurs : 0 ou vide

- **Charge à 0** = poids du corps. C'est une vraie valeur (on a soulevé 0 kg en plus du corps).
- **Distance vide** (`null`) = la distance ne s'applique pas (gainage). On n'enregistre **jamais 0** dans ce cas, sinon les futures moyennes seraient faussées.
- Un champ `actual*` vide = la série n'a pas encore été faite.

### 3.4 Unités stockées

kg (décimal, pour 2,5), secondes et mètres (entiers). L'affichage convertit (« 5 km », « 30:00 »).

### 3.5 Exercices personnels

L'utilisateur peut créer ses propres exercices (`ownerId` = lui, visibles par lui seul) : nom, catégorie, profil de mesure, description facultative.

| Action | V1 |
|---|---|
| Créer | oui |
| Modifier le nom ou la description | oui ; l'historique affiche le nom actuel |
| Modifier le profil de mesure | non, dès que l'exercice a servi dans une séance |
| Supprimer | non (plus tard : archivage via `UserExercise.archivedAt`) |
| Copier un exercice fourni | non, hors périmètre (§2) |

Les exercices fournis ne sont jamais modifiables par l'utilisateur.

### 3.6 Catalogue fourni (seed)

Un petit seed écrit à la main, **noms en anglais** (UI en anglais), sans description ni image en V1. Il doit être rejouable, comme celui des utilisateurs.

| Catégorie / profil | Exercices |
|---|---|
| `RESISTANCE` / `REPS_WEIGHT` | Bench press, Incline dumbbell press, Push-up, Dips, Pull-up, Lat pulldown, Barbell row, Seated cable row, Overhead press, Lateral raise, Face pull, Biceps curl, Hammer curl, Triceps pushdown, Back squat, Deadlift, Romanian deadlift, Leg press, Walking lunge, Leg curl, Leg extension, Hip thrust, Calf raise |
| `RESISTANCE` / `DURATION_DISTANCE` | Plank, Side plank, Farmer's walk |
| `CARDIO` / `DURATION_DISTANCE` | Running, Treadmill, Cycling, Stationary bike, Rowing machine, Elliptical, Jump rope |

33 exercices. Push-up, Dips et Pull-up se font au poids du corps (charge 0) ou lestés.

### 3.7 Stockage

**Colonnes fixes** dans `SessionSet` (`targetRepsMin`, `targetRepsMax`, `targetWeight`, `targetDuration`, `targetDistance` et leurs `actual*`), toutes facultatives. Ajouter une métrique demande une migration, ce qui est acceptable. Écartés : une table de mesures (requêtes lourdes, typage perdu) et une colonne JSON (aucune validation).

---

## 4. Étape 1 : la séance libre

### 4.1 Cycle de vie

```
Créer ──► planned ──[Start session]──► in_progress ──[Terminer]──► done
```

1. **Créer une séance** → `WorkoutSession` en `planned`, avec une date facultative (`scheduledDate` : aujourd'hui, dans deux jours…). La séance ne démarre pas toute seule.
2. **Préparer** (en `planned`) : choisir les exercices dans le catalogue (`SessionExercise`), ajouter les séries avec leur objectif (`SessionSet.target*`).
3. **Start session** (clic manuel) → `in_progress`, `startedAt` renseigné.
4. **Pendant la séance** : saisir le réalisé de chaque série (`actual*`, `rpe`, `completedAt`). On peut encore ajouter un exercice (sans objectif) ou en sauter un (`SessionExercise.skipped`).
5. **Terminer** → `done`, `endedAt`, et optionnellement `feeling` et `notes`.

La séance libre est **indépendante** : aucun lien vers un template ou un programme (`templateId` et `programSlotId` vides), aucun calcul.

### 4.2 Les séries

- Le nombre de séries **est** le nombre de lignes `SessionSet` : pas de colonne « nombre de séries ».
- L'objectif est une **fourchette de reps** (`targetRepsMin` / `targetRepsMax`, par exemple 8-12). Pour un objectif fixe, min = max.
- Objectif et réalisé vivent **sur la même ligne**.

### 4.3 Les notes

| Où | Portée | V1 |
|---|---|---|
| `UserExercise.notes` | cet exercice, **toujours** (« se concentrer sur la descente ») | ✅ |
| `WorkoutSession.notes` | la séance | ✅ |
| `SessionExercise.notes`, `SessionSet.notes` | cette séance, cet exercice / cette série | non : colonnes en base, pas d'UI |

### 4.4 Règles du cycle de vie

- **Une seule séance `in_progress` à la fois** : *Start session* est refusé (409) si une autre séance est en cours.
- **Abandonner** = supprimer la séance (avec confirmation), tant qu'elle n'est pas `done`. Ses exercices et séries partent avec elle.
- **Une séance terminée reste modifiable librement** (corriger une saisie), avec le même écran que pendant la séance.
- Les transitions de statut sont vérifiées par l'API, jamais seulement par le front.

---

## 5. Étape 2 : programmes et templates (prévue)

### 5.1 Template = moule sans chiffres

Un template (« Push ») est une **liste ordonnée d'exercices**, avec un temps de repos par exercice. Il ne porte **ni séries, ni reps, ni charge, ni note**.

On le modifie à la main. Si on veut le changer en cours de programme (par exemple à partir de la semaine 3), l'utilisateur choisit : **modifier** le template, ou en **créer une copie** utilisée à partir de cette date. Les séances passées ne sont jamais touchées (historique figé, cf. `mcd-v1.md`).

### 5.2 Programme = la semaine type

Un programme place des templates dans la semaine (Push le lundi, Pull le mardi, Legs le mercredi). On stocke la **règle** (`ProgramSlot`), pas les occurrences : lundi prochain, l'app affiche « Push, 5 exercices » sans qu'aucune séance existe en base.

### 5.3 Planifier une occurrence

Le bouton **Planifier** sur une occurrence ouvre un écran de saisie (séries, reps, charge par exercice) et crée une `WorkoutSession` en `planned`. Ensuite, le cycle de vie est celui de la séance libre (§4.1).

Trois façons de remplir l'écran :

| Bouton | Disponible quand | Effet |
|---|---|---|
| *(aucun)* | toujours | saisie à la main |
| **Reprendre la dernière séance** | une séance précédente de ce template existe | pré-remplit avec les **objectifs** de la dernière fois (pas le réalisé) |
| **Surcharge progressive** | exercice `REPS_WEIGHT` dont **toutes les séries** ont atteint `targetRepsMax` | propose **+2,5 kg** (ajustable vers le haut ou le bas) ; les reps redescendent à `targetRepsMin` ; pré-remplit |

Exemple : développé couché à 70 kg, 4 × 12 avec un maximum à 12 → le bouton apparaît → +2,5 kg proposés → l'utilisateur valide 72,5 kg → les 4 séries sont pré-remplies à 72,5 kg, objectif 8-12.

La surcharge ne s'applique qu'aux exercices `REPS_WEIGHT`.

---

## 6. Données utilisées par l'étape 1

Extrait du MCD (détail dans `mcd-v1.md`) :

| Table | Rôle en V1 |
|---|---|
| `Exercise` | Catalogue fourni (`ownerId` null), `category`, `measureType` |
| `UserExercise` | Note durable par exercice (créée à la première note) |
| `WorkoutSession` | La séance : statut, date prévue, début, fin, ressenti, notes |
| `SessionExercise` | Un exercice dans la séance, sa position, `skipped`, repos visé |
| `SessionSet` | Une série : objectif et réalisé |

---

## 7. Décisions (2026-11-22)

| Sujet | Décision |
|---|---|
| Découpage | Étape 1 séances libres, étape 2 programmes + templates |
| Calculs | Aucun calcul imposé ; seulement des propositions à l'étape 2 |
| Séance libre | Créée en `planned`, démarrée par un clic sur **Start session** |
| Note durable | `UserExercise.notes` |
| Fourchette de reps | `targetRepsMin` / `targetRepsMax` dans `SessionSet` |
| Template | Exercices + repos, sans objectif chiffré ni note |
| Changement de template en cours de programme | Modifier ou copier, au choix de l'utilisateur |
| « Reprendre la dernière séance » | Copie les objectifs, pas le réalisé |
| Surcharge progressive | +2,5 kg ajustable, reps remises au minimum, `REPS_WEIGHT` seulement |
| Périmètre sportif | Musculation et cardio |
| Stockage des métriques | Colonnes fixes |
| Profil de mesure | `measureType` : `REPS_WEIGHT` ou `DURATION_DISTANCE` |
| Catégorie | Gardée pour le filtre : `RESISTANCE` ou `CARDIO` |
| 0 ou vide | Charge 0 = poids du corps ; distance non applicable = vide, jamais 0 |
| Exercices personnels | Création + modification du nom ; pas de suppression ni de variante en V1 |
| Seed | 33 exercices de base écrits à la main, noms en anglais |
| Nom dans l'historique | Le nom actuel de l'exercice |
| Séance en cours | Une seule `in_progress` à la fois |
| Abandon | Suppression d'une séance non terminée |
| Séance terminée | Modifiable librement |
| Notes dans la séance | Pas d'UI en V1 |
| API des séances | Ressources fines (une série validée = un `PATCH`) |
| Modules Nest | `exercises` et `workout-sessions` |
| Données côté front | TanStack Query, après un premier écran fait à la main |

---

## 8. Points ouverts

### Avant de coder l'étape 1

1. ~~Exercices personnels~~ : tranché (§3.5).
2. ~~Contenu du seed~~ : tranché (§3.6).
3. ~~Une seule séance `in_progress`~~ : tranché (§4.4).
4. ~~Abandonner une séance~~ : tranché (§4.4).
5. ~~Modifier une séance terminée~~ : tranché (§4.4).
6. ~~Notes dans la séance~~ : tranché (§4.3).
10. **Repos visé** (avant la phase 2, API Sessions) : `SessionExercise.targetRestSeconds` est listé au §6 mais absent du schéma. L'ajouter par une migration dans l'étape 1, ou le reporter à l'étape 2 avec les templates (qui portent déjà un repos) ? `UserExercise.defaultRestSeconds` suit la même décision.

### Pour l'étape 2

7. **Retrouver la séance précédente** après une copie de template : par créneau de programme (`programSlotId`), ou en reliant la copie à l'original ?
8. **Séance manquée** : calculée seulement, ou marquable (`skipped`) ?
9. **Plusieurs programmes actifs** en même temps ?
