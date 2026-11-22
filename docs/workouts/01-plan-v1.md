# Workouts — Plan de développement, étape 1 (séances libres)

> **Pour qui** : toi, clavier en main. **Spec de référence** : [`00-cadrage-v1.md`](00-cadrage-v1.md) (les renvois `§` pointent vers lui). **Modèle** : [`mcd-v1.md`](mcd-v1.md).
> **Point de départ** : le code au 2026-11-22 (auth terminée, `pages/Workouts.tsx` vide, aucune table Workouts).
> **Règle d'or** : chaque étape laisse une app **qui compile et qui tourne**. Ne passe à l'étape suivante que quand le « Terminé quand » est vrai. Un commit par étape.
> **Pas de corrigé** : chaque étape dit *quoi* faire, *où*, *quel piège* éviter et *comment savoir que c'est fini*. Le *comment* est à toi.

---

## Vue d'ensemble

```
PHASE 0 ─ Base de données       enums + 5 modèles, migration, seed des 33 exercices
   │
PHASE 1 ─ API Exercises         lister (fournis + les miens), créer, modifier
   │
PHASE 2 ─ API Sessions          CRUD, start / finish, exercices et séries
   │
PHASE 3 ─ Front : liste         page Workouts, liste des séances, création   (écran fait à la main)
   │
PHASE 4 ─ Front : séance        TanStack Query, préparation, saisie en cours, fin
   │
PHASE 5 ─ Front : exercices     exercices perso, note durable
   │
PHASE 6 ─ Recette               scénario complet de bout en bout
```

Les phases 1 et 2 se testent sans front (requêtes HTTP à la main ou tests Jest). Le front ne commence qu'avec une API qui marche.

---

## Décisions techniques (2026-11-22)

| Sujet | Décision |
|---|---|
| Forme de l'API | Ressources fines : une action = une petite requête (valider une série = un `PATCH`) |
| Modules Nest | `exercises/` et `workout-sessions/`, sur le modèle d'`auth/` et `users/` |
| Sécurité | Chaque requête est filtrée par l'utilisateur du token (`req.user.sub`). Un id reçu du front n'est jamais utilisé sans vérifier qu'il appartient à l'utilisateur |
| Transitions de statut | Vérifiées dans le service (`planned` → `in_progress` → `done`), refus en 409 sinon |
| Données côté front | Phase 3 à la main (`useEffect` + `request`), puis TanStack Query à partir de la phase 4 |

---

## Phase 0 — Base de données

### 0.1 Les enums et les modèles

- **Quoi** : dans `apps/api/prisma/schema.prisma`, les enums `ExerciseCategory`, `MeasureType`, `SessionStatus`, et les modèles `Exercise`, `UserExercise`, `WorkoutSession`, `SessionExercise`, `SessionSet` (colonnes : `mcd-v1.md`). On ne crée **que** les tables de l'étape 1 : pas de `Template`, `Program`, `Tag`, `BodyPart`. `templateId` et `programSlotId` attendront l'étape 2 (une migration les ajoutera).
- **Pièges** :
  - Même conventions que `User` : `@map` / `@@map` en snake_case, UUID générés par Postgres, `Timestamptz`.
  - Les relations inverses (`User.exercises`, `User.workoutSessions`…) sont obligatoires côté Prisma.
  - Les règles de suppression (`onDelete`) et la clé du seed : voir les choix de la phase 0 ci-dessous.
- **Terminé quand** : `npx prisma validate` passe.

### 0.2 La migration

- **Quoi** : `npx prisma migrate dev --name add_workouts_step1`, puis `npx prisma generate`.
- **Piège** : Prisma 7 ne lance plus `generate` ni le seed tout seul.
- **Terminé quand** : les 5 tables existent dans DBeaver, et `npm run build` passe dans `apps/api`.

### 0.3 Le seed des exercices

- **Quoi** : dans `prisma/seed.ts`, les 33 exercices du §3.6, à côté des utilisateurs.
- **Piège** : le seed doit être **rejouable** (le lancer deux fois ne crée pas de doublons), comme `upsertUser`.
- **Terminé quand** : `npx prisma db seed` lancé deux fois donne 33 lignes dans `exercises`.

---

## Phase 1 — API Exercises

### 1.1 Le module

- **Quoi** : `src/exercises/` avec `exercises.module.ts`, `exercises.controller.ts`, `exercises.service.ts`, `dto/`. Le module est importé dans `AppModule`. Toutes les routes passent par `AuthGuard`.

### 1.2 Lister

- **Quoi** : `GET /exercises` renvoie les exercices fournis (`ownerId` null) **et** ceux de l'utilisateur, avec sa note (`UserExercise.notes`) si elle existe.
- **Piège** : ne jamais renvoyer les exercices perso d'un autre utilisateur.
- **Terminé quand** : connecté en Test, tu vois les 33 exercices ; après la 1.3, tu vois aussi les tiens, et pas ceux d'Admin.

### 1.3 Créer

- **Quoi** : `POST /exercises` avec un DTO validé (nom obligatoire, `category` et `measureType` parmi les valeurs de l'enum, description facultative). `ownerId` vient du token, **jamais du body**.
- **Terminé quand** : un body avec `ownerId` est refusé (400, `forbidNonWhitelisted`) ; un exercice créé apparaît dans la liste.

### 1.4 Modifier

- **Quoi** : `PATCH /exercises/:id` pour le nom et la description. Le profil de mesure ne change que si l'exercice n'a jamais servi dans une séance (§3.5).
- **Pièges** : un exercice fourni ou celui d'un autre utilisateur → refus. Choisir entre 403 et 404 (un 404 ne révèle pas que l'exercice existe).
- **Terminé quand** : modifier son exercice marche, modifier un exercice fourni est refusé.

### 1.5 La note durable

- **Quoi** : `PUT /exercises/:id/note` crée ou met à jour la ligne `UserExercise` de l'utilisateur.
- **Piège** : marche aussi sur un exercice **fourni** : la note est à l'utilisateur, pas à l'exercice.

---

## Phase 2 — API Sessions

### 2.1 Le module et le CRUD

- **Quoi** : `src/workout-sessions/`. `POST /sessions` (créée en `planned`, `scheduledDate` facultative), `GET /sessions` (les miennes, les plus récentes d'abord), `GET /sessions/:id` (avec exercices et séries, triés par `position`), `PATCH /sessions/:id` (date, ressenti, notes), `DELETE /sessions/:id`.
- **Piège** : `DELETE` refusé si la séance est `done` (§4.4).

### 2.2 Les transitions

- **Quoi** : `POST /sessions/:id/start` (`planned` → `in_progress`, `startedAt`) et `POST /sessions/:id/finish` (`in_progress` → `done`, `endedAt`).
- **Pièges** : start refusé (409) si une autre séance est déjà `in_progress`. Une transition interdite (finir une séance `planned`) → 409.
- **Terminé quand** : chaque transition interdite renvoie 409 ; tu as un test Jest par règle.

### 2.3 Les exercices de la séance

- **Quoi** : ajouter un exercice (`position` = à la fin), le retirer, le marquer `skipped`.
- **Piège** : l'exercice ajouté doit être visible par l'utilisateur (fourni ou à lui).

### 2.4 Les séries

- **Quoi** : ajouter une série, la modifier (`target*` en préparation, `actual*` + `rpe` + `completedAt` en séance), la supprimer.
- **Pièges** :
  - Une valeur doit correspondre au profil de l'exercice (pas de distance sur un développé couché).
  - Distance non applicable = `null`, jamais 0 (§3.3).
  - La charge en `Decimal` : vérifier comment elle sort en JSON (voir les choix de la phase 0).
- **Terminé quand** : le scénario complet (créer, ajouter 2 exercices, 3 séries chacun, start, valider, finish) marche en requêtes HTTP.

---

## Phase 3 — Front : la liste des séances (à la main)

- **Quoi** : `shared/api/workouts.api.ts` et ses types, la page `Workouts` avec la liste des séances (date, statut, nombre d'exercices) et un bouton « New session ».
- **Méthode** : `useEffect` + `request` + `useState` pour `loading` / `error` / `data`. Les erreurs passent par `getErrorMessage` / `reportError` (conventions §7.6).
- **But pédagogique** : sentir ce qui est pénible (états de chargement, rafraîchir la liste après une création, requête annulée quand on quitte la page) avant la phase 4.
- **Terminé quand** : créer une séance l'ajoute à la liste sans recharger la page.

## Phase 4 — Front : l'écran de séance (TanStack Query)

- **Quoi** : installer TanStack Query, refaire la liste de la phase 3 avec, puis l'écran d'une séance : préparation en `planned` (choisir les exercices, ajouter les séries), *Start session*, saisie du réalisé série par série, fin de séance (ressenti, notes).
- **Pièges** : les champs affichés dépendent du `measureType` ; chaque validation de série est enregistrée tout de suite (une coupure réseau ne perd rien).
- **Terminé quand** : le scénario du cadrage §4.1 se fait entièrement dans l'app.

## Phase 5 — Front : exercices perso et note durable

- **Quoi** : créer et modifier un exercice perso depuis le sélecteur d'exercices ; afficher et modifier la note durable sur un exercice.

## Phase 6 — Recette

Le scénario du cadrage de bout en bout, avec deux utilisateurs pour vérifier qu'aucun ne voit les données de l'autre.

---

## Choix de la phase 0 (2026-11-22)

1. **Clé du seed** : colonne `slug String? @unique` (`"bench-press"`), remplie pour les exercices fournis, vide pour les exercices perso. Le seed fait un `upsert` par `slug`.
2. **Type de la charge** : `Decimal(6,2)`. Prisma le renvoie comme un objet `Decimal`, sérialisé **en texte** dans le JSON : l'API le convertit en nombre à un seul endroit.
3. **Suppressions** : séance → exercices → séries en `Cascade` ; exercice utilisé dans une séance en `Restrict` ; utilisateur → ses séances, exercices et notes en `Cascade`.

Côté réalisation : le serveur (phases 0 à 2) est codé par toi ; la façon de faire le client (phases 3 à 5) se décidera ensuite.
