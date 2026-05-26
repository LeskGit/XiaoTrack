---
description: 'Recharge le contexte des sessions précédentes depuis la mémoire du projet courant (TODOs ouverts, dernières décisions, dernières avancées)'
argument-hint: '[focus optionnel — ex: "auth"] ou [nombre de sessions à lire, ex: "5"]'
allowed-tools: ['Bash', 'Read', 'Glob']
---

# /remember — Recharge mémoire projet

Tu vas relire la mémoire du projet courant et présenter à l'utilisateur le **contexte utile pour reprendre le travail** : les TODOs encore ouverts, les décisions structurantes récentes, et les dernières avancées.

Cette commande est **en lecture seule** — tu n'écris rien dans le log. La commande compagnon `/never-forget` se charge de l'écriture.

## Argument optionnel

`$ARGUMENTS` peut contenir :

- **Un nombre entier** (ex: `5`) → lis les **N dernières sessions** au lieu de la valeur par défaut (3).
- **Un mot-clé / focus** (ex: `auth`, `sidebar`) → filtre toutes les entrées du log sur ce sujet, en lisant **tout l'historique** sans limite de sessions.
- **Vide** → comportement par défaut : 3 dernières sessions.

Détecte le type d'argument simplement : si `$ARGUMENTS` est un entier pur, c'est un nombre ; sinon, c'est un focus.

## Étapes

### 1. Détecte la racine du projet

```bash
git rev-parse --show-toplevel 2>/dev/null || pwd
```

Soit `<ROOT>` ce dossier.

### 2. Vérifie l'existence du log

- Si `<ROOT>/.claude/memory/session-log.md` n'existe pas : dis-le à l'utilisateur, suggère `/never-forget` pour créer la première entrée, et termine. Ne crée rien.
- Sinon, lis le fichier entier.

### 3. Parse les sessions

Chaque session du log commence par `## YYYY-MM-DD — Session ...` (séparées par `---`). Identifie-les dans l'ordre chronologique, de la plus récente à la plus ancienne.

### 4. Sélectionne les entrées à présenter

- **Si focus** (`$ARGUMENTS` non-numérique non-vide) : parcours **toutes** les sessions, garde uniquement les bullets (décisions, avancées, TODOs) qui mentionnent le focus (match insensible à la casse, sur le titre ou le contenu). Si rien ne matche, dis-le clairement.
- **Sinon** : garde les `N` dernières sessions (N = arg numérique fourni, ou 3 par défaut).

### 5. Extrait les TODOs encore ouverts — toutes sessions confondues

**Indépendamment** du filtre de l'étape 4, parcours **tout** le log et collecte les TODOs au format `- [ ]` (non cochés). Ce sont les choses qui traînent. Ignore les `- [x]` (cochés/clos).

Si un focus est fourni, filtre aussi cette liste sur le focus.

### 6. Présente le contexte

Réponds en français, structuré comme suit. Si une section est vide, écris « *(aucun)* ».

```
# Contexte projet — <nom du repo>

## 🔁 TODOs encore ouverts (toutes sessions)

- [ ] ... (session du YYYY-MM-DD)
- [ ] ... (session du YYYY-MM-DD)

## 🎯 Décisions structurantes récentes

**YYYY-MM-DD — [titre session]**
- **[décision]** — résumé condensé (1 ligne)
- ...

**YYYY-MM-DD — [titre session]**
- ...

## ✅ Dernières avancées

**YYYY-MM-DD :** [avancées condensées en une ou deux lignes]
**YYYY-MM-DD :** ...

## 📌 Sessions lues

[liste des dates de session prises en compte, et si un focus a été appliqué]
```

### 7. Termine par une question d'orientation

Après le récap, pose **une seule** question courte pour amorcer la suite. Choisis-la en fonction du contenu :

- S'il y a des TODOs ouverts : « Tu veux reprendre sur [TODO le plus structurant] ou autre chose ? »
- S'il y a un blocage / question ouverte dans la dernière session : « La dernière session laissait [X] ouvert — on tranche aujourd'hui ? »
- Sinon : « Sur quoi tu bosses aujourd'hui ? »

## Règles

- **Lecture seule.** Tu n'écris rien dans le log, tu ne modifies rien dans `.claude/memory/`.
- **Pas de paraphrase inutile.** Cite court, fidèle aux entrées originales. Si l'utilisateur veut le détail d'une décision, il peut ouvrir le log lui-même.
- **Pas d'invention.** Si le log est mince ou contradictoire, dis-le franchement plutôt que de combler les trous.
- **Hiérarchise.** Les TODOs ouverts en premier (c'est ce qui bloque le démarrage), puis les décisions structurantes (le « pourquoi » du projet), puis les avancées (le « où on en est »).
- **Reste bref.** Le but est de remettre l'utilisateur en selle en quelques secondes de lecture, pas de noyer dans l'historique. Si la liste est longue, condense.
