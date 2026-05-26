---
description: 'Sauvegarde un résumé structuré de la session (décisions + avancées + TODOs) dans la mémoire du projet courant'
argument-hint: '[focus optionnel — ex: "auth", "refacto sidebar"]'
allowed-tools: ['Bash', 'Read', 'Write', 'Edit', 'Glob']
---

# /never-forget — Sauvegarde mémoire projet

Tu vas archiver les éléments importants de **cette session** dans la mémoire du projet courant. Procède dans l'ordre suivant, sans demander confirmation à chaque étape — exécute, puis rapporte ce que tu as fait.

## Argument optionnel

`$ARGUMENTS` peut contenir un **focus** pour recentrer le résumé sur un sujet précis. S'il est vide, résume tout ce qui est significatif dans la session.

## Étapes

### 1. Détecte la racine du projet

Trouve le dossier racine via :

```bash
git rev-parse --show-toplevel 2>/dev/null || pwd
```

Toutes les opérations suivantes se font à partir de ce dossier (appelé `<ROOT>` dans la suite).

### 2. Prépare le dossier de mémoire

- Si `<ROOT>/.claude/memory/` n'existe pas, crée-le.
- Si `<ROOT>/.claude/memory/session-log.md` n'existe pas, crée-le avec un en-tête :
  ```
  # Session log — <nom du projet déduit du dossier ou du package.json>

  Mémoire append-only des sessions Claude. Géré par la commande `/never-forget`, relu par `/remember`.
  ```
- **Note** : c'est la première fois que `/never-forget` est utilisé dans ce projet si tu viens de créer le dossier. Garde cette info pour l'étape 5.

### 3. Lis le log existant (s'il y en a un)

Lis `<ROOT>/.claude/memory/session-log.md` pour ne pas dupliquer des décisions déjà archivées. Si une décision actuelle confirme/contredit/raffine une décision passée, **mentionne-le explicitement** dans la nouvelle entrée plutôt que de la réécrire.

### 4. Analyse la session courante et structure le résumé

Parcours la conversation depuis le début. Extrait **uniquement ce qui mérite d'être retenu** sur la durée — pas les micro-échanges, pas le bruit.

Classe les éléments en trois catégories :

- **Décisions** — choix techniques, architecturaux, produit, qui engagent le projet au-delà de cette session. Pour chaque décision : *contexte → choix → raison → conséquences*.
- **Avancées** — ce qui a été fait concrètement (features ajoutées, code écrit, refactos, fichiers créés/modifiés, bugs corrigés). Liste factuelle.
- **TODOs / Suites** — ce qui reste à faire, les blocages connus, les questions ouvertes à reprendre la prochaine fois.

Si `$ARGUMENTS` est non vide, **filtre** : ne garde que ce qui touche au focus mentionné.

Si une catégorie est vide pour cette session, écris « *(rien à signaler)* » plutôt que de l'omettre — la structure reste lisible dans le temps.

### 5. Append au log

Ajoute à la fin de `<ROOT>/.claude/memory/session-log.md` une nouvelle section, format strict :

```
---

## YYYY-MM-DD — Session [focus si fourni, sinon "générale"]

### Décisions

- **[titre court]** — contexte / choix / raison / conséquences.
- ...

### Avancées

- [fait factuel, avec chemin de fichier si pertinent]
- ...

### TODOs / Suites

- [ ] [tâche ou question ouverte]
- ...
```

Utilise la date du jour (format `YYYY-MM-DD`, obtenue via `date +%Y-%m-%d` si besoin).

### 6. Première utilisation : référence dans le CLAUDE.md

**Uniquement si** c'est la première fois que `/never-forget` tourne dans ce projet (étape 2 a créé le dossier) :

- Si `<ROOT>/CLAUDE.md` existe, vérifie qu'il ne contient pas déjà de référence à `.claude/memory/`. Sinon, ajoute en fin de fichier une section :

  ```
  ## Mémoire de session

  La mémoire des sessions Claude est archivée dans `.claude/memory/session-log.md` (écrite par `/never-forget`, relue par `/remember`). Au début d'une nouvelle session sur ce projet, lance `/remember` pour récupérer le contexte des décisions, avancées et TODOs antérieurs.
  ```

- Si `<ROOT>/CLAUDE.md` n'existe pas, **ne le crée pas** automatiquement — signale-le à l'utilisateur dans le rapport final ; il choisira.

### 7. Rapporte

Réponds en français, court et factuel :

- Combien de décisions / avancées / TODOs tu as archivés.
- Chemin du fichier mis à jour.
- Si c'est la première utilisation ici : confirme l'ajout (ou la non-création) dans `CLAUDE.md`.
- Si tu as détecté un conflit avec une décision passée du log, signale-le.

## Règles

- **Ne réécris jamais** les sections précédentes du log — append-only.
- **Pas de remplissage.** Si une session a peu de matière, l'entrée est courte. Mieux vaut une entrée maigre et honnête qu'un résumé gonflé.
- **Pas d'invention.** Si une décision n'a pas été clairement prise (juste évoquée), ne la classe pas en « Décision » — mets-la en TODO sous forme de question ouverte.
- **Anonymise les secrets.** Si la conversation contient des clés, tokens, mots de passe, ne les écris jamais dans le log — note simplement « secret/credential configuré » sans la valeur.
