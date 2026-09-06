# Système de widgets — Analyse et cahier des charges

> **Statut** : analyse validée le 2026-09-05. La conception architecturale détaillée suit dans `02-conception.md`.
> **Maquettes** : canvas « Widgets XiaoTrack » (7 états annotés) — mode lecture, mode édition, drag+push, palette, états vide/chargement/erreur, mobile, anatomie du widget.
> **Révise** : l'ADR du 2026-06-15 (`.xiaobot/decisions.md`) sur **six** points, listés en §9.1. La révision 3 (grille 2D maison) demande une décision explicite avant d'aller plus loin.

---

## 1. Objet

Le dashboard de XiaoTrack est une **grille de widgets que l'utilisateur compose lui-même**. Chaque widget affiche un indicateur agrégé provenant d'un domaine de l'app (Nutrition, Workouts, Habits, Planning, Notes). Le dashboard est l'unique page concernée : les six autres sections restent des pages classiques.

Le système est donc un agrégateur transverse : c'est le seul endroit de l'app où des données de plusieurs domaines cohabitent.

### Dans le périmètre v1

| | |
|---|---|
| Catalogue | Widgets préfabriqués, non paramétrables |
| Archétype de rendu | `stat` uniquement (valeur + unité + icône + contexte) |
| Actions | Ajouter, supprimer, déplacer |
| Disposition | Grille 2D libre, 12 colonnes, push vertical au drop |
| Mode édition | Explicite (bouton), avec Annuler / Enregistrer |
| Persistance | API NestJS |
| Mobile | Lecture seule, empilement 1 colonne |

### Hors périmètre v1

- **Redimensionner** un widget — la taille est une propriété du *type*, pas de l'*instance*.
- **Configurer** un widget (choisir sa métrique, sa période, son titre).
- **Plusieurs dashboards** ou plusieurs pages de widgets.
- **Archétypes `chart` et `progress`** — le catalogue les prévoit, la v1 ne les implémente pas.
- **Cache local** (localStorage) — écarté explicitement, cf. §9.
- **Temps réel / rafraîchissement automatique.**

---

## 2. Modèle de données — trois choses distinctes

C'est la décision structurante de cette analyse. Trois notions se ressemblent et ne doivent jamais se mélanger :

| | Où ça vit | Qui l'écrit | Sérialisable |
|---|---|---|---|
| **Catalogue** | Code du front | Le développeur | Non (contient icônes et fonctions) |
| **Instance** | Base, via l'API | L'utilisateur, en mode édition | Oui, entièrement |
| **Données métier** | Base, via l'API | Les autres features de l'app | Oui |

### 2.1 Le catalogue — de la donnée, pas des composants

Une entrée par indicateur. Le catalogue décrit *quoi* afficher ; un seul composant par archétype sait *comment* l'afficher.

```ts
{
  title:     string,                    // affiché dans la carte et dans la palette
  icon:      ComponentType<SVGProps>,   // icône SVGR du domaine
  domain:    "nutrition" | "workouts" | "habits" | "planning" | "notes",
  archetype: "stat",                    // clé du Registry de rendu
  endpoint:  string,                    // d'où vient la donnée
  unit?:     string,
  w: number, h: number,                 // taille en cellules — fixe pour ce type
}
```

`WidgetType` est **dérivé** du catalogue (`as const satisfies` + `keyof typeof`), jamais maintenu à part. Même mécanique que `sidebarRoutes` depuis le 2026-06-11, et pour la même raison : ajouter un indicateur, c'est ajouter une ligne, et le type suit tout seul.

**Conséquence** : le catalogue n'est jamais persisté. Un type retiré du catalogue dans une version ultérieure laisse des instances orphelines en base → au chargement, **les types inconnus sont ignorés silencieusement**, jamais une erreur.

### 2.2 L'instance — trois champs

```ts
type WidgetInstance = { type: WidgetType; x: number; y: number };
```

- Pas de `data` : la donnée n'est pas persistée, elle est chargée.
- Pas de `w`/`h` : ils viennent du catalogue, puisqu'on ne redimensionne pas.
- Pas d'`id` distinct : **un type ne peut être posé qu'une fois**, donc `type` *est* l'identité (et la clé React).

Le dashboard persisté est un `WidgetInstance[]`, avec l'invariant : *les `type` sont uniques dans le tableau*.

> **Ce que cette forme abandonne**, par rapport à `{ id, type, layout: {x,y,w,h}, style?, data }` acté le 2026-06-15 :
> - **`id`** — remplacé par l'unicité du type. Revient nécessairement le jour où un widget devient paramétrable ou posable en plusieurs exemplaires.
> - **`style?`** — tranche par omission le TODO « `bgColor` persisté par widget vs apparence fixe » du 2026-06-15 : l'apparence est fixe, portée par Tailwind dans le Shell.
> - **`w`/`h`** — déplacés dans le catalogue. Ils devront revenir dans l'instance le jour du resize.
> - **`layout` aplati** en `x`/`y` à la racine.
>
> L'ADR exigeait « la forme complète sérialisable dès maintenant pour ne pas migrer la persistance plus tard ». Cette forme-ci accepte au contraire une migration future, en échange d'une v1 nettement plus simple. C'est une dette **assumée**, pas un oubli : elle se paie en une migration de la table de dispositions le jour du resize.

### 2.3 Les données métier

Chargées à l'affichage, jamais stockées dans l'instance, jamais mises en cache en v1.

---

## 3. Comportement de l'interface

### 3.1 Mode lecture (défaut)

Grille en lecture seule. Aucune poignée, aucun `✕`, aucun trait de grille. Une barre au-dessus de la grille porte le bouton **Éditer le dashboard**.

> **Contrainte technique découverte au design** : `MainHeader` est partagé par les six pages. Un bouton propre au Dashboard ne peut pas y vivre. Il faut une **zone d'actions par page**, qui n'existe pas aujourd'hui dans `MainLayout`. Voir §9.

### 3.2 Mode édition

Entrée par le bouton, sortie par **Annuler** ou **Enregistrer**.

En mode édition :

- les traits de la grille (12 colonnes) deviennent visibles ;
- chaque widget porte une **poignée de drag** à gauche de son titre et un **`✕`** à droite ;
- un bouton **Ajouter un widget** ouvre la palette ;
- un compteur indique le nombre de modifications non enregistrées.

**Le mode édition travaille sur un brouillon.** Deux dispositions coexistent pendant l'édition : celle enregistrée et celle en cours. *Annuler* jette le brouillon et restaure l'enregistrée ; *Enregistrer* envoie le brouillon à l'API et le promeut. C'est ce qui rend le bouton *Annuler* honnête.

### 3.3 Ajouter

La palette s'ouvre en panneau latéral droit. Les widgets sont **groupés par domaine**, avec un champ de recherche. Chaque entrée montre son icône, son titre et sa taille.

- Un widget déjà posé est affiché **désactivé**, marqué « déjà posé ». (Conséquence directe de l'unicité par type : deux exemplaires afficheraient exactement la même chose.)
- Les archétypes non implémentés (`chart`, `progress`) sont visibles mais grisés.

### 3.4 Supprimer

Le `✕` retire l'instance du brouillon. **Pas de confirmation** : l'action est réversible par *Annuler* tant que rien n'est enregistré, et re-poser le widget est immédiat.

### 3.5 Déplacer

Voir §4 — c'est la partie la plus dense du système.

### 3.6 Responsive

Sous le breakpoint `md` (768px) :

- les positions `x`/`y` sont **ignorées** ;
- les widgets sont empilés sur une colonne, **tous en largeur pleine**, quel que soit leur `w` ;
- l'ordre d'empilement est le tri **par `y` croissant, puis par `x` croissant** (ordre de lecture) ;
- le mode édition est **indisponible** : la disposition se règle sur grand écran.

> **Dette préalable** : `MainLayout.tsx:10` ne déclare que `md:grid-cols-[16rem_1fr]`. Sous 768px, la sidebar ne devient pas un tiroir — elle s'empile pleine largeur au-dessus du contenu. À régler avant de brancher le responsive du dashboard.

---

## 4. Règles de la grille

### 4.1 Substrat

- **12 colonnes** de largeur égale, gouttière de 16px.
- **Hauteur de rangée fixe** (60px retenu au design), gouttière identique.
- Une position est un couple d'entiers `(x, y)` avec `0 ≤ x`, `x + w ≤ 12`, `0 ≤ y` non borné (la grille s'étend vers le bas).
- Deux widgets ne se chevauchent jamais. C'est l'invariant que tout l'algorithme sert à maintenir.

### 4.2 Déplacement

Pendant le drag, le widget déplacé suit le pointeur **hors du flux** (élevé, ombre portée, légère rotation). Sa position `(x, y)` est déduite en continu de la position du pointeur, arrondie à la cellule la plus proche.

**Point critique, révélé par la maquette n°3** : un rectangle en pointillés montre à l'utilisateur où le widget va atterrir, et les widgets poussés se déplacent *pendant* le drag. Cela impose que **le layout provisoire soit résolu à chaque mouvement du pointeur**, pas au `pointerup`.

Conséquence sur le modèle de drag : la position du widget *déplacé* peut rester locale au hook (transient, sans re-render du parent), mais la position des **autres** widgets doit être recalculée en continu. Le « commit-on-drop » envisagé le 2026-06-15 ne s'applique donc qu'au widget déplacé.

### 4.3 Base du recalcul — à trancher

Avant l'algorithme lui-même, une question qui le précède : **à partir de quoi recalcule-t-on ?**

- **Depuis la disposition d'avant le drag** (recommandé) — chaque mouvement repart de l'état figé au `pointerdown`. Ramener le pointeur en arrière annule les poussées : le comportement est réversible et sans mémoire. Coût : conserver une troisième disposition en mémoire pendant le drag (l'enregistrée, le brouillon, et la référence de drag).
- **Depuis le provisoire précédent** — chaque mouvement s'applique au résultat du précédent. Moins de state, mais les poussées s'accumulent : la grille s'allonge vers le bas au fil du drag et rien n'est jamais annulé. Cela ne correspond pas à ce que montre la maquette n°3.

Ce point n'était pas identifié avant la relecture. Il conditionne à la fois l'algorithme et le nombre de dispositions à tenir en mémoire.

### 4.4 Résolution des collisions — push vertical

À chaque recalcul, avec `M` le widget déplacé à sa position candidate :

1. Partir de la disposition de référence (§4.3), `M` retiré — il n'entre pas en collision avec lui-même.
2. Placer `M` à sa position candidate.
3. Maintenir une file des widgets à traiter, initialisée avec `M`.
4. Dépiler un widget `P` ; pour chaque `W` qui chevauche `P`, poser `W.y = P.y + P.h` et empiler `W`.
5. Recommencer jusqu'à ce que la file soit vide.

C'est la cascade visible sur la maquette n°3 : « Poids actuel » pousse « Calories », qui pousse « Notes ».

**Terminaison** : chaque déplacement ne va que vers le bas, sur une grille non bornée en bas — l'algorithme termine. En revanche, un même widget **peut être empilé plusieurs fois** (poussé par `M`, puis re-poussé par un widget lui-même poussé) : c'est correct, mais il faut le savoir. Traiter la file dans l'ordre des `y` croissants réduit le nombre de repasses sans le garantir à un.

> Une première rédaction de cette section décrivait *à la fois* une récursion et une passe unique triée « pour que chacun ne soit déplacé qu'une fois ». Les deux ne décrivent pas le même algorithme et la garantie était fausse. C'est la file qui fait foi.

Deux widgets ne se chevauchent que si leurs intervalles se recouvrent **sur les deux axes** — le test horizontal (`x` / `x+w`) écarte l'immense majorité des cas avant tout calcul.

### 4.5 Compaction — à trancher

Une fois les collisions résolues, faut-il **remonter** les widgets pour combler les trous verticaux ?

| | Avec compaction | Sans compaction |
|---|---|---|
| Trous | Se referment tout seuls | Persistent |
| Trou volontaire | Impossible | Possible |
| Sensation | « Ça se range tout seul » (Grafana) | « Ça reste où je l'ai posé » |
| Coût | Une passe de plus après chaque résolution | Rien |

La question est produit avant d'être technique : **l'utilisateur a-t-il le droit de laisser un espace vide ?** La maquette n°2 montre un emplacement libre entre deux widgets — avec compaction verticale, ce widget-là remonterait, et ce trou ne serait pas tenable.

Note : sans compaction, un widget poussé ne remonte **jamais**, même quand la place qu'il occupait se libère. La grille dérive vers le bas au fil des manipulations. C'est le vrai coût du « sans compaction », plus que l'absence de rangement automatique. **Décision à prendre en conception.**

### 4.6 Placement d'un widget ajouté — à trancher

Où atterrit un widget sorti de la palette ? Première position libre en balayant de haut en bas et de gauche à droite, ou systématiquement en bas ? Et si aucune position ne convient sans pousser quelqu'un ?

---

## 5. Chargement des données

**Chaque widget charge sa donnée indépendamment**, depuis l'endpoint déclaré par son entrée de catalogue.

- Un widget lent ne bloque pas les autres.
- Un widget en erreur ne casse ni la disposition ni les autres widgets.
- Corollaire assumé : **N widgets = N requêtes** au montage du dashboard. Acceptable à l'échelle du projet (une poignée de widgets, un seul utilisateur). Le point de bascule vers un endpoint d'agrégation est nommé en §9.

### 5.1 Trois états, jamais deux booléens

Un chargement a exactement trois issues : `loading`, `error`, `success`. Deux booléens indépendants (`isLoading`, `hasError`) autorisent des états impossibles — les modéliser en union discriminée, où l'état illégal ne se représente pas.

### 5.2 Contraintes techniques

- **`AbortController`** au nettoyage de l'effet : un widget démonté (supprimé, ou navigation) ne doit pas écrire dans un composant démonté.
- **React 19 + StrictMode** monte deux fois en développement : chaque effet de chargement part deux fois. Sans annulation propre, cela se voit immédiatement.
- Aucune bibliothèque de data-fetching en v1 (choix pédagogique assumé). Le hook générique de chargement est un prérequis du premier widget *qui affiche une vraie donnée* — pas du premier rendu statique. L'ordre de construction de l'ADR (rendu statique → supprimer → ajouter → persistance → drag) reste valable ; le hook s'intercale juste avant que les widgets cessent d'afficher des valeurs en dur.

### 5.3 Squelette de chargement

Le squelette occupe **déjà la taille finale du widget** — la disposition ne doit pas sauter quand la donnée arrive.

### 5.4 Erreur

L'erreur reste **confinée au widget** : la carte garde sa place dans la grille, affiche un message court et un bouton *Réessayer*. Pas d'écran d'erreur global.

---

## 6. Persistance

### 6.1 Ce qui est persisté

Uniquement la disposition : la liste des `{ type, x, y }`. Rien d'autre.

### 6.2 Quand

Sur action explicite (*Enregistrer*), jamais en continu pendant l'édition. Un seul appel réseau par session d'édition.

### 6.3 Contrat d'API

Deux opérations suffisent : **lire** la disposition de l'utilisateur, **remplacer** la disposition de l'utilisateur. Pas d'opération par widget — la disposition est un tout cohérent, et la remplacer entièrement évite toute question de synchronisation partielle.

### 6.4 Découplage

Le front parle à une **interface de persistance** (`load()` / `save()`), pas directement à `fetch`. Cela permet de développer la grille contre une implémentation locale jetable pendant que le module NestJS se construit, et de brancher l'implémentation HTTP sans toucher au reste. C'est une frontière, pas une abstraction spéculative : elle a exactement deux méthodes et deux implémentations prévues.

Cela ne réordonne pas les étapes de l'ADR — la persistance reste avant le drag. L'implémentation jetable sert à ne pas rendre l'étape 4 dépendante de l'avancement du back, pas à repousser la persistance après le drag. Les critères d'acceptation, eux, se vérifient contre l'implémentation HTTP.

---

## 7. États d'interface

Deux niveaux, à ne pas confondre : le **dashboard** a un état, chaque **widget** a le sien.

### 7.1 États du dashboard — exclusifs

| État | Déclencheur | Comportement |
|---|---|---|
| **Chargement de la disposition** | Au montage | La grille n'existe pas encore |
| **Erreur de disposition** | L'API de layout échoue | Erreur globale : il n'y a rien à afficher |
| **Vide** | Disposition chargée, aucune instance | Écran d'accueil, bouton « Ajouter mon premier widget » |
| **Nominal** | Disposition chargée, au moins une instance | La grille est rendue ; chaque widget vit sa vie |

### 7.2 États d'un widget — exclusifs par widget, simultanés dans la grille

| État | Comportement |
|---|---|
| **Chargement** | Squelette à la taille finale du widget |
| **Erreur** | Carte en erreur, message court, bouton *Réessayer* |
| **Chargé** | Rendu nominal |

En état **nominal du dashboard**, ces trois-là coexistent en permanence : un widget en squelette à côté d'un widget en erreur à côté d'un widget chargé. C'est le comportement recherché — un widget lent ou cassé ne dégrade pas les autres. Il n'existe donc **pas** d'état « le dashboard charge ses données ».

---

## 8. Critères d'acceptation de la v1

Vérifiés contre l'implémentation HTTP réelle (pas contre l'implémentation de persistance locale jetable du §6.4).

1. Un dashboard vide affiche l'écran d'accueil. Le bouton « Ajouter mon premier widget » **fait entrer en mode édition et ouvre la palette** ; le widget choisi reste un brouillon jusqu'à *Enregistrer*, comme n'importe quelle autre modification.
2. Un widget posé apparaît immédiatement, charge sa donnée, et affiche un squelette **à sa taille finale** pendant ce temps — la grille ne saute pas quand la donnée arrive.
3. Un widget dont l'endpoint échoue affiche une erreur locale ; les autres widgets et la disposition sont intacts.
4. Le mode édition affiche poignées, `✕`, traits de grille et boutons ; le mode lecture n'en montre aucun.
5. Un widget déplacé pousse ceux qu'il chevauche, en cascade, et l'aperçu de sa position de drop est visible pendant tout le drag. *(La définition exacte de « position de drop » dépend de §4.5 — critère à figer en conception.)*
6. *Annuler* restaure exactement la disposition enregistrée, y compris les positions des widgets poussés.
7. *Enregistrer* persiste, et la disposition survit à un rechargement complet de la page **et à un changement de navigateur** (donc côté serveur, pas côté client).
8. Un widget déjà posé apparaît désactivé dans la palette et ne peut pas être ajouté une seconde fois.
9. Sous 768px : widgets empilés en pleine largeur dans l'ordre de lecture, **et le bouton « Éditer le dashboard » lui-même n'est pas rendu** — pas seulement le mode inaccessible.
10. Une disposition contenant un type absent du catalogue se charge sans erreur, en ignorant ce type.
11. Un widget démonté en cours de chargement (supprimé, ou navigation) n'écrit pas dans un composant démonté et ne laisse pas de requête en vol. Vérifiable en développement sous StrictMode, où chaque effet part deux fois.

---

## 9. Décisions révisées et questions ouvertes

### 9.1 Révisions de l'ADR du 2026-06-15

Deux décisions actées sont renversées par cette analyse. À reporter dans `.xiaobot/decisions.md`, pas à laisser en contradiction silencieuse.

**Révision 1 — Le widget charge sa propre donnée (option B), pas le parent (option A).**
L'ADR retenait l'option A (« Body nourri par le parent, pur et testable »). Elle supposait des widgets configurables : il fallait bien que quelqu'un décide *quelle* donnée nourrir. Le catalogue préfabriqué supprime cette question — un type détermine son endpoint — et l'option A perd sa raison d'être.
*Garde-fou* : « le widget charge sa donnée » ne veut pas dire « le composant appelle `fetch` ». Le chargement vit dans un hook, le rendu reste un composant pur qui reçoit ses valeurs en props. La frontière testable est conservée, elle est simplement déplacée d'un cran.

**Révision 2 — Plus d'union discriminée dans la donnée d'instance.**
L'ADR modélisait `WidgetConfig` en union discriminée sur `type`, avec le `data` dans chaque branche pour préserver le narrowing. L'instance ne portant plus de `data`, il n'y a plus rien à discriminer : `type` redevient une simple clé, et le Registry est une table `archétype → composant` dont TypeScript vérifie l'exhaustivité par les clés. Cela clôt le TODO « `data` partagé sans narrowing » (2026-06-16) et le TODO « trancher la forme de `WidgetLayout` » (2026-06-15, repris le 06-16 sous « formaliser/renommer `shapeData` ») : il n'y a plus de type `WidgetLayout` du tout.

**Révision 3 — ⚠️ Le maison sur une grille 2D libre déclenche le critère de bascule de l'ADR.**
C'est la révision la plus lourde, et elle mérite une décision explicite.
L'ADR justifiait le développement maison ainsi : *« la complexité des libs vient de la collision/reflow 2D, pas du drag ; en restant sur du reorder (ordre dans un tableau, pas coordonnées pixel), le maison devient trivial »*. Et fixait comme condition de bascule : *« besoin de free-2D + collision + breakpoints responsive → basculer sur `react-grid-layout` ou `@dnd-kit` »*.
Ce CDC spécifie exactement free-2D (§4.1), collision avec cascade (§4.4) et un breakpoint responsive (§3.6). **La prémisse qui rendait le maison trivial a disparu.** Le maison reste défendable — pédagogiquement c'est même le cœur de l'exercice — mais il n'est plus « trivial » : il faut assumer d'écrire et de déboguer un moteur de layout. À trancher en conception, pas à laisser filer par inertie.

**Révision 4 — `localStorage` disparaît de la pyramide de persistance.**
L'ADR prévoyait `useState → localStorage → API Nest` comme trois étapes successives. Le CDC va directement à l'API (décision du 2026-09-05), et la marche intermédiaire est remplacée par l'interface de persistance du §6.4 avec une implémentation locale jetable. Le `localStorage` mentionné en §1 comme « écarté » désigne autre chose : un cache de **données métier**, jamais envisagé dans l'ADR.

**Révision 5 — Le responsive entre dans la v1.**
L'ADR le plaçait en étape 6, « plus tard ». Le CDC l'inclut (§3.6, critère 9) — sous une forme volontairement minimale : empilement, lecture seule, aucun layout par breakpoint à persister.

**Révision 6 — « Commit-on-drop » ne vaut que pour le widget déplacé.**
L'ADR prévoyait que la position reste locale pendant le drag et ne soit commitée qu'au `pointerup`, pour éviter N re-renders à 60 fps. La maquette n°3 impose que les widgets **poussés** bougent pendant le drag : leur position doit donc être recalculée en continu. Seule la position du widget déplacé peut rester transiente. L'optimisation ne disparaît pas, elle se réduit.

### 9.2 À trancher en conception

1. **Maison ou bibliothèque de layout** — cf. révision 3. Toutes les autres questions de cette liste en dépendent.
2. **Base du recalcul pendant le drag** — disposition d'avant le drag, ou provisoire précédent ? (§4.3)
3. **Compaction verticale** — les trous se referment-ils après un push ? (§4.5)
4. **Placement d'un widget ajouté** — première place libre, ou en bas ? (§4.6)
5. **Zone d'actions par page** — où vit le bouton *Éditer*, sachant que `MainHeader` est partagé par les six pages ? Se branche sur le TODO « unifier la source de vérité des sections » (2026-05-20), qui touche la même configuration `routes` / sidebar / pages.
6. **Sortie du mode édition avec des modifications non enregistrées** — jeter, demander, ou bloquer la navigation ?
7. **Définition d'une « modification »** pour le compteur du §3.2 — une action utilisateur, ou une instance dont `(x,y)` diffère de l'enregistré ? Dans le second cas un seul drag en cascade affiche « 4 modifications ».
8. **Formatage de la valeur** — le composant de rendu reçoit-il `1840` et formate, ou `"1 840 kcal"` déjà formaté ? Le catalogue portant l'unité, la première option se tient.
9. **Où vit le dispatch du Registry** — `<Widget>` fait le lookup lui-même, ou `<Dashboard>` choisit le Body et le passe en `children` ? (TODO ouvert du 2026-06-16, non tranché par ce CDC.)
10. **Contrat de props du Shell `<Widget>`** — TODO ouvert depuis le 2026-06-11. Le §3.2 en décrit l'anatomie visuelle, pas la signature.

### 9.3 Dette préalable à traiter avant ou pendant

Ces points bloquent ou parasitent le développement du système, et ne sont pas couverts par le CDC :

- **`Widget.tsx:5`** — `function Widget({instance: WidgetInstance})` est un renommage de destructuration, pas une annotation de type. Bug bloquant le rendu du composant central du système (2026-06-16).
- **`Dashboard.tsx:9`** — `useState([])` inféré `never[]` : le state d'orchestration ne peut rien contenir (2026-06-16).
- **`MainLayout.tsx:10`** — pas de comportement sous `md` : la sidebar s'empile pleine largeur au-dessus du contenu. Bloque le critère 9.
- **Zone d'actions par page** — n'existe pas dans `MainLayout`. Bloque le §3.1.

### 9.4 Reporté hors périmètre, à ne pas perdre

- **Recharts réservé au seul archétype `chart`** (TODO du 2026-06-11) — sans objet tant que `chart` est hors v1, à reprendre quand il arrivera.
- **Compatibilité `Tremor` ↔ Tailwind v4 sans `tailwind.config.js`** (TODO du 2026-06-11) — même échéance.

### 9.5 Signaux de bascule (à surveiller, pas à traiter)

- **Vers un endpoint d'agrégation** : si le nombre de widgets dépasse la poignée, ou si les chargements en cascade deviennent perceptibles à l'usage.
- **Vers une bibliothèque de data-fetching** : si le hook de chargement maison commence à réimplémenter du cache, de la déduplication ou du retry.
- **Vers une bibliothèque de layout** : le signal de l'ADR (« besoin de free-2D + collision + responsive ») est **déjà atteint** — cf. révision 3. Le signal résiduel, une fois ce choix assumé, devient : « je débogue plus ma géométrie que je ne construis de widgets ».
- **Vers un cache local** : si le temps de chargement devient visible à l'usage. Écarté en v1 pour ne pas gérer d'invalidation ni afficher de valeur périmée.
