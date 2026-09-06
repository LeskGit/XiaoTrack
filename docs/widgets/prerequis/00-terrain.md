# Fiche 0 — Préparer le terrain

> **Taille** : courte · **Dépend de** : rien · **Débloque** : la fiche 3, qui a besoin de vérifier une fonction pure sans navigateur.

## Pourquoi tu en as besoin

L'algorithme de grille est le morceau le plus risqué du moteur. Il ne se débogue pas à la souris : quand une cascade de poussées produit un résultat bizarre, tu ne peux ni figer l'état, ni rejouer le cas, ni isoler la ligne fautive. Tu peux en revanche l'appeler avec des entrées précises et comparer la sortie à ce que tu attends. C'est ce que fait un test.

`apps/web` n'a aucun outillage de test aujourd'hui. `apps/api` a Jest (configuré en ligne dans son `package.json`), mais il ne couvre pas le front.

---

## 1. Ce que fait un runner de tests

Trois choses, pas plus :

1. **Trouver** les fichiers de test (par convention : `*.test.ts`, `*.spec.ts`).
2. **Exécuter** ce qu'ils contiennent.
3. **Rapporter** : ce qui est passé, ce qui a échoué, et *pourquoi*.

Le reste — le watch mode, la couverture, les rapports — est du confort.

Un test, c'est une fonction avec un nom et une assertion :

```ts
import { describe, it, expect } from "vitest";

describe("addition", () => {
  it("additionne deux entiers", () => {
    expect(2 + 3).toBe(5);
  });
});
```

`describe` regroupe, `it` décrit un comportement attendu, `expect` vérifie. C'est tout le vocabulaire dont tu as besoin pour la fiche 3.

## 2. Pourquoi Vitest et pas Jest ici

Ton front est un projet Vite avec du TypeScript, un alias `@/`, et des imports `?react` traités par un plugin. Jest ne sait rien de tout ça : il faudrait lui apprendre à transpiler le TS, à résoudre l'alias, et à ignorer les SVG.

Vitest lit **ton `vite.config.ts` existant**. L'alias, le TS, les plugins : il hérite de la configuration que tu as déjà écrite. C'est la seule raison de le préférer ici, et elle suffit.

(`apps/api` garde Jest. Deux runners dans un monorepo, ce n'est pas un problème : chaque workspace a le sien, et il n'y a pas de script `test` à la racine.)

## 3. Échouer lisiblement

Un test qui passe ne t'apprend rien. Un test qui échoue doit te dire **quoi** était attendu et **quoi** a été reçu :

```
AssertionError: expected 6 to be 5
  - Expected: 5
  + Received: 6
```

Distingue bien deux cas :

- **Échec** : l'assertion est fausse. Ton code tourne, il donne le mauvais résultat.
- **Erreur** : le code a levé une exception avant d'arriver à l'assertion. Souvent un import cassé ou un `undefined` déréférencé.

Le second est plus grave et plus fréquent au début. Quand tu le vois, ne regarde pas l'assertion — regarde la pile d'appel.

---

## Exercices

### Exercice 1 — Installer et faire tourner

Installer Vitest dans `apps/web`, ajouter un script `test` dans son `package.json`, et écrire un fichier de test contenant une assertion triviale qui passe.

**Attendu** : `npm test -w apps/web` (ou depuis `apps/web`) affiche un test vert.

### Exercice 2 — Voir un échec

Casser volontairement l'assertion. Lire la sortie.

**Attendu** : tu peux dire, sans deviner, quelle ligne a échoué, ce qui était attendu et ce qui a été reçu.

### Exercice 3 — Vérifier l'alias

Créer un fichier quelconque sous `src/`, l'importer dans un test **via l'alias `@/`**, et tester une valeur qu'il exporte.

```ts
// le test doit pouvoir écrire ceci et non un chemin relatif
import { quelqueChose } from "@/lib/quelque-chose";
```

**Attendu** : le test passe. Si l'import échoue, c'est la configuration qu'il faut corriger — pas le test.

### Exercice 4 — Watch mode

Lancer les tests en mode surveillance, modifier le fichier source, et observer la ré-exécution automatique.

**Attendu** : tu sais lancer les tests des deux façons, et tu sais laquelle utiliser pendant que tu codes.

---

## Réussi quand

- Un test vert s'affiche depuis `apps/web`.
- Un test rouge produit un message que tu sais lire.
- Un import via `@/` fonctionne **dans un test**.

---

## Les pièges

**L'alias qui ne suit pas.** C'est le seul vrai risque de cette fiche. Si Vitest ne résout pas `@/`, tu le découvriras à la fiche 3 en important ton algorithme — et tu croiras que ton code est cassé alors que c'est la résolution de module. D'où l'exercice 3 : vérifie-le maintenant, sur un fichier dont tu es sûr.

**Confondre l'échec et l'erreur.** Un `Cannot read properties of undefined` n'est pas un test qui échoue, c'est un test qui n'a pas pu s'exécuter. Chercher le bug dans l'assertion est une perte de temps.

**Vouloir tout tester.** Tu n'installes pas Vitest pour tester tes composants — c'est explicitement hors périmètre (voir la fin de `02-prerequis.md`). Tu l'installes pour une seule chose : vérifier des fonctions pures. Tout le reste peut attendre des mois.

---

## Remarque

Cette fiche est courte et il est tentant de la sauter en se disant qu'on testera « quand il y aura quelque chose à tester ». C'est justement l'inverse : la fiche 3 se code *avec* les tests, pas avant. Sans le terrain prêt, tu écriras l'algorithme dans un composant et tu le débogueras à la souris — ce qui est exactement ce que ce document existe pour éviter.
