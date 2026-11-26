# Workouts — Cadrage V1

> **Statut** : cadrage validé le 2026-11-22, **révisé le 2026-11-27** (V1 révisée : titre de séance, notes de séance en V1, repos, favoris et archivage, séance terminée figée avec réouverture). **Ce document fait foi** pour le périmètre du domaine Workouts.
> **Modèle de données** : `mcd-v1.md` (mis à jour le même jour). Le §9 liste la migration qui fait passer `schema.prisma` à ce cadrage.
> **Plan de construction** : `01-plan-v1.md` date d'avant la révision ; à recaler sur ce document avant de coder la phase 2.

---

## 1. Objet

Suivre ses séances de sport (musculation et cardio) : planifier une séance, la faire en comparant le prévu au réalisé, garder l'historique.

**Principe directeur : aucun calcul imposé.** L'app ne réécrit jamais ce que l'utilisateur a saisi. Elle peut **proposer** des raccourcis (pré-remplissages), toujours modifiables, toujours ignorables.

**But de la comparaison prévu / réalisé** : savoir quand on est plus ou moins fort que ce qu'on pensait. Les objectifs ne bougent donc plus une fois la séance lancée (§4.4).

**Méthode de travail** : une V1 simple et fonctionnelle d'abord, puis des étapes successives. Chaque étape est livrée et utilisable avant de passer à la suivante.

---

## 2. Périmètre

### Étape 1 (V1) : séances ponctuelles

| | |
|---|---|
| Types d'exercices | Musculation et cardio uniquement |
| Catalogue | Exercices fournis par l'app (seed) + exercices personnels, de bout en bout (§3.5) |
| Préférences par exercice | Repos par défaut, favori, archivé (`UserExercise`, §3.6) |
| Planifier | Titre, date, exercices ordonnés et réordonnables, séries et repos par exercice, objectif par série (§4.2) |
| Faire la séance | Saisir le réalisé de chaque série, distinct du prévu ; remarque par série ; conclusion et validation par exercice (§4.3) |
| Terminer | La séance passe en `DONE` et devient **figée** ; une réouverture explicite permet de corriger (§4.5) |
| Historique | Liste des séances et leur détail |
| Calculs | Aucun |

Tables utilisées : `Exercise`, `UserExercise`, `WorkoutSession`, `SessionExercise`, `SessionSet`.

### Après la V1

1. **Retrouver la dernière fois** : la dernière séance sur un exercice (l'index `SessionExercise(exerciseId)` existe déjà), puis la dernière séance similaire (« dernière Push »). Ce lien passera par le template et le programme (§5), **jamais par le titre**.
2. **Étape 2 : programmes et templates** (§5).
3. Plus tard : minuteur de repos, statistiques.

### Hors périmètre (pour l'instant)

- Sports collectifs, mobilité, technique (volley, yoga…).
- Calcul automatique de progression (au-delà du bouton de surcharge de l'étape 2).
- Tags (`Tag`, `TemplateTag`, `WorkoutSessionTag`).
- Parties du corps (`BodyPart`, `ExerciseBodyPart`) et statistiques par muscle.
- Statistiques et courbes de progression.
- Fréquence cardiaque, calories, autres métriques.
- Minuteur de repos : le repos est affiché, pas décompté.
- Note durable sur un exercice, valable pour toutes les séances : retirée le 2026-11-27 (`UserExercise.notes` supprimée). Les consignes vivent dans la séance (§4.3).
- Copier un exercice fourni pour le personnaliser (`variantOfId`) : retiré du MCD le 2026-11-26, faute de besoin prouvé.

---

## 3. Exercices et métriques

### 3.1 Deux profils de mesure

Chaque exercice déclare **ce qu'on mesure** avec un profil fermé (`measureType`) :

| `measureType` | Champs saisis | Exemples |
|---|---|---|
| `REPS_WEIGHT` | reps + charge | développé couché, tractions (charge 0), tractions lestées |
| `DURATION_DISTANCE` | durée + distance | course, vélo, gainage (sans distance), corde à sauter |

Le front choisit les champs à afficher avec un simple `switch` sur le profil.

### 3.2 Catégorie

`category` (`RESISTANCE` | `CARDIO`) sert à **filtrer le catalogue**. Elle n'est pas redondante avec le profil : le gainage est de la musculation (`RESISTANCE`) mesurée en durée (`DURATION_DISTANCE`).

### 3.3 Valeurs : 0 ou vide

- **Charge à 0** = poids du corps. C'est une vraie valeur.
- **Distance vide** (`null`) = la distance ne s'applique pas (gainage). On n'enregistre **jamais 0** dans ce cas, sinon les futures moyennes seraient faussées.
- **Objectif vide** = pas d'objectif sur ce champ (permis, §4.2).
- Un champ `actual*` vide = rien n'a été saisi. Une série est « faite » quand `completedAt` est rempli (§4.3), pas quand un champ est rempli.

### 3.4 Unités stockées

kg (décimal, pour 2,5), secondes et mètres (entiers). L'affichage convertit (« 5 km », « 30:00 »).

### 3.5 Exercices personnels

L'utilisateur peut créer ses propres exercices (`ownerId` = lui, visibles par lui seul) : nom, catégorie, profil de mesure, description facultative.

| Action | V1 |
|---|---|
| Créer | oui |
| Modifier le nom ou la description | oui ; l'historique affiche le nom actuel |
| Modifier le profil de mesure | non, dès que l'exercice a servi dans une séance |
| Supprimer | non : on l'**archive** (§3.6). Un exercice utilisé ne peut de toute façon pas être supprimé (`Restrict`) |
| Copier un exercice fourni | non, hors périmètre (§2) |

Les exercices fournis ne sont jamais modifiables par l'utilisateur, mais il peut les mettre en favori, les archiver et leur donner un repos par défaut (§3.6).

### 3.6 Préférences par exercice (`UserExercise`)

`UserExercise` contient **seulement ce qui relie un utilisateur à un exercice, hors de toute séance**. La ligne est créée à la première préférence posée (upsert sur `userId` + `exerciseId`) ; sans ligne, on applique les valeurs par défaut.

| Colonne | Rôle | Sans ligne / vide |
|---|---|---|
| `defaultRestSeconds` | Repos habituel de cet utilisateur sur cet exercice. Pré-remplit `SessionExercise.restSeconds` à la planification. | **90 s** (constante de l'app) |
| `state` | `NONE`, `FAVORITE` ou `ARCHIVED` : un exercice ne peut pas être favori **et** archivé (enum plutôt que deux colonnes, pour que l'état impossible ne puisse pas s'écrire). | `NONE` |

- **Favori** : remonte en tête du catalogue et du sélecteur de planification.
- **Archivé** : disparaît du sélecteur de planification et de la liste par défaut du catalogue (un filtre permet de le revoir et de le désarchiver). L'historique l'affiche toujours.
- Le défaut **ne se met jamais à jour tout seul** quand on change le repos dans une séance (aucun calcul imposé).

### 3.7 Catalogue fourni (seed)

Un petit seed écrit à la main, **noms en anglais** (UI en anglais), sans description ni image en V1. Il doit être rejouable, comme celui des utilisateurs.

| Catégorie / profil | Exercices |
|---|---|
| `RESISTANCE` / `REPS_WEIGHT` | Bench press, Incline dumbbell press, Push-up, Dips, Pull-up, Lat pulldown, Barbell row, Seated cable row, Overhead press, Lateral raise, Face pull, Biceps curl, Hammer curl, Triceps pushdown, Back squat, Deadlift, Romanian deadlift, Leg press, Walking lunge, Leg curl, Leg extension, Hip thrust, Calf raise |
| `RESISTANCE` / `DURATION_DISTANCE` | Plank, Side plank, Farmer's walk |
| `CARDIO` / `DURATION_DISTANCE` | Running, Treadmill, Cycling, Stationary bike, Rowing machine, Elliptical, Jump rope |

33 exercices. Push-up, Dips et Pull-up se font au poids du corps (charge 0) ou lestés.

### 3.8 Stockage des métriques

**Colonnes fixes** dans `SessionSet` (`targetReps`, `targetRepsMax`, `targetWeight`, `targetDuration`, `targetDistance` et leurs `actual*`), toutes facultatives. Ajouter une métrique demande une migration, ce qui est acceptable. Écartés : une table de mesures (requêtes lourdes, typage perdu) et une colonne JSON (aucune validation).

---

## 4. Étape 1 : la séance

### 4.1 Cycle de vie

```
            ┌──────────── [Reopen] ────────────┐
            ▼                                  │
Créer ─► PLANNED ─[Start]─► IN_PROGRESS ─[Finish]─► DONE (figée)
            │                    │
         [Delete]       [Delete = abandonner]
```

| Statut | Sens | Entrée | Sortie |
|---|---|---|---|
| `PLANNED` | Brouillon de planification : tout le prévu est modifiable | création | **Start** (clic manuel) ou suppression |
| `IN_PROGRESS` | La séance se fait : on saisit le réalisé | **Start** ou **Reopen** | **Finish** ou suppression (abandon) |
| `DONE` | Terminée, **lecture seule** | **Finish** | **Reopen** seulement |
| `SKIPPED` | Réservé à l'étape 2 (séance de programme non faite) | — | — |

- **Une seule séance `IN_PROGRESS` à la fois** : *Start* et *Reopen* sont refusés (409) si une autre séance est en cours.
- **Start** renseigne `startedAt`. **Finish** renseigne `endedAt`.
- **Reopen** (`DONE` → `IN_PROGRESS`) sert à **corriger une erreur de saisie**. Il ne touche ni `startedAt` ni `endedAt` : la correction n'est pas de l'entraînement. Au *Finish* suivant, `endedAt` n'est rempli que s'il est vide.
- Les transitions sont vérifiées par l'API, jamais seulement par le front.
- La séance est **indépendante** : aucun lien vers un template ou un programme en V1.

### 4.2 Planifier (`PLANNED`)

La séance `PLANNED` sert elle-même de brouillon : chaque ajout est sauvegardé immédiatement (une route par action, §8). On ne perd rien si l'app se ferme.

**La séance**

- **Titre** (`title`) : obligatoire en base, **facultatif dans le front**. S'il est absent ou vide, **le serveur** le remplit avec un titre par défaut **en anglais** : `Workout` + la date (`scheduledDate`, sinon la date de création), par exemple « Workout Nov 27 ». Le titre est stocké : il ne change pas si la date change ensuite. Il **n'est pas unique** et ne sert qu'à l'affichage.
- **Date** (`scheduledDate`) : facultative.

**Les exercices** (`SessionExercise`)

- Choisis dans le catalogue (fournis ou perso, hors archivés), ordonnés par `position` et réordonnables.
- Pour chaque exercice :
  - **nombre de séries** : il **est** le nombre de lignes `SessionSet` (pas de colonne « nombre de séries ») ;
  - **repos** (`restSeconds`) : pré-rempli avec `UserExercise.defaultRestSeconds`, sinon 90 s ; modifiable ;
  - **consigne** (`instructions`, facultative) : « descente lente », écrite en planifiant, affichée pendant les séries.

**Les séries** (`SessionSet`) : chacune est personnalisable (7, puis 10, puis 8 reps…). Les champs dépendent du `measureType` (§3.1). Tous les objectifs sont **facultatifs**.

**Objectif de reps : valeur exacte ou fourchette**

| Saisie | `targetReps` | `targetRepsMax` |
|---|---|---|
| « exactement 6 » | 6 | vide |
| « entre 6 et 8 » | 6 | 8 |
| pas d'objectif | vide | vide |

Règle : **`targetRepsMax` n'existe pas sans `targetReps`, et `targetRepsMax > targetReps`** (strictement : « 6 à 6 » s'écrit « 6 », pour qu'une même intention n'ait qu'une seule écriture). Vérifiée par le DTO / le service **et** par une contrainte SQL `CHECK` en base (§9). L'écran propose un seul champ par défaut, et un second pour ouvrir une fourchette.

### 4.3 Faire la séance (`IN_PROGRESS`)

**Les séries** : deux états, déduits de `completedAt` : **à faire** (vide) ou **faite** (remplie).

1. Les champs du réalisé affichent l'objectif en gris (placeholder).
2. On coche la série : si aucun réalisé n'a été tapé, **l'objectif est copié dans le réalisé** (raccourci, pas un calcul). Une fourchette copie `targetReps`.
3. Si on a tapé 7 au lieu de 8, c'est 7 qui est enregistré, et l'écran met l'écart en évidence.
4. On peut décocher (`completedAt` revient à vide, le réalisé saisi reste).
5. Une **remarque par série** (`SessionSet.notes`) et un `rpe` facultatif.

Le front distingue visuellement le prévu du réalisé ; les choix de design se feront côté front, le serveur reste le même.

**Les exercices** : un statut (`SessionExercise.status`).

| Statut | Sens |
|---|---|
| `PENDING` | pas encore validé |
| `DONE` | validé : « terminé, on passe au suivant » |
| `SKIPPED` | sauté |

- « En cours » n'est pas stocké : c'est le premier `PENDING` dans l'ordre.
- En fin d'exercice : la **conclusion** (`SessionExercise.notes`), puis **valider** → `DONE`.
- **Revenir sur un exercice** est permis tant que la séance n'est pas terminée : on modifie ses séries et sa conclusion ; il reste `DONE`, ou repasse `PENDING` si on le dé-valide.
- Valider un exercice ne coche pas ses séries : une série jamais cochée reste « non faite ». C'est une information (prévu 4 séries, fait 3).

**Imprévus** : on peut **ajouter** un exercice ou une série en cours de séance, **sans objectif** (§4.4). Un exercice prévu qu'on ne fait pas est marqué `SKIPPED`, jamais supprimé : le prévu reste dans l'historique.

### 4.4 Ce qui est modifiable selon le statut

| | `PLANNED` | `IN_PROGRESS` | `DONE` |
|---|---|---|---|
| Titre, date | ✅ | ✅ | ❌ |
| Ajouter un exercice / une série | ✅ (avec objectifs) | ✅ (**sans** objectif) | ❌ |
| Réordonner les exercices | ✅ | ✅ | ❌ |
| Repos, consigne, objectifs (`target*`) | ✅ | ❌ **figés au Start** | ❌ |
| Réalisé, `rpe`, remarque de série, cocher | ❌ | ✅ | ❌ |
| Conclusion et statut d'exercice | ❌ | ✅ | ❌ |
| Ressenti (`feeling`) et notes de séance | ❌ | ✅ (écran de fin) | ❌ |
| Supprimer un exercice / une série | ✅ | ❌ (`SKIPPED` / laisser non cochée) | ❌ |
| Supprimer la séance | ✅ | ✅ (abandon, avec confirmation) | ❌ (rouvrir d'abord) |

**Pourquoi les objectifs sont figés** : si on pouvait réécrire le prévu après coup, la comparaison prévu / réalisé perdrait son sens. Si on s'est trompé, ce n'est pas grave : on s'est sous-estimé ou surestimé, et c'est justement ce qu'on veut savoir.

### 4.5 Terminer (`Finish`) et corriger (`Reopen`)

- **Finish** : écran de fin avec `feeling` (1 à 10) et `notes` de séance, facultatifs. Les exercices encore `PENDING` passent en `SKIPPED` (le front prévient avant).
- Une séance `DONE` est **figée** : aucune écriture, aucune suppression. Tout refus répond **409**.
- **Reopen** : action explicite (bouton « Corriger »), soumise à la règle « une seule séance en cours ». Après correction, on refait *Finish*.

### 4.6 Les notes

| Où | Portée | Écrite quand |
|---|---|---|
| `SessionExercise.instructions` | consigne de cet exercice dans cette séance | à la planification |
| `SessionSet.notes` | remarque sur une série | pendant la séance |
| `SessionExercise.notes` | conclusion de l'exercice | en validant l'exercice |
| `WorkoutSession.notes` | bilan de la séance (avec `feeling`) | au *Finish* |

---

## 5. Étape 2 : programmes et templates (prévue)

### 5.1 Template = moule sans chiffres

Un template (« Push ») est une **liste ordonnée d'exercices**, avec un temps de repos par exercice. Il ne porte **ni séries, ni reps, ni charge, ni note**.

On le modifie à la main. Si on veut le changer en cours de programme (par exemple à partir de la semaine 3), l'utilisateur choisit : **modifier** le template, ou en **créer une copie** utilisée à partir de cette date. Les séances passées ne sont jamais touchées.

### 5.2 Programme = la semaine type

Un programme place des templates dans la semaine (Push le lundi, Pull le mardi, Legs le mercredi). On stocke la **règle** (`ProgramSlot`), pas les occurrences : lundi prochain, l'app affiche « Push, 5 exercices » sans qu'aucune séance existe en base.

### 5.3 Planifier une occurrence

Le bouton **Planifier** sur une occurrence crée une `WorkoutSession` en `PLANNED` (titre = nom du template) et ouvre l'écran de planification du §4.2. Ensuite, le cycle de vie est celui du §4.1.

| Bouton | Disponible quand | Effet |
|---|---|---|
| *(aucun)* | toujours | saisie à la main |
| **Reprendre la dernière séance** | une séance précédente de ce template existe | pré-remplit avec les **objectifs** de la dernière fois (pas le réalisé) |
| **Surcharge progressive** | exercice `REPS_WEIGHT` dont **toutes les séries** ont atteint l'objectif haut (`targetRepsMax`, ou `targetReps` sans fourchette) | propose **+2,5 kg** (ajustable) ; les reps redescendent à `targetReps` ; pré-remplit |

Exemple : développé couché à 70 kg, 4 × 8-12, toutes les séries à 12 → le bouton apparaît → +2,5 kg proposés → l'utilisateur valide 72,5 kg → les 4 séries sont pré-remplies à 72,5 kg, objectif 8-12.

---

## 6. Données utilisées par l'étape 1

Extrait du MCD (détail dans `mcd-v1.md`) :

| Table | Rôle en V1 |
|---|---|
| `Exercise` | Catalogue fourni (`ownerId` null) et perso, `category`, `measureType` |
| `UserExercise` | Préférences : `defaultRestSeconds`, `state` (favori / archivé) |
| `WorkoutSession` | La séance : `title`, statut, date prévue, début, fin, ressenti, notes |
| `SessionExercise` | Un exercice dans la séance : position, `status`, `restSeconds`, `instructions`, conclusion (`notes`) |
| `SessionSet` | Une série : objectif (`targetReps` / `targetRepsMax`…) et réalisé, remarque, `completedAt` |

---

## 7. Décisions

### 7.1 Révision du 2026-11-27

| # | Sujet | Décision |
|---|---|---|
| D1 | Titre de séance | `WorkoutSession.title` obligatoire en base, facultatif dans le front ; titre par défaut rempli **par le serveur**, en anglais (« Workout Nov 27 ») ; non unique, affichage seulement |
| D2 | Notes de l'exercice de séance | Deux colonnes : `instructions` (planification) et `notes` (conclusion) |
| D3 | Note durable | `UserExercise.notes` **supprimée** ; `UserExercise` ne garde que les préférences hors séance |
| D4 | Repos par défaut | `UserExercise.defaultRestSeconds`, sinon 90 s ; copié dans `SessionExercise.restSeconds` |
| D5 | Favori et archivé | Enum `state` : `NONE`, `FAVORITE`, `ARCHIVED` |
| D6 | Favori et archivé, quand | **En V1** |
| D7 | Objectif de reps | `targetReps` (valeur ou bas de fourchette) + `targetRepsMax` facultatif ; `max` impossible sans `targetReps`, et `max > targetReps` ; contrainte `CHECK` en base |
| D8 | Objectifs pendant la séance | Figés au *Start* ; ajouts sans objectif possibles |
| D9 | État d'un exercice de séance | Enum `status` : `PENDING`, `DONE`, `SKIPPED` (remplace `skipped`) ; une série est faite si `completedAt` est rempli |
| D10 | Découpage du code | Trois services + une vérification partagée (§8) |
| D11 | Séance terminée | **Figée** ; réouverture explicite (`Reopen`, `DONE` → `IN_PROGRESS`) pour corriger ; pas de suppression d'une séance `DONE` |

### 7.2 Décisions du 2026-11-22 toujours valables

| Sujet | Décision |
|---|---|
| Découpage | Étape 1 séances ponctuelles, étape 2 programmes + templates |
| Calculs | Aucun calcul imposé ; seulement des propositions |
| Démarrage | Séance créée en `PLANNED`, démarrée par un clic sur **Start** |
| Template | Exercices + repos, sans objectif chiffré ni note |
| Changement de template en cours de programme | Modifier ou copier, au choix de l'utilisateur |
| « Reprendre la dernière séance » | Copie les objectifs, pas le réalisé |
| Surcharge progressive | +2,5 kg ajustable, reps remises au bas de fourchette, `REPS_WEIGHT` seulement |
| Périmètre sportif | Musculation et cardio |
| Stockage des métriques | Colonnes fixes |
| Profil de mesure | `measureType` : `REPS_WEIGHT` ou `DURATION_DISTANCE` |
| Catégorie | Gardée pour le filtre : `RESISTANCE` ou `CARDIO` |
| 0 ou vide | Charge 0 = poids du corps ; distance non applicable = vide, jamais 0 |
| Exercices personnels | Création + modification du nom ; profil figé dès qu'il a servi ; archivage au lieu de suppression |
| Seed | 33 exercices de base écrits à la main, noms en anglais |
| Nom dans l'historique | Le nom actuel de l'exercice |
| Séance en cours | Une seule `IN_PROGRESS` à la fois |
| Abandon | Suppression d'une séance non terminée |
| API | Ressources fines (une série cochée = un `PATCH`) |
| Modules Nest | `exercises` et `workout-sessions` |
| Données côté front | TanStack Query, après un premier écran fait à la main |

### 7.3 Décisions de la phase 1 (API Exercises)

| Sujet | Décision |
|---|---|
| Utilisateur connecté | Décorateur `@CurrentUserId()` |
| Protection des routes | `@UseGuards(AuthGuard)` sur chaque controller (passage à un guard global + `@Public()` encore ouvert, §10) |
| Format de réponse | À plat : les champs de l'exercice + `isOwn` + les préférences (`state`, `defaultRestSeconds`) ; `slug` et `ownerId` jamais renvoyés |

---

## 8. Architecture de l'API

### 8.1 Module `exercises`

| Route | Rôle |
|---|---|
| `GET /exercises` | Catalogue visible : fournis + les miens, avec mes préférences. Archivés exclus par défaut, inclus avec un filtre |
| `POST /exercises` | Créer un exercice perso |
| `PATCH /exercises/:id` | Modifier nom / description d'un exercice perso (profil seulement s'il n'a jamais servi) |
| `PUT /exercises/:id/preferences` | Poser `state` et `defaultRestSeconds` (upsert : PUT car idempotent, la ligne est créée ou remplacée) |

### 8.2 Module `workout-sessions`

| Ressource | Routes |
|---|---|
| Séance | `GET /sessions`, `POST /sessions`, `GET /sessions/:id` (avec exercices et séries), `PATCH /sessions/:id`, `DELETE /sessions/:id` |
| Transitions | `POST /sessions/:id/start`, `POST /sessions/:id/finish`, `POST /sessions/:id/reopen` |
| Exercice de séance | `POST /sessions/:id/exercises`, `PATCH /sessions/:id/exercises/order`, `PATCH /session-exercises/:id`, `DELETE /session-exercises/:id` |
| Série | `POST /session-exercises/:id/sets`, `PATCH /session-sets/:id`, `DELETE /session-sets/:id` |

Trois services : `WorkoutSessionsService` (séance et transitions), `SessionExercisesService`, `SessionSetsService`.

### 8.3 La vérification partagée

Toute lecture ou écriture d'une séance, d'un exercice de séance ou d'une série passe par **une seule** vérification, écrite une fois et appelée partout : « cette séance appartient-elle à l'utilisateur, et l'action est-elle permise dans son statut ? ».

| Cas | Réponse |
|---|---|
| La séance n'existe pas ou appartient à un autre | **404** (on ne révèle pas qu'elle existe) |
| L'action n'est pas permise dans ce statut (§4.4) | **409** |
| Une autre séance est déjà `IN_PROGRESS` (*Start*, *Reopen*) | **409** |
| Données invalides (DTO) | **400** |

C'est elle qui garantit « `DONE` = figée » et « objectifs figés en `IN_PROGRESS` ».

---

## 9. Migration à prévoir

Une seule migration fait passer `schema.prisma` à ce cadrage. La base ne contient que le seed, rien à perdre.

| Table | Changement |
|---|---|
| `WorkoutSession` | + `title` (texte, obligatoire, 100 caractères max côté DTO) |
| `SessionExercise` | + `restSeconds` (entier, obligatoire) ; + `instructions` (texte, facultatif) ; `skipped` → `status` (nouvel enum `SessionExerciseStatus`, défaut `PENDING`) ; `notes` = la conclusion |
| `SessionSet` | `targetRepsMin` renommée `targetReps` ; + contrainte `CHECK` : `targetRepsMax IS NULL OR (targetReps IS NOT NULL AND targetRepsMax > targetReps)` |
| `UserExercise` | − `notes` ; + `defaultRestSeconds` (entier, facultatif) ; + `state` (nouvel enum `UserExerciseState`, défaut `NONE`) |

À savoir :
- Prisma ne sait pas déclarer un `CHECK` : on génère la migration avec `--create-only`, on ajoute la contrainte à la main dans le SQL, puis on l'applique.
- Pour un renommage, Prisma génère « supprimer + ajouter » ; dans le même SQL, on le remplace par un `RENAME COLUMN` (sans effet ici faute de données, mais c'est la bonne habitude).

Côté code existant : `ExerciseView` perd `note` et gagne `state` et `defaultRestSeconds` ; `findAll` lit ces deux colonnes dans `userPreferences`.

---

## 10. Points ouverts

### Avant ou pendant le code de l'étape 1

1. **Exercice d'un autre ou exercice fourni** (`PATCH /exercises/:id`) : 404 pour l'exercice d'un autre (comme les séances), 403 pour un exercice fourni ?
2. **Guard** : garder `@UseGuards(AuthGuard)` par controller, ou passer à un guard global (`APP_GUARD`) avec un décorateur `@Public()` pour le login (recommandé au début de la phase 2) ?
3. **Nombre de séries à l'ajout d'un exercice** : `POST /sessions/:id/exercises` crée-t-il directement N séries vides (N envoyé par le front, 3 par défaut) ? Recommandé : oui, en une requête.
4. **Repos réel** : `SessionSet.startedAt` par série (précis) ou approximation entre deux validations. Après la V1 (va avec le minuteur).

### Pour l'étape 2

5. **Retrouver la séance précédente** après une copie de template : par créneau de programme (`programSlotId`), ou en reliant la copie à l'original ?
6. **Séance manquée** : calculée seulement, ou marquable (`SKIPPED`) ?
7. **Plusieurs programmes actifs** en même temps ?
