---
description: 'Affiche les tâches ouvertes de la todolist globale (~/.claude/todos.md), triées par priorité et deadline.'
argument-hint: '[filtre optionnel : P0|P1|P2|P3 | #tag | mot-clé]'
allowed-tools: ['Bash', 'Read']
---

# /todos — Afficher les tâches à faire

Tu vas lire la todolist du projet (`.claude/todos.md`) et présenter les tâches **ouvertes**, triées de la plus urgente à la moins urgente.

Cette commande est **en lecture seule**.

## Argument optionnel

`$ARGUMENTS` peut contenir un filtre :

- `P0`, `P1`, `P2`, `P3` → ne garde que cette priorité.
- `#tag` ou `tag` → ne garde que les tâches contenant ce tag.
- Mot-clé libre → match insensible à la casse sur la description et le contexte.
- Vide → toutes les tâches ouvertes.

Si l'argument matche un pattern priorité (`^P[0-3]$`), c'est un filtre priorité. S'il commence par `#`, c'est un filtre tag. Sinon, c'est un mot-clé libre (qui peut quand même matcher un tag, parce que les tags sont dans le texte de la ligne).

## Étapes

### 1. Vérifie le fichier

- Si `~/.claude/todos.md` n'existe pas : dis-le, suggère `/todo <description>` pour créer la première tâche, et termine.
- Sinon, lis-le.

### 2. Extrait les tâches ouvertes

Parse la section `## Ouvertes`. Chaque tâche est une ligne commençant par `- [ ]`. Format attendu :

```
- [ ] **[P1]** `#xiaotrack #web` Refacto sidebar collapse — `due:2026-06-01` · _contexte_
```

Pour chaque ligne, extrais :

- **Priorité** : entre `**[...]**`
- **Tags** : tokens `#xxx` dans les backticks
- **Description** : texte entre les backticks de tags et le ` — ` ou ` · `
- **Deadline** : `due:YYYY-MM-DD` si présent
- **Contexte** : ce qui suit ` · ` en italique

### 3. Applique le filtre

- Si `$ARGUMENTS` est une priorité : garde uniquement les lignes avec cette priorité.
- Si `$ARGUMENTS` commence par `#` ou matche un tag connu : garde uniquement les lignes contenant ce tag.
- Sinon, match insensible à la casse sur **toute la ligne**.
- Si rien ne matche : dis-le explicitement et liste les filtres possibles vus dans le fichier (priorités présentes, tags présents).

### 4. Trie

Ordre de tri :

1. **Priorité ascendante** : P0 d'abord, puis P1, P2, P3.
2. **À priorité égale, deadline ascendante** : les plus proches en premier. Les tâches sans deadline en dernier dans leur groupe.
3. **À priorité et deadline égales** : ordre d'apparition dans le fichier (donc plus ancien d'abord).

### 5. Calcule le statut deadline

Pour chaque tâche avec deadline, compare à la date du jour (`date +%Y-%m-%d`) :

- **🔴 en retard** : deadline strictement antérieure à aujourd'hui
- **🟠 aujourd'hui** : deadline = aujourd'hui
- **🟡 dans la semaine** : deadline ≤ aujourd'hui + 7 jours
- **🟢 plus tard** : deadline > aujourd'hui + 7 jours

### 6. Présente le résultat

Format de réponse, en français :

```
# Todos — <N> tâche(s) ouverte(s)<si filtre, ajouter " (filtre: <filtre>)">

## 🔴 En retard

- **[P1]** `#xiaotrack` Description — due 2026-05-20 (6 j de retard) · _contexte_

## 🟠 Aujourd'hui

- **[P0]** `#api` Description — due 2026-05-26 · _contexte_

## 🟡 Cette semaine

- **[P1]** ... — due 2026-05-29 (dans 3 j)

## 🟢 Plus tard / Sans deadline

- **[P2]** `#perso` Description (pas de deadline) · _contexte_
```

Règles d'affichage :

- **Omet** une section si elle est vide (par exemple, pas de section « En retard » s'il n'y a rien en retard).
- **Calcule** le nombre de jours restants/en retard à partir de la date du jour.
- **N'affiche pas** la section « Résolues » (`/todos` ne montre que l'ouvert).
- Si **aucune tâche** après filtre, dis-le simplement avec une ligne — pas de structure vide.

### 7. Ligne de pied

Après la liste, ajoute une ligne courte :

- Si > 0 tâche en retard : « X tâche(s) en retard — peut-être commencer par là ? »
- Sinon si > 0 tâche P0 : « X tâche(s) P0 ouverte(s). »
- Sinon : pas de pied de page.

## Règles

- **Lecture seule.** Tu ne modifies pas `~/.claude/todos.md`.
- **Pas de paraphrase.** Reste fidèle au contenu des entrées (description, contexte). Tu peux abréger un contexte très long, mais sans le déformer.
- **Pas d'invention.** Si une tâche n'a pas de contexte, ne lui en invente pas un.
