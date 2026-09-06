
---

## 2026-09-05 — Session analyse & conception du système de widgets

### Décisions

- **Cadrage produit du système de widgets (CDC figé)** — contexte : le système était conçu par petits bouts depuis le 11/06 sans périmètre écrit. Choix arrêtés : dashboard global unique avec widgets typés par domaine ; **grille 2D libre** 12 colonnes avec **push vertical en cascade** au drop ; mode édition explicite (toggle, brouillon, Annuler/Enregistrer) ; v1 = ajouter / supprimer / déplacer, **sans resize ni configuration** ; mobile en lecture seule, empilement 1 colonne pleine largeur, positions ignorées ; persistance API NestJS ; **archétype `stat` uniquement** en v1. Conséquence : le CDC complet est écrit dans `docs/widgets/01-analyse.md`, avec 10 questions ouvertes en §9.2 et les critères d'acceptation en §8.

- **Le catalogue est de la DONNÉE, pas des composants** — contexte : « widgets préfabriqués » pouvait vouloir dire un composant par indicateur. Choix : une entrée de catalogue par indicateur (`{title, icon, domain, archetype, endpoint, unit?, w, h}`) et **un seul composant par archétype**. `WidgetType` dérivé du catalogue via `as const satisfies` + `keyof typeof`, même mécanique que `sidebarRoutes` (11/06). Raison : ajouter un indicateur = ajouter une ligne, sans toucher aux types ni à la palette. Conséquences : le catalogue contient des composants d'icônes, il n'est donc **pas sérialisable** et vit dans le code, jamais en base ; un `type` persisté absent du catalogue doit être **ignoré silencieusement** au chargement.

- **`WidgetInstance` réduite à `{ type, x, y }`** — contexte : la forme actée le 15/06 était `{ id, type, layout: {x,y,w,h}, style?, data }`. Choix : trois champs primitifs. Raisons : plus de `data` (le widget charge la sienne), plus de `w`/`h` (dans le catalogue, puisque pas de resize), plus d'`id` (un seul exemplaire par type, donc **le type EST l'identité**), plus de `style` (apparence fixe portée par le Shell). Conséquences : la clé React devient `instance.type`, **stable et indépendante de la position** — ce qui évite un démontage/refetch de tous les widgets poussés à chaque pixel de drag ; en base, la PK composite `(user_id, type)` fait respecter l'unicité par le SGBD. **Dette assumée** : l'ADR exigeait « la forme complète sérialisable dès maintenant » ; cette forme accepte au contraire une migration de la table de dispositions le jour du resize.

- **Six révisions de l'ADR du 2026-06-15** — détail complet en §9.1 de `01-analyse.md`. **À reporter dans `.xiaobot/decisions.md`** :
  1. *Option B remplace l'option A* — le widget charge sa propre donnée, le parent ne le nourrit plus. L'option A supposait des widgets configurables ; le catalogue préfabriqué supprime la question. Garde-fou posé : « le widget charge sa donnée » ≠ « le composant appelle `fetch` » — le chargement vit dans un hook, le rendu reste un composant pur.
  2. *Plus d'union discriminée dans la donnée d'instance* — sans `data`, il n'y a plus rien à discriminer. Sa vraie place est l'état runtime `WidgetDataState` (`loading | error | success`). Clôt les TODOs « `data` partagé sans narrowing » et « forme de `WidgetLayout` ».
  3. **⚠️ Le maison sur grille 2D libre déclenche le critère de bascule de l'ADR** — l'ADR justifiait le maison par « en restant sur du reorder, le maison devient trivial » et fixait la bascule à « free-2D + collision + breakpoints responsive ». Le CDC spécifie les trois. La prémisse a disparu. **Non tranché** — cf. TODOs.
  4. *`localStorage` sort de la pyramide de persistance* — `useState → localStorage → API Nest` devient `useState → API Nest`, avec une interface `load()`/`save()` et une implémentation locale jetable pour ne pas dépendre de l'avancement du back.
  5. *Le responsive entre en v1* — l'ADR le plaçait en étape 6. Forme minimale : empilement, lecture seule, aucun layout par breakpoint persisté.
  6. *« Commit-on-drop » ne vaut que pour le widget déplacé* — la maquette impose que les widgets **poussés** bougent pendant le drag, donc leur position se recalcule en continu. Seule la position du widget déplacé reste transiente.

- **Contrat de réponse commun par archétype** — contexte : `useWidgetData(type)` est générique parce qu'il lit l'endpoint dans le catalogue. Choix : tous les endpoints d'un même archétype répondent la même forme ; pour `stat`, `{ value: number, unit?: string, caption?: string }`. Raison : sinon il faut un adaptateur par entrée de catalogue. Conséquence : c'est une **contrainte que le front impose au back**, à respecter dès le premier endpoint.

- **Vitest dans `apps/web`** — contexte : `apps/web` n'a aucun outillage de test, et l'algorithme de grille est une fonction pure. Choix : Vitest plutôt que Jest, parce qu'il hérite de `vite.config.ts` (alias `@/`, TS, plugins). `apps/api` garde Jest. Conséquence : deux runners dans le monorepo, un par workspace, pas de script `test` racine.

- **Cadre pédagogique : énoncés sans corrigé** — confirme et précise le cadre coaching acté le 2026-05-20. Les fiches donnent la notion, un exemple sur un domaine **neutre**, l'énoncé du POC et le critère de réussite ; jamais la solution.

### Avancées

- **`docs/widgets/01-analyse.md`** — CDC complet en 9 sections : périmètre, modèle de données (catalogue / instance / données métier), comportement UI, règles de la grille (substrat, base du recalcul, résolution des collisions, compaction, placement), chargement, persistance, états d'interface, 11 critères d'acceptation, révisions d'ADR et questions ouvertes.
- **`docs/widgets/02-prerequis.md`** — les 10 prérequis condensés, avec tableau de dépendances, ordre d'attaque en 5 lots, et une liste explicite de 7 sujets à **ne pas** apprendre maintenant.
- **`docs/widgets/prerequis/`** — 11 fiches détaillées + `README.md` d'index : terrain/Vitest, types dérivés, union discriminée, algorithme de grille, props/état/`key`, table de dispatch, effets et annulation, CSS Grid, Pointer Events, hook headless, module NestJS. Chacune : pourquoi, notions avec exemples neutres, exercices gradués, critère de réussite, pièges.
- **Canvas de maquettes publié** (artefact « Widgets XiaoTrack ») — 7 artboards calés sur le code réel (icônes Lucide du projet, `sky-100`/`sky-700`, `rounded-xl`, ombres, grille `16rem_1fr`) : mode lecture, mode édition, drag avec push en cascade, palette d'ajout, états vide/chargement/erreur, mobile, anatomie du widget. 7 annotations portent les questions que le dessin a fait émerger.
- **Relecture croisée du CDC** contre le session-log et l'ADR : 6 contradictions silencieuses, 7 TODOs orphelins et 10 incohérences internes identifiés, puis corrigés. Trois corrections notables : l'algorithme décrivait *à la fois* une récursion et une passe unique triée (garantie fausse — c'est une file) ; l'argument avancé contre la compaction verticale était factuellement faux ; la **base du recalcul pendant le drag** n'était pas définie (troisième disposition en mémoire nécessaire).
- **Découverte de conception via l'entité** : trois choses distinctes portaient le nom « widget » — entrée de catalogue (code, une par type), instance (base, une par widget posé), état runtime (mémoire, une par composant monté). La clé `type` est la seule jointure entre les trois.

### TODOs / Suites

- [ ] **Reporter les 6 révisions dans `.xiaobot/decisions.md`** et mettre à jour `.xiaobot/roadmap.md` (le « In progress » décrit encore l'archi du 15/06).
- [ ] **Trancher maison vs bibliothèque de layout** — révision 3 ci-dessus. Conditionne les neuf autres questions ouvertes. Le lot 1 des fiches (algorithme en TS pur) doit donner de quoi décider sur du concret.
- [ ] **Base du recalcul pendant le drag** — disposition d'avant le drag (recommandé, impose un troisième état en mémoire) vs provisoire précédent (les poussées s'accumulent sans jamais s'annuler).
- [ ] **Compaction verticale** — les trous se referment-ils après un push ? Question produit : l'utilisateur a-t-il le droit de laisser un espace vide ?
- [ ] **Placement d'un widget ajouté** — première place libre ou en bas ? Et si la grille est pleine ?
- [ ] **Zone d'actions par page** — `MainHeader` est partagé par les 6 pages, le bouton « Éditer » ne peut pas y vivre. Se branche sur le TODO « unifier la source de vérité des sections » (2026-05-20).
- [ ] **Sortie du mode édition avec des modifications non enregistrées** — jeter, demander, ou bloquer la navigation ?
- [ ] **Définition d'une « modification »** pour le compteur du mode édition — une action utilisateur, ou une instance dont `(x,y)` diffère de l'enregistré ? Dans le second cas, un seul drag en cascade affiche « 4 modifications ».
- [ ] **Formatage de la valeur** — le Body reçoit `1840` et formate, ou `"1 840 kcal"` déjà formaté ? Le catalogue portant l'unité, la première option se tient.
- [ ] **Où vit le dispatch du Registry** — `<Widget>` fait le lookup, ou `<Dashboard>` passe le Body en `children` ? (hérité du 2026-06-16, toujours non tranché)
- [ ] **Contrat de props du Shell `<Widget>`** — l'anatomie visuelle est décrite, pas la signature. (hérité du 2026-06-11)
- [ ] **Dette bloquante avant de démarrer** : `Widget.tsx:5` (signature de props — renommage de destructuration au lieu d'une annotation, bug bloquant le rendu) ; `Dashboard.tsx:9` (`useState([])` inféré `never[]`) ; `MainLayout.tsx:10` (pas de comportement sous `md`, la sidebar s'empile pleine largeur au-dessus du contenu) ; absence de zone d'actions par page.
- [ ] **ORM et SGBD** — à trancher avant la fiche 11 (persistance réelle). Sans objet pour la fiche 10, qui reste en mémoire.
- [ ] **Reportés hors périmètre, à ne pas perdre** : « Recharts réservé au seul archétype `chart` » et « compat Tremor ↔ Tailwind v4 » (TODOs du 2026-06-11) — sans objet tant que `chart` est hors v1.
- [ ] **Outillage** : transformer les commandes `/never-forget`, `/remember`, `/todo`, `/todos`, `/resolve` en skills.
- [ ] Attaquer le **lot 1** des fiches (0, 1, 2, 3) : Vitest, catalogue typé, union discriminée, algorithme de grille testé.
