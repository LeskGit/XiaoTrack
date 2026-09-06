# Fiche 10 — Premier feature-module NestJS

> **Taille** : longue · **Dépend de** : rien côté front · **Débloque** : la persistance de la disposition.

> **Périmètre strict** : cette fiche s'arrête **avant** la base de données. En mémoire seulement. La base fait l'objet d'une fiche 11 séparée, et la mêler à celle-ci est le meilleur moyen de ne finir ni l'une ni l'autre.

## Pourquoi tu en as besoin

`apps/api` est un squelette généré : `main.ts` démarre `AppModule`, qui contient un contrôleur et un service d'exemple. Pas de module métier, pas de base, pas de configuration, pas de CORS.

Le CDC demande deux opérations : lire la disposition d'un utilisateur, la remplacer entièrement. C'est le plus petit module métier possible — parfait pour apprendre la structure sans se battre avec le domaine.

---

## 1. Les trois briques

Nest impose une séparation que tu peux trouver cérémonieuse au début. Elle se justifie dès le deuxième module.

**Le contrôleur** parle HTTP. Il connaît les routes, les codes de statut, la forme des requêtes. Il ne contient **aucune** logique métier — il traduit une requête HTTP en appel de service et le retour en réponse.

**Le service** contient la logique. Il ne sait pas qu'il existe du HTTP. On doit pouvoir l'appeler depuis un contrôleur, un job planifié ou un test, sans rien changer.

**Le module** déclare ce qui existe et ce qui est visible : quels contrôleurs, quels services, quels services sont exportés vers d'autres modules.

```
Requête HTTP → Contrôleur → Service → (plus tard : base)
                    ↑           ↑
                    └─ Module déclare les deux ─┘
```

La règle qui tranche les cas douteux : **si tu écris un `if` métier dans un contrôleur, il est au mauvais endroit.**

## 2. L'injection de dépendances

C'est le point où ton habitude Delphi va tirer dans l'autre sens.

En Delphi, tu instancies : `Service := TDashboardService.Create;` — tu décides quand, et tu es responsable du `Free`.

En Nest, tu **déclares un besoin** :

```ts
@Injectable()
export class DashboardService { }

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly service: DashboardService) {}
}
```

Personne n'écrit `new DashboardService()`. Nest lit les types du constructeur, construit le graphe de dépendances au démarrage, instancie dans le bon ordre et fournit.

**Ce que ça t'achète** : dans un test, tu remplaces le service par un faux sans toucher au contrôleur. Le contrôleur ne connaît pas la provenance de sa dépendance — il n'a jamais écrit `new`.

**Le scope par défaut est singleton** : une seule instance pour toute l'application, partagée par tous les consommateurs. C'est l'inverse d'un hook React (fiche 6), qui produit un état par appelant. Deux mots proches — « réutiliser » — pour deux comportements opposés.

**Le piège classique** : oublier de déclarer le service dans les `providers` du module. L'erreur au démarrage est explicite (« Nest can't resolve dependencies… »), mais elle fait peur la première fois. Elle dit toujours la même chose : *tu m'as demandé X, je ne sais pas le fabriquer*.

## 3. Le cycle d'une requête

```
requête
   ↓
[middleware]      – transversal, avant tout
   ↓
[guard]           – autorisation : passe ou non
   ↓
[pipe]            – validation et transformation du corps
   ↓
CONTRÔLEUR        – la méthode de route
   ↓
service           – la logique
   ↓
[intercepteur]    – transformation de la réponse
   ↓
réponse
```

En v1 tu n'as besoin que du contrôleur, du service et d'un pipe de validation. Mais connais l'ordre : c'est ce qui te dira où mettre les choses plus tard (l'authentification est un guard, pas un `if` dans chaque contrôleur).

## 4. Les DTO et la validation

Un DTO (*Data Transfer Object*) décrit la forme d'un corps de requête. Et surtout : **il faut valider ce qui entre.**

Un `type` TypeScript ne suffit pas. Les types disparaissent à la compilation ; à l'exécution, ton corps de requête est un objet arbitraire, envoyé par n'importe qui. Rien ne garantit que `x` est un entier — ni même qu'il existe.

L'approche standard Nest : une classe DTO annotée avec des décorateurs de validation (`class-validator`), et un pipe global qui les applique. Un corps invalide devient un 400 automatique, avant que ton contrôleur ne s'exécute.

Pour ta disposition, les règles à poser : `type` est une chaîne non vide, `x` et `y` sont des entiers positifs, `widgets` est un tableau. Et une contrainte métier que le validateur ne fera pas tout seul : **les `type` doivent être uniques** dans le tableau (l'invariant du §2.2 du CDC).

Le rappel qui vaut pour tout le reste de ta carrière : **le client n'est jamais digne de confiance**, même si c'est ton propre front.

## 5. CORS

Ton front sert sur `localhost:5173`, ton API sur `localhost:3000`. Origines différentes : le navigateur bloque par défaut.

Symptôme caractéristique : la requête apparaît dans l'onglet réseau, l'API répond correctement (tu le vois dans ses logs), et le front reçoit une erreur. Le blocage est **côté navigateur**, après la réponse.

Nest a un interrupteur pour ça dans `main.ts`. Le point à comprendre : autorise ton origine de développement précisément, pas `*`. Un `*` fonctionne, s'oublie, et se retrouve en production.

## 6. Configuration et variables d'environnement

Le port est déjà surchargeable par `PORT` dans ton `main.ts`. Pour la suite (URL de base, origine autorisée), Nest a un module de configuration dédié qui charge un `.env` et expose les valeurs par injection.

Deux règles : **aucun secret dans le dépôt**, et un `.env.example` versionné qui liste les clés attendues sans les valeurs.

## 7. La forme de l'API

Rappel du CDC (§6.3) : deux opérations, pas plus.

- **Lire** la disposition de l'utilisateur.
- **Remplacer** la disposition de l'utilisateur.

Pas de route par widget. La disposition est un tout cohérent : la remplacer entièrement supprime toute question de synchronisation partielle, et correspond exactement à ce que fait le bouton *Enregistrer*.

Question à te poser en concevant les routes : **remplacer une ressource entière, quel verbe HTTP ?** Et : que doit répondre la lecture quand l'utilisateur n'a **aucune** disposition — une erreur, ou une liste vide ? (Le §7.1 du CDC distingue l'état « vide » de l'état « erreur de disposition » : ta réponse doit permettre au front de faire la différence.)

## 8. Tester

`apps/api` a déjà Jest configuré, en ligne dans son `package.json`. Deux niveaux :

- **Test unitaire du service** : c'est de la logique pure, comme la fiche 3. Instancie, appelle, vérifie.
- **Test du contrôleur** : Nest fournit un module de test qui construit un graphe de dépendances avec de faux services.

Commence par le service. Le contrôleur ne contient presque rien — c'est justement le but.

---

## Exercices

### Exercice 1 — Le module vide

Créer un module `dashboard` avec son contrôleur et son service, et l'enregistrer dans `AppModule`. Une seule route qui retourne une chaîne en dur.

**Attendu** : la route répond. Tu sais quels fichiers ont dû être créés et modifiés.

### Exercice 2 — L'erreur d'injection

Retirer volontairement le service des `providers` du module. Démarrer.

**Attendu** : tu lis le message d'erreur et tu peux dire exactement ce que Nest te reproche. C'est l'erreur que tu verras le plus souvent — apprivoise-la maintenant.

### Exercice 3 — Les deux routes

Implémenter la lecture et le remplacement de la disposition, **en mémoire** : un simple champ dans le service, indexé par identifiant d'utilisateur (une valeur en dur suffit, il n'y a pas d'authentification).

**Attendu** : tu écris une disposition, tu la relis, tu retrouves la même. Tu redémarres l'API, elle est perdue — c'est normal et attendu.

### Exercice 4 — La validation

Ajouter des DTO validés. Envoyer volontairement des corps invalides : un `x` en chaîne de caractères, un `y` négatif, un champ manquant, un tableau contenant deux fois le même `type`.

**Attendu** : chaque cas produit un 400 avec un message utile, et **aucun** n'atteint le corps de ton contrôleur.

### Exercice 5 — Le CORS

Appeler l'API depuis le front. Constater le blocage. Le résoudre.

**Attendu** : tu reconnais le symptôme (l'API répond, le front reçoit une erreur) et tu sais que le problème est côté navigateur, pas côté serveur.

### Exercice 6 — Le test du service

Écrire un test unitaire du service : écrire une disposition, la relire, vérifier. Puis tester le cas de l'utilisateur sans disposition.

**Attendu** : deux tests verts avec le Jest existant.

### Exercice 7 — Le test du contrôleur

Écrire un test du contrôleur avec un faux service.

**Attendu** : le test passe sans que le vrai service soit instancié. Tu as vu concrètement à quoi sert l'injection de dépendances.

### Exercice 8 — Le tour complet

Depuis le front, charger la disposition au montage et l'enregistrer sur un bouton.

**Attendu** : la disposition survit à un rechargement de la page, et disparaît au redémarrage de l'API.

---

## Réussi quand

- Le front lit et écrit une disposition via l'API, CORS traversé.
- Un corps invalide est rejeté avant ton code.
- Le service est testé, le contrôleur aussi.
- Redémarrer l'API perd les données — et tu sais que c'est le comportement voulu de cette fiche.

---

## Les pièges

**Vouloir brancher la base dans cette fiche.** Tu additionnerais Nest, un ORM et les migrations. Trois apprentissages simultanés, aucun terminé. Le service en mémoire est une étape, pas un raccourci honteux : il te donne un contrat d'API stable contre lequel le front se développe pendant que tu apprends la persistance.

**Mettre la logique dans le contrôleur.** Tentant quand il n'y a que deux routes. Puis il y en a six, et le service ne sert plus à rien. Tiens la séparation dès la première ligne.

**`enableCors()` sans argument.** Autorise toutes les origines. Marche, s'oublie, part en production.

**Faire confiance au corps de la requête.** « C'est mon propre front qui l'envoie » est vrai jusqu'au jour où quelqu'un appelle l'API directement — ou jusqu'à un bug du front qui envoie `x: undefined` et corrompt silencieusement la disposition enregistrée.

**Croire qu'un `type` TypeScript valide quoi que ce soit à l'exécution.** Les types sont effacés à la compilation. La validation est une opération d'exécution, elle a besoin de code d'exécution.

**Réinventer l'authentification.** Il n'y en a pas dans le projet, et ce n'est pas cette fiche qui l'introduira. Un identifiant d'utilisateur en dur suffit. Quand l'authentification viendra, ce sera un guard — et ton contrôleur ne changera pas.

---

## Décision à prendre avant la fiche 11

L'ORM et le SGBD. Prisma, TypeORM, ou du SQL direct ? Postgres, SQLite ?

Ce n'est **pas** une question pour maintenant : elle n'a aucune influence sur cette fiche, précisément parce que le service est en mémoire. Mais elle devra être tranchée — et documentée en ADR — avant d'écrire la première migration.
