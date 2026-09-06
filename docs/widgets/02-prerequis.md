# Prérequis de développement — système de widgets

> **Mode** : énoncés seuls, sans corrigé. Tu codes, tu montres, on review.
> **Prérequis de ce document** : `01-analyse.md` (le CDC) lu et validé.

## Comment lire ce document

Dix fiches, dans un ordre qui n'est pas négociable pour les cinq premières : chacune sert de fondation à la suivante. Chaque fiche donne **ce qu'il faut comprendre**, **pourquoi ça sert ici précisément**, un **POC** à coder, un **critère de réussite observable**, et **le piège** — celui dans lequel on tombe quand on croit avoir compris.

Les POC se codent dans un bac à sable (une page jetable, un fichier de test), **pas** dans le code du dashboard. Le but est d'isoler la difficulté. Quand une fiche est validée, sa notion est acquise et le vrai code peut s'en servir.

| # | Fiche | Taille | Dépend de |
|---|---|---|---|
| 0 | Préparer le terrain | S | — |
| 1 | Dériver des types depuis de la donnée | S | — |
| 2 | Union discriminée et narrowing | S | 1 |
| 3 | **L'algorithme de grille** | **L** | 1, 2, 0 |
| 4 | Props, état, et identité (`key`) | M | — |
| 5 | La table de dispatch | S | 1, 4 |
| 6 | Effets, nettoyage, annulation | L | 2, 4 |
| 7 | CSS Grid explicite | S | — |
| 8 | Pointer Events | M | 4 |
| 9 | Hook headless | M | 8 |
| 10 | Premier feature-module NestJS | L | — |

**Pourquoi l'algo en n°3 et pas en n°8.** C'est le morceau le plus risqué du projet, et c'est du TypeScript pur : ni React, ni DOM, ni navigateur. Le faire tôt, c'est découvrir tôt s'il résiste. Le faire en dernier, c'est bâtir toute l'UI par-dessus une inconnue.

---

## Fiche 0 — Préparer le terrain

**Pourquoi ici.** La fiche 3 a besoin d'un moyen de vérifier une fonction pure. `apps/web` n'a aucun setup de test aujourd'hui — seul `apps/api` a Jest.

**Ce qu'il faut comprendre**

- Vitest est le compagnon de Vite : il réutilise la config existante (dont l'alias `@/`), donc l'installation est courte.
- Ce que fait un *runner* de tests : trouver les fichiers, exécuter les assertions, rapporter.
- La différence entre un test qui échoue (l'assertion est fausse) et un test qui plante (le code lève).

**POC.** Installer Vitest dans `apps/web`, ajouter le script npm, et écrire un unique test trivial (`expect(1 + 1).toBe(2)`). Puis le faire échouer volontairement pour voir la sortie d'erreur.

**Réussi quand** un `npm test` dans `apps/web` affiche un test vert, et un rouge lisible quand tu casses l'assertion.

**Le piège.** Vitest doit voir l'alias `@/`. Il lit `vite.config.ts`, donc ça devrait suivre — mais vérifie-le avec un import aliasé dans un test, sinon tu le découvriras à la fiche 3 en croyant que ton algo est cassé.

---

## Fiche 1 — Dériver des types depuis de la donnée

**Pourquoi ici.** C'est la mécanique du catalogue. `WidgetType` doit se déduire des entrées, jamais être maintenu à côté. Tu l'as déjà fait pour `sidebarRoutes` le 11/06 — cette fiche est une consolidation, pas une découverte.

**Ce qu'il faut comprendre**

- `as const` : ce que ça fige exactement (littéraux au lieu de `string`, lecture seule en profondeur).
- `satisfies` vs annotation `:` — pourquoi `satisfies` vérifie sans élargir. C'est toute la raison pour laquelle `sidebarRoutes` marche.
- `keyof typeof` sur un objet : passer d'une valeur à un type.
- `Record<K, V>`, et ce que ça t'oblige à fournir quand `K` est une union finie.
- Typer un composant React stocké dans un objet : `ComponentType<SVGProps<SVGSVGElement>>` (tu l'as déjà dans `routes.types.ts:19`).
- `verbatimModuleSyntax` : `import type` obligatoire pour les imports de types.

**POC.** Écrire un mini-catalogue de trois entrées (titre, icône, endpoint, w, h) et en dériver le type des clés. Puis, sans toucher au type : ajouter une quatrième entrée, et vérifier que le type s'est élargi tout seul. Enfin, écrire une fonction qui prend une clé du catalogue et vérifier que l'autocomplétion propose les quatre valeurs et rejette `"nimporte"`.

**Réussi quand** ajouter une entrée au catalogue suffit — aucun type, aucune union, aucune liste à mettre à jour ailleurs.

**Le piège.** Écrire `const catalog: Record<string, WidgetDefinition> = {...}`. L'annotation élargit les clés en `string`, `keyof typeof` te rend `string`, et tu as perdu exactement ce que tu cherchais. C'est la raison pour laquelle la décision du 11/06 disait « ne PAS rétrograder vers une annotation ».

---

## Fiche 2 — Union discriminée et narrowing

**Pourquoi ici.** C'est la forme de `WidgetDataState`. Sans elle, tu écriras `{ data, loading, error }` avec trois champs qui peuvent tous être remplis en même temps, et tu passeras la v1 à écrire des gardes défensives.

**Ce qu'il faut comprendre**

- Ce qu'est un champ *discriminant* et pourquoi il doit être un littéral.
- Le *narrowing* : comment TypeScript sait, à l'intérieur d'un `if (s.status === "success")`, que `s.value` existe.
- Pourquoi une union rend les états illégaux **non représentables** — c'est ça le gain, pas la beauté du code.
- L'exhaustivité : comment obtenir une erreur de compilation quand tu ajoutes une branche et oublies de la traiter.
- Pourquoi une `interface` ne peut pas exprimer une union (tu as creusé ça le 16/06).

**POC.** Modéliser un état de chargement à trois branches. Écrire une fonction qui prend cet état et retourne une chaîne à afficher, en traitant les trois cas. Puis : ajouter une quatrième branche (`"empty"`, par exemple) **sans** toucher la fonction — et faire en sorte que TypeScript refuse de compiler. Ensuite seulement, traiter la branche.

**Réussi quand** oublier une branche est une erreur de compilation, pas un bug silencieux à l'exécution.

**Le piège.** Croire qu'un `switch` sans `default` suffit. Il faut soit un `default` qui affecte la valeur à `never`, soit un type de retour explicite sur la fonction — sinon TypeScript infère `string | undefined` et te laisse passer.

---

## Fiche 3 — L'algorithme de grille

> C'est la fiche la plus longue et la plus importante. Zéro React, zéro DOM, zéro navigateur : uniquement des fonctions et des tests.

**Pourquoi ici.** C'est le cœur du système et le seul endroit où le projet peut vraiment se planter. Si cette fiche résiste, tout le reste est de l'assemblage.

**Ce qu'il faut comprendre**

- Ce qu'est une **fonction pure** : mêmes entrées, mêmes sorties, aucun effet de bord. Et pourquoi c'est ce qui la rend testable en isolation.
- L'immutabilité : produire un nouveau tableau plutôt que muter celui reçu, et pourquoi c'est non négociable ici (React compare les références).
- Le test de chevauchement de deux rectangles sur une grille d'entiers.
- Le parcours en **file** (traiter, empiler les conséquences, recommencer) plutôt qu'en récursion.
- Écrire des cas de test **avant** ou **pendant**, pas après.

**POC.** En trois temps.

*Temps 1 — le prédicat.* Une fonction qui prend deux rectangles `{x, y, w, h}` et dit s'ils se chevauchent. Cas à couvrir obligatoirement :

| Cas | Attendu |
|---|---|
| Deux rectangles éloignés | pas de chevauchement |
| Rectangles identiques | chevauchement |
| Superposition partielle sur les deux axes | chevauchement |
| Même ligne, `x=0 w=3` et `x=3 w=3` | **pas** de chevauchement — ils sont adjacents |
| Même colonne, `y=0 h=2` et `y=2 h=2` | **pas** de chevauchement |
| Chevauchement horizontal mais pas vertical | pas de chevauchement |

*Temps 2 — la résolution.* Une fonction qui prend la liste des autres widgets et le widget déplacé à sa position candidate, et retourne la nouvelle liste, sans chevauchement, en appliquant la règle du §4.4 du CDC. Cas à couvrir :

| Cas | Attendu |
|---|---|
| Position candidate libre | liste inchangée |
| Un seul widget gêne | il descend juste sous le déplacé |
| Cascade A→B→C | les trois positions finales sont correctes |
| Un widget gêné par deux widgets eux-mêmes poussés | il finit sous le plus bas des deux |
| Widget poussé deux fois | position finale correcte, pas intermédiaire |
| Le déplacé sort des 12 colonnes | comportement défini (borné ou rejeté — à toi de choisir et de le tester) |
| Idempotence | rejouer la fonction sur son propre résultat ne change rien |

*Temps 3 — la mesure.* Générer 50 widgets et mesurer le temps d'une résolution. Tu dois savoir si tu es à 0,1 ms ou à 40 ms, parce que cette fonction tournera à chaque mouvement de souris.

**Réussi quand** les deux fonctions passent tous les cas ci-dessus, y compris ceux d'adjacence et d'idempotence, et que tu connais le coût d'un appel.

**Le piège.** L'adjacence. Un widget en `x=0` de largeur `3` occupe les colonnes 0, 1 et 2 — **pas** la 3. Écrire `a.x + a.w >= b.x` au lieu de `>` colle tous tes widgets les uns aux autres et tu chercheras longtemps. Écris ce cas de test en premier.

**Le second piège.** Retourner le même tableau muté. Ça marchera dans tes tests et ça produira un dashboard qui ne se redessine pas, parce que React verra la même référence et conclura que rien n'a changé.

---

## Fiche 4 — Props, état, et identité

**Pourquoi ici.** Trois notions que tu as déjà rencontrées, et sur lesquelles ton code actuel a deux bugs ouverts. Cette fiche se fait **sur ton vrai code**, pas dans un bac à sable.

**Ce qu'il faut comprendre**

- Un composant reçoit **un seul argument** : l'objet des props. `<Widget instance={x} />` appelle `Widget({ instance: x })`. Le typer, c'est typer cet objet.
- La différence entre annoter un paramètre et le renommer en destructurant. C'est exactement le bug de `Widget.tsx:5`.
- `useState` : ce que fait le paramètre générique, pourquoi `useState([])` s'infère `never[]`.
- L'état est **immuable** : on remplace, on ne modifie pas.
- **`key` et l'identité** : `key` ne sert pas à « aider React », elle *définit* quel élément du rendu précédent correspond à quel élément du nouveau. Une `key` qui change = démontage + remontage = état perdu.
- Re-render ≠ remontage. Le premier garde l'état, le second le détruit.

**POC.** Une liste d'éléments qu'on peut ajouter et supprimer, où **chaque élément a un état interne visible** — un compteur avec un bouton, par exemple. Rendre la liste avec `key={index}`, incrémenter les compteurs de façon distincte, puis supprimer un élément du milieu et regarder ce qui arrive aux compteurs restants. Recommencer avec une `key` stable.

Puis, sur le vrai code : corriger la signature de `Widget.tsx:5` et le `useState` de `Dashboard.tsx:9`.

**Réussi quand** tu peux expliquer, sans hésiter, pourquoi la version `key={index}` déplace les compteurs sur les mauvais éléments — et que les deux bugs ouverts sont fermés.

**Le piège.** Croire que `key={index}` marche « tant que la liste ne bouge pas ». Elle bougera : c'est un dashboard où on ajoute et supprime. Et le bug ne se voit que sur l'état *interne* des enfants, donc il est invisible tant que tes composants sont vides — exactement le cas de tes stubs actuels.

---

## Fiche 5 — La table de dispatch

**Pourquoi ici.** C'est le Registry : `archétype → composant de rendu`. En v1 il n'a qu'une entrée, mais il faut que la structure soit juste dès le départ.

**Ce qu'il faut comprendre**

- Stocker un composant dans une variable ou un objet, puis le rendre. **La variable doit commencer par une majuscule** pour que JSX la traite comme un composant et non comme une balise HTML. Tu le fais déjà dans `Icon.tsx:4` (`icon: IconComponent`) — comprends *pourquoi*.
- `Record<Archetype, ComponentType<Props>>` et l'exhaustivité qu'il impose : ajouter un archétype à l'union sans l'ajouter à la table est une erreur de compilation.
- La différence entre une table de dispatch et une chaîne de `if` : la table est de la donnée, elle se parcourt, se compte, se teste.

**POC.** Deux composants triviaux, une table qui les indexe par une clé d'union, et un composant qui rend le bon selon une prop. Puis ajouter une troisième clé à l'union **sans** l'ajouter à la table, et vérifier que ça ne compile pas.

**Réussi quand** l'oubli d'une entrée est détecté à la compilation, pas au clic.

**Le piège.** `const Body = registry[type]` puis `<Body />` fonctionne ; `<registry[type] />` n'est pas du JSX valide. Il faut passer par une variable intermédiaire capitalisée.

---

## Fiche 6 — Effets, nettoyage, annulation

**Pourquoi ici.** C'est `useWidgetData`. La brique dont dépend tout le chargement, et celle où l'on écrit le plus de bugs invisibles.

**Ce qu'il faut comprendre**

- Quand un effet part, quand il rejoue, ce que le tableau de dépendances contrôle exactement.
- La **fonction de nettoyage** : quand elle est appelée (avant chaque réexécution *et* au démontage), et pourquoi elle existe.
- **StrictMode en développement monte deux fois.** Ce n'est pas un bug, c'est un détecteur : il révèle les effets qui ne se nettoient pas. Ton `main.tsx:8` a `<StrictMode>`.
- `AbortController` : créer, passer le signal à `fetch`, annuler dans le nettoyage. Et le fait qu'une requête annulée **rejette** — donc qu'il faut distinguer une annulation d'une vraie erreur, sinon tu afficheras « Erreur » à chaque démontage.
- Pourquoi écrire dans l'état d'un composant démonté est un problème.
- Un hook n'est **pas** un objet partagé : appelé dans trois composants, il produit trois états indépendants.

**POC.** Un hook de chargement générique qui prend une URL et retourne l'union de la fiche 2. Le tester contre un endpoint volontairement lent (n'importe quel service de délai, ou un `setTimeout` dans une fausse fonction de fetch). Trois scénarios à vérifier :

1. Chargement normal → `loading` puis `success`.
2. Endpoint qui échoue → `loading` puis `error`.
3. **Démonter le composant pendant le chargement** → aucune écriture d'état après démontage, aucune erreur en console, requête annulée (visible dans l'onglet réseau).

Puis monter trois fois le même composant avec des URLs différentes et vérifier que les trois états sont indépendants.

**Réussi quand** le scénario 3 est propre en StrictMode, et que tu peux expliquer ce que chaque ligne du nettoyage empêche.

**Le piège.** Traiter l'annulation comme une erreur. Quand tu appelles `abort()`, la promesse de `fetch` rejette avec une erreur de type `AbortError` — si tu la mets dans ton état d'erreur, chaque démontage affichera un widget cassé, et en StrictMode ce sera *chaque montage*.

---

## Fiche 7 — CSS Grid explicite

**Pourquoi ici.** C'est le substrat sur lequel `{x, y, w, h}` se traduit en pixels. Court, mais deux pièges coûteux.

**Ce qu'il faut comprendre**

- `grid-template-columns: repeat(12, minmax(0, 1fr))` et pourquoi `minmax(0, 1fr)` plutôt que `1fr`.
- `grid-auto-rows` pour une hauteur de rangée fixe.
- Le placement explicite : `grid-column: <début> / span <largeur>`, idem pour les rangées.
- **CSS Grid est indexé à partir de 1**, ton modèle est indexé à partir de 0. La conversion est une addition, mais elle doit être écrite à un seul endroit.
- Comment Tailwind v4 exprime tout ça, et quand passer par un `style` inline plutôt qu'une classe (une valeur calculée ne peut pas être une classe Tailwind : le scanner ne voit pas les chaînes construites à l'exécution).

**POC.** Une grille de 12 colonnes, et trois blocs colorés placés à des `{x, y, w, h}` que tu passes en dur. Vérifier visuellement que la position correspond au modèle. Puis mettre dans un bloc un contenu volontairement très large (un long mot sans espaces) et observer la différence entre `1fr` et `minmax(0, 1fr)`.

**Réussi quand** un `{x: 3, y: 1, w: 3, h: 2}` atterrit exactement là où tu l'attends, et qu'un contenu trop large ne fait pas déborder la colonne.

**Le piège.** `grid-column: 3` pour `x = 3` place le bloc en quatrième colonne. Décalage silencieux d'une colonne, invisible tant que tu n'as qu'un bloc.

**Le second piège.** `className={\`col-start-${x + 1}\`}` ne marchera pas : Tailwind analyse le code source statiquement et ne verra jamais cette classe. Les positions calculées passent par `style`.

---

## Fiche 8 — Pointer Events

**Pourquoi ici.** La saisie du drag. L'ADR a retenu Pointer Events plutôt que les API souris/tactile séparées.

**Ce qu'il faut comprendre**

- Pourquoi Pointer Events plutôt que `mousedown`/`touchstart` : une seule API pour souris, tactile et stylet.
- Le trio `pointerdown` / `pointermove` / `pointerup`.
- **`setPointerCapture`** : sans lui, sortir de l'élément pendant le drag fait perdre les événements et le widget reste collé au curseur. C'est *la* chose à retenir de cette fiche.
- `clientX/Y` et `getBoundingClientRect()` : convertir une position écran en position relative au conteneur.
- L'arithmétique pixels → cellules : diviser par (largeur de colonne + gouttière), arrondir. Attention à la gouttière, qui n'est pas répartie uniformément.
- `touch-action: none` pour empêcher le navigateur de scroller quand on drague.
- Pourquoi le drag ne doit pas déclencher un clic à la fin.

**POC.** Un carré déplaçable à la souris dans un conteneur, qui **s'aligne sur une grille** de 12 colonnes : il ne suit pas le curseur librement, il saute de cellule en cellule. Afficher en permanence le `{x, y}` calculé. Vérifier que sortir du conteneur pendant le drag ne casse rien.

**Réussi quand** tu peux traverser toute la grille sans perdre le carré, et que le `{x, y}` affiché correspond à la cellule sous le curseur.

**Le piège.** Oublier `setPointerCapture` et compenser avec un écouteur sur `window`. Ça marche à peu près, puis ça casse dès qu'il y a deux zones draguables, et le nettoyage devient une source de fuites.

---

## Fiche 9 — Hook headless

**Pourquoi ici.** C'est `useDraggable`, la couche 2 de l'ADR : le comportement séparé de la présentation.

**Ce qu'il faut comprendre**

- Ce qu'est un hook *headless* : il gère un comportement et ne rend aucun JSX. Il retourne un état et des gestionnaires d'événements à brancher.
- Le pattern « objet de props » : le hook retourne un objet qu'on étale sur un élément.
- `useRef` pour ce qui doit survivre aux rendus **sans** en déclencher — la position de départ du pointeur, par exemple. La distinction `useState`/`useRef` que tu as creusée le 16/06 sert exactement ici.
- Pourquoi un hook est plus adapté que l'héritage pour partager ce comportement, et ce que ça donne quand deux composants l'utilisent.

**POC.** Extraire le drag de la fiche 8 dans un hook, sans changer le comportement. Puis brancher ce hook sur **deux** carrés indépendants dans la même page, et vérifier qu'ils ne se marchent pas dessus.

**Réussi quand** le composant qui utilise le hook ne contient plus aucune logique de pointeur — uniquement du JSX et un étalement de gestionnaires.

**Le piège.** Mettre la position courante du pointeur dans un `useState` et déclencher un rendu à chaque `pointermove`. C'est 60 rendus par seconde de tout le sous-arbre. La décision du 15/06 sur le « transient-local » porte précisément là-dessus.

---

## Fiche 10 — Premier feature-module NestJS

**Pourquoi ici.** La persistance. `apps/api` est un squelette : pas de base, pas de module métier, pas de configuration.

**Ce qu'il faut comprendre**

- Module, Contrôleur, Service : qui fait quoi, et pourquoi Nest les sépare.
- L'**injection de dépendances** : ce que `@Injectable()` déclare, comment Nest résout le graphe, ce qu'est le scope par défaut. Le lien avec ton habitude Delphi de créer les objets soi-même.
- Le cycle d'une requête : route → contrôleur → service → réponse.
- Les DTO et la validation d'entrée : ne jamais faire confiance au corps de la requête.
- **CORS** : `apps/web` sert sur `5173`, `apps/api` sur `3000`. Sans configuration, le navigateur bloque.
- Les variables d'environnement et le module de configuration.

**POC.** Un module `dashboard` avec deux routes : lire la disposition d'un utilisateur, remplacer la disposition d'un utilisateur. **En mémoire d'abord** — un simple tableau dans le service, pas de base. Le but est de comprendre le squelette Nest sans y ajouter le problème de la persistance. Vérifier depuis le front que l'appel passe le CORS. Écrire un test du contrôleur avec le Jest déjà configuré.

**Réussi quand** le front lit et écrit une disposition via l'API, et que redémarrer l'API la perd (c'est normal — c'est en mémoire).

**Le piège.** Vouloir brancher une base de données dans la même étape. Tu additionnerais l'apprentissage de Nest, celui d'un ORM, et celui des migrations. Fais-en une fiche 11 séparée, une fois celle-ci verte.

> **Décision non prise** : l'ORM (Prisma, TypeORM, ou requêtes SQL directes) et le SGBD. À trancher avant la fiche 11 — pas maintenant.

---

## Ce que tu n'as PAS besoin d'apprendre maintenant

Liste défensive : chacun de ces sujets est une porte ouverte sur une semaine de détour, et aucun n'est nécessaire à la v1.

- **Redux, Zustand ou tout gestionnaire d'état global.** Décision du 15/06 : pas avant un prop-drilling douloureux. Le Dashboard détient un tableau et le passe à ses enfants directs. Il n'y a pas de problème à résoudre.
- **TanStack Query / SWR.** Tu écris ton hook à la main, c'est le but de la fiche 6. Tu sauras quoi en penser après.
- **react-grid-layout, @dnd-kit, gridstack.** Sauf si la question 1 du §9.2 tranche dans l'autre sens — auquel cas ce document est à refaire, et il sera bien plus court.
- **Recharts.** L'archétype `chart` est hors v1.
- **React Testing Library.** Tu testes une fonction pure (fiche 3) et un contrôleur Nest (fiche 10). Tester des composants viendra quand il y aura des composants stables à tester.
- **useMemo, useCallback, React.memo.** Optimise quand tu auras mesuré un problème. Le seul point de perf identifié est le rendu pendant le drag, et il se règle par la structure (fiche 9), pas par de la mémoïsation.
- **Server Components, SSR, Suspense pour les données.** Hors sujet sur une SPA Vite.

---

## Ordre d'attaque suggéré

**Lot 1 — dérisquer** : fiches 0, 1, 2, 3. À la fin, tu sais si l'algorithme de grille tient, et tu as un catalogue typé. C'est le lot qui décide de la suite.

**Lot 2 — l'affichage** : fiches 4, 5, 7. À la fin, un dashboard statique s'affiche à partir d'une liste de positions en dur, avec des valeurs en dur. C'est l'étape 1 de l'ADR.

**Lot 3 — les données** : fiche 6. Les valeurs en dur deviennent des valeurs chargées.

**Lot 4 — la persistance** : fiche 10. L'ordre de l'ADR place la persistance avant le drag, et il tient toujours.

**Lot 5 — le drag** : fiches 8, 9, plus le branchement de l'algorithme de la fiche 3.

Chaque lot produit quelque chose qui marche. Si tu t'arrêtes après le lot 3, tu as un dashboard figé mais réel — ce qui vaut mieux qu'un moteur de drag sans rien à afficher.
