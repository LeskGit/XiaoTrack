---
description: 'Ajoute une tâche à la todolist globale (~/.claude/todos.md). Format riche : priorité, tag, deadline, contexte.'
argument-hint: '<description> [P0|P1|P2|P3] [#tag] [due:YYYY-MM-DD] [-- contexte]'
allowed-tools: ['Bash', 'Read', 'Write', 'Edit']
---

# /todo — Ajouter une tâche

Tu vas ajouter une nouvelle tâche à la todolist du projet en, cours située dans `.claude/todos.md` (racine projet).

## Argument

`$ARGUMENTS` contient la description de la tâche, éventuellement enrichie de marqueurs :

- **Priorité** : un token parmi `P0`, `P1`, `P2`, `P3` (n'importe où dans le texte)
  - `P0` = critique / bloquant
  - `P1` = important / cette semaine
  - `P2` = nice to have / quand il y a le temps
  - `P3` = idée / à reconsidérer plus tard
- **Tag** : un token `#tag` (ex: `#xiaotrack`, `#web`, `#api`, `#perso`)
- **Deadline** : `due:YYYY-MM-DD` ou expression naturelle (« demain », « lundi », « dans 2 semaines ») — convertis-la en date ISO
- **Contexte** : tout ce qui suit `--` est considéré comme contexte explicatif (1 ligne)

Si `$ARGUMENTS` est vide, dis-le à l'utilisateur, donne un exemple d'usage et termine.

## Étapes

### 1. Parse l'argument

Extrais dans cet ordre :

1. **Priorité.** Cherche le pattern `\b(P[0-3])\b` dans `$ARGUMENTS`. Retire-le de la description.
2. **Tag.** Cherche `#(\w+)`. Retire le marqueur, garde le mot. Si plusieurs tags, garde-les tous.
3. **Deadline.** Cherche `due:(\S+)` ou des expressions naturelles courantes ; convertis en `YYYY-MM-DD` via `date` shell si besoin. Retire la mention de la description.
4. **Contexte.** Sépare sur `--` (s'il y en a un). Ce qui est avant = description ; ce qui est après = contexte.
5. **Description.** Ce qui reste, trimmé.

### 2. Défauts intelligents

- **Si pas de priorité fournie** : par défaut `P2`. Mentionne le défaut dans le rapport final pour que l'utilisateur puisse corriger si besoin.
- **Si pas de tag** : essaye de déduire un tag depuis le repo courant via `git rev-parse --show-toplevel | xargs basename`. Si ça échoue (pas de git), pas de tag.
- **Si pas de deadline** : aucune deadline, c'est optionnel.
- **Si pas de contexte** : aucun, c'est optionnel.

### 3. Prépare le fichier si besoin

- Si `~/.claude/todos.md` n'existe pas, crée-le avec cette structure :

  ```markdown
  # Todos

  Todolist globale tous projets confondus. Gérée par `/todo` (ajout), `/todos` (lecture), `/resolve` (résolution).

  ## Ouvertes

  ## Résolues

  ```

- Si le fichier existe, vérifie qu'il contient bien les sections `## Ouvertes` et `## Résolues`. Ajoute-les si manquantes.

### 4. Ajoute la tâche

Format strict d'une entrée (une seule ligne markdown) :

```
- [ ] **[P1]** `#xiaotrack #web` Refacto sidebar collapse — `due:2026-06-01` · _Décidé en session du 26/05_
```

Règles :

- **Priorité** entre `**[...]**` (gras + crochets).
- **Tags** entre backticks, préfixés par `#`, séparés par espace s'il y en a plusieurs.
- **Description** en clair (ce qui reste après parsing).
- **Deadline** entre backticks au format `due:YYYY-MM-DD`, séparée par ` — ` (em dash espacé).
- **Contexte** en italique, séparé par ` · ` (middle dot espacé). Une seule ligne, pas de retour à la ligne.

Append la tâche **à la fin de la section `## Ouvertes`** (avant la section `## Résolues`).

### 5. Rapporte

Réponds en français, court :

- Confirme l'ajout, en re-citant la ligne créée telle qu'elle est dans le fichier.
- Si tu as appliqué un défaut (priorité P2 par défaut, tag déduit du repo), mentionne-le.
- Si la deadline parsée diffère de ce que l'utilisateur a écrit (ex: « lundi » → date), confirme la date résolue.

## Règles

- **Une tâche = une ligne.** Pas de retour à la ligne dans une entrée, sinon `/todos` et `/resolve` se cassent.
- **Pas de doublon silencieux.** Avant d'ajouter, regarde rapidement si une tâche très similaire existe déjà dans `## Ouvertes` (match approximatif sur la description). Si oui, demande à l'utilisateur s'il veut quand même l'ajouter ou s'il pensait à celle qui existe déjà.
- **Anonymise les secrets.** Pas de clé / token / mot de passe dans la description ou le contexte.
- **Une seule entrée par appel.** Si l'utilisateur veut ajouter plusieurs tâches d'un coup, demande-lui de relancer `/todo` pour chacune (ou propose de le faire toi-même en plusieurs appels successifs).
