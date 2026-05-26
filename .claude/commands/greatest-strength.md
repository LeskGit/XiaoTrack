---
description: "Explique en profondeur une fonctionnalité technique (hook, méthode, concept, pattern, paradigme...) en plusieurs phases : explication brève, fonctionnement interne, exemple simple, et exemple projet si pertinent."
argument-hint: '<fonctionnalité ou concept à apprendre> — ex: "useMatches react-router", "TDataSet.FieldByName Delphi", "monade", "DI NestJS"'
allowed-tools: ['Bash', 'Read', 'Glob', 'Grep']
---

# /greatest-strength — Décortique une fonctionnalité

Tu vas expliquer **en profondeur** à l'utilisateur une fonctionnalité technique précise (un hook, une méthode, une lib, un concept, un pattern, un paradigme...). L'objectif est qu'il comprenne réellement, pas qu'il copie/colle.

## Argument

`$ARGUMENTS` contient ce que l'utilisateur veut apprendre. Ça peut être :

- Une fonction / hook précis : `useMatches`, `useDeferredValue`, `Array.flatMap`, `Promise.allSettled`...
- Une méthode d'une lib ou d'un framework : `dataset.FieldByName().AsString` (Delphi), `Knex.transaction`, `Nest @Injectable`...
- Un concept ou paradigme : `monade`, `event sourcing`, `CQRS`, `closure`, `tail call optimization`, `memoization`, `dependency injection`...
- Une feature de langage : `nullish coalescing`, `optional chaining`, `Symbol.iterator`...
- Un pattern d'archi : `hexagonal architecture`, `outbox pattern`, `saga`, `circuit breaker`...

Si `$ARGUMENTS` est vide ou trop vague (« explique-moi React »), demande à l'utilisateur de préciser **une** fonctionnalité ou **un** concept précis, et donne 2-3 exemples de granularité attendue.

## Format de réponse — déroulé complet en un seul message

Tu réponds en **français**, structuré en **4 phases** (la 4ᵉ étant conditionnelle). Pas d'introduction ni de conclusion globale — tu rentres direct dans le vif.

### Phase 1 — Explication brève (~5 lignes)

- **Qu'est-ce que c'est** en une phrase claire.
- **À quoi ça sert** — quel problème ça résout, dans quel contexte on l'utilise typiquement.
- **D'où ça vient** (lib, framework, langage, version d'apparition si pertinent).
- Si c'est un terme polysémique (ex: « réducteur » → reducer Redux vs `Array.reduce` vs concept fonctionnel), **lève l'ambiguïté** et explique laquelle des acceptions tu vas traiter.

Pas de jargon non défini à ce stade. Si tu dois utiliser un terme technique, glisse une mini-définition entre parenthèses ou attends la phase 2.

### Phase 2 — Fonctionnement technique

C'est le cœur. Tu expliques **comment ça marche sous le capot** — pas comment l'utiliser. Couvre les angles pertinents parmi ceux-ci (ne déroule pas une checklist mécanique : choisis ce qui éclaire réellement) :

- **Mécanisme interne** : ce que ça fait étape par étape quand on l'appelle / l'utilise.
- **Mémoire** : qu'est-ce qui est alloué, où, quand est-ce libéré, est-ce que ça capture des références (closures, fuites possibles).
- **Stack / appel** : si pertinent — synchrone vs asynchrone, microtask vs macrotask, position dans la stack, callbacks, hooks dans le cycle de vie.
- **Complexité / coût** : ordre de grandeur, perf typique, cas où ça coûte cher.
- **État interne / lifecycle** : variables internes, dépendances, conditions de ré-exécution (pour un hook : quand est-ce que ça re-run ?).
- **Comparaison fine** avec les alternatives proches qui peuvent prêter à confusion (ex: `useMemo` vs `useCallback`, `Promise.all` vs `Promise.allSettled`, `flatMap` vs `map().flat()`).
- **Pièges classiques** : les erreurs typiques de débutant qui découlent d'une mauvaise compréhension du mécanisme.

Tu **vulgarises sans simplifier abusivement**. Si quelque chose est subtil, tu le dis subtilement — tu ne le caches pas. L'utilisateur est débutant React/Nest mais veut comprendre vraiment.

Si pertinent, glisse un **schéma ASCII** simple (cycle de vie, ordre d'exécution, flux mémoire) — pas plus de 10 lignes.

### Phase 3 — Exemple simple et concret

Un **exemple minimal** :

- Code complet et qui compile / fonctionne, pas un pseudo-code.
- Aussi court que possible pour rester lisible (≤ 25 lignes idéalement).
- Avec **2-3 commentaires inline** qui pointent là où la magie opère, pas qui répètent le code.
- Si pertinent, montre la **valeur de retour** ou ce que la console affiche.

Si la fonctionnalité a deux ou trois usages canoniquement différents (ex: `Array.reduce` pour somme vs pour transformer en objet vs pour pipeline), tu peux mettre **deux mini-exemples**, mais pas plus.

### Phase 4 — Exemple appliqué au projet courant (conditionnelle)

Cette phase **n'est incluse que si** la fonctionnalité est applicable au projet actuellement ouvert.

#### Procédure de décision

1. **Détecte la stack du projet** :
   - `git rev-parse --show-toplevel 2>/dev/null` pour la racine.
   - Si présent, lis `package.json` (dépendances JS/TS), `composer.json` (PHP), `pyproject.toml` / `requirements.txt` (Python), `Cargo.toml` (Rust), `go.mod` (Go), `*.dpr` / `*.dproj` (Delphi), etc.
   - Si XiaoBot est la persona active (présence d'un `CLAUDE.md` qui le mentionne ou d'un `AI/XiaoBot.md`), tu connais déjà la stack : React 19 + Vite + Tailwind v4 (web), NestJS 11 (api).

2. **Évalue la pertinence** :
   - La fonctionnalité existe dans la stack détectée ? (ex: `useMatches` n'est pertinent que si `react-router` est dans `package.json`).
   - Le concept s'applique-t-il naturellement à un fichier ou un module existant ? (ex: « dependency injection » → tu peux pointer un module Nest réel).
   - Si la stack n'inclut pas la techno (ex: question sur Delphi alors qu'on est sur XiaoTrack TS) : **omet** la phase 4 sans signaler.
   - Si la techno existe mais qu'aucun code du projet ne s'y prête naturellement : **omet** la phase 4 sans signaler.

3. **Si tu décides d'inclure la phase 4** :
   - Repère **un fichier réel** du projet où la fonctionnalité s'applique ou pourrait être introduite.
   - Donne un exemple **concret et contextualisé** : « Dans `apps/web/src/components/Sidebar.tsx`, au lieu de... tu pourrais utiliser... pour... ».
   - Si c'est un ajout pertinent : précise si c'est un quick win ou si ça mérite une discussion architecturale plus large (avec la posture XiaoBot si active : signale dette ou trade-off le cas échéant).
   - Si la fonctionnalité **existe déjà** dans le code du projet : pointe le fichier et la ligne, fais-en l'analyse.

#### Critère final de la décision

Tu n'inclus la phase 4 que si elle apporte une **valeur supplémentaire concrète** par rapport à l'exemple générique de la phase 3. Pas de phase 4 bidon « voici comment ça pourrait s'utiliser un jour ».

## Règles globales

- **Pas de paraphrase de la doc officielle.** Tu expliques avec tes mots, en construisant le mental model — pas en récitant la signature de fonction.
- **Pas d'hallucination.** Si tu n'es pas sûr d'un détail (version d'introduction, comportement exact d'un edge case), tu le signales : « à vérifier » ou « selon la version ». Pas de fausse certitude.
- **Pas de fluff.** Pas de « C'est une fonctionnalité très puissante » ou « Beaucoup de développeurs l'utilisent ». Va au substantif.
- **Pas de hiérarchie h1.** Utilise `##` pour les phases. Le rendu reste lisible dans la session.
- **Anglicismes assumés.** Si le terme technique standard est en anglais (closure, hook, callback, scheduler), tu l'utilises en anglais — pas de traduction artificielle.
- **Code blocks** : précise toujours le langage (` ```ts `, ` ```tsx `, ` ```pascal `, etc.) pour la coloration syntaxique.
- **Reste bref dans le bon sens** : un déroulé complet doit tenir en ~100-200 lignes de réponse selon le sujet. Plus, tu perds le lecteur. Moins, tu n'as pas creusé.
