---
description: 'Marque une tâche comme terminée et la déplace dans la section "Résolues" de ~/.claude/todos.md.'
argument-hint: '<mot-clé identifiant la tâche>'
allowed-tools: ['Bash', 'Read', 'Write', 'Edit']
---

# /resolve — Résoudre une tâche

Tu vas marquer une tâche **ouverte** du projet en cours de `.claude/todos.md` comme terminée, et la déplacer dans la section `## Résolues` avec la date du jour.

## Argument

`$ARGUMENTS` contient le **texte identifiant la tâche à résoudre**. Ce n'est pas forcément la description exacte — un mot-clé ou un fragment suffit, du moment qu'il identifie une tâche unique.

Si `$ARGUMENTS` est vide : dis-le, donne un exemple d'usage (`/resolve refacto sidebar`), et termine.

## Étapes

### 1. Vérifie le fichier

- Si `~/.claude/todos.md` n'existe pas : dis-le et termine, suggère `/todo` pour créer la première tâche.
- Sinon, lis-le.

### 2. Match dans la section `## Ouvertes`

Cherche dans les lignes `- [ ]` de la section `## Ouvertes` les entrées dont le texte contient `$ARGUMENTS` (match **insensible à la casse**, sur toute la ligne — description, contexte, tags, priorité).

Trois cas :

#### Cas A — 1 seul match

Procède directement à l'étape 3.

#### Cas B — 0 match

Dis à l'utilisateur que rien ne correspond. Liste les 5 premières tâches ouvertes (ou toutes si moins de 5) pour qu'il puisse cibler autrement. Termine sans rien modifier.

#### Cas C — Plusieurs matches

Liste les tâches qui matchent (avec leur priorité et leur description courte). Demande à l'utilisateur de préciser (par exemple en relançant `/resolve` avec un mot-clé plus spécifique). Termine sans rien modifier.

### 3. Marque comme résolue

Sur la ligne identifiée :

1. Remplace `- [ ]` par `- [x]`.
2. Ajoute en **fin de ligne** la mention `*done:YYYY-MM-DD*` (avec la date du jour), séparée par ` · ` du contexte si présent, sinon directement après la description / deadline.

Format final attendu :

```
- [x] **[P1]** `#xiaotrack #web` Refacto sidebar collapse — `due:2026-06-01` · _contexte_ · *done:2026-05-26*
```

### 4. Déplace dans `## Résolues`

- **Retire** la ligne de la section `## Ouvertes`.
- **Append** la ligne à la fin de la section `## Résolues` (créée si elle n'existe pas).

### 5. Rapporte

Réponds en français, court :

- Confirme la résolution en citant la tâche résolue.
- Si la tâche avait une deadline future qui devient sans objet, signale-le brièvement.
- Si la tâche avait une deadline déjà dépassée, signale-le aussi (« résolue en retard de X jours »).
- Optionnellement, glisse une remarque si le rythme de résolution est notable (3 tâches résolues dans la session par exemple) — mais discrètement, pas systématiquement.

## Règles

- **Pas de suppression.** Une tâche résolue n'est **jamais** supprimée — elle est archivée dans `## Résolues`. C'est utile pour l'historique et pour `/never-forget`.
- **Pas de modification du texte original.** Garde la description, le tag, le contexte, la deadline tels qu'ils étaient. Tu n'ajoutes que la coche, la date `*done:*`, et tu déplaces la ligne.
- **Pas d'ambiguïté.** Ne devine **jamais** quelle tâche résoudre quand plusieurs matchent. Demande toujours.
- **Une seule tâche par appel.** Si l'utilisateur veut résoudre plusieurs tâches d'un coup, qu'il relance `/resolve` plusieurs fois (ou demande-lui d'enchaîner).
