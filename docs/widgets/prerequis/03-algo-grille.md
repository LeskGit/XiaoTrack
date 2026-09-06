# Fiche 3 — L'algorithme de grille

> **Taille** : longue · **Dépend de** : fiches 0, 1, 2 · **Débloque** : tout le drag. C'est le cœur du moteur.

> **Zéro React. Zéro DOM. Zéro navigateur.** Uniquement des fonctions, des types et des tests. Si tu ouvres un composant pendant cette fiche, tu t'es trompé de fiche.

## Pourquoi tu en as besoin

C'est le seul endroit où ce projet peut vraiment se planter. Tout le reste est de l'assemblage de briques connues ; ça, c'est de l'algorithmique que tu dois écrire toi-même.

C'est aussi, paradoxalement, la partie la plus facile à vérifier — parce qu'elle ne dépend de rien. Une fonction qui prend une liste de rectangles et en retourne une autre se teste avec une trentaine de lignes et zéro clic de souris. C'est pour cette raison qu'elle est en fiche 3 et pas en fiche 8 : tu dérisques le projet avant d'avoir construit quoi que ce soit par-dessus.

---

## 1. La fonction pure

Une fonction est **pure** quand :

- elle retourne toujours la même sortie pour les mêmes entrées ;
- elle ne modifie rien en dehors d'elle-même (pas de variable globale, pas de mutation de ses arguments, pas d'écriture réseau ou console).

```ts
// pure
function tva(montantHT: number, taux: number): number {
  return montantHT * (1 + taux);
}

// impure : dépend de l'horloge, et écrit ailleurs
let compteur = 0;
function facturer(montant: number): number {
  compteur++;
  return montant * (new Date().getFullYear() > 2025 ? 1.21 : 1.20);
}
```

Pourquoi ça compte ici : une fonction pure se teste **sans rien préparer**. Pas de base à peupler, pas de composant à monter, pas de faux navigateur. Tu l'appelles, tu compares. Et quand un test échoue, la cause est forcément dans la fonction — il n'y a nulle part ailleurs où chercher.

L'algorithme de grille sera pur. C'est un choix, pas une fatalité : on pourrait écrire une fonction qui modifie directement l'état React. Ce serait intestable.

## 2. L'immutabilité

Corollaire direct : ta fonction ne doit **pas modifier le tableau qu'elle reçoit**.

```ts
// ✗ mute l'entrée
function decaler(items: Point[]): Point[] {
  items.forEach((it) => { it.y += 1; });   // modifie les objets de l'appelant
  return items;                            // et rend la même référence
}

// ✓ produit du neuf
function decaler(items: Point[]): Point[] {
  return items.map((it) => ({ ...it, y: it.y + 1 }));
}
```

Deux raisons, et la seconde est celle qui te mordra :

1. **Testabilité.** Une fonction qui mute ses entrées rend les tests dépendants de leur ordre d'exécution.
2. **React ne verra pas le changement.** React compare les références (`===`). Si tu retournes le même tableau muté, `setWidgets(resultat)` ne déclenchera aucun rendu — ton algorithme sera parfait et ton dashboard immobile. Tu chercheras le bug dans l'algorithme, il sera dans le `return`.

Attention au piège du `map` avec spread : `{ ...it }` est une copie **superficielle**. Ici tes objets sont plats (`type`, `x`, `y`, `w`, `h`), donc c'est suffisant. Le jour où un objet imbriqué apparaît, la copie superficielle partagera la référence interne.

## 3. Le chevauchement, en une dimension d'abord

Avant les rectangles, les segments. Prends deux réservations de salle, chacune définie par un début et une durée :

```
A : début 9, durée 2   → occupe 9, 10        (mais pas 11)
B : début 11, durée 1  → occupe 11
```

Se chevauchent-elles ? Non. Elles sont **adjacentes**.

Le raisonnement à retenir : plutôt que de chercher quand deux segments se chevauchent (beaucoup de cas), cherche quand ils **ne** se chevauchent **pas**. Il n'y en a que deux :

```
A finit avant que B commence :        [AAAA]  [BBBB]
B finit avant que A commence :        [BBBB]  [AAAA]
```

Dans tous les autres cas, ils se chevauchent. Négocie ça une bonne fois et tu tiens la formule.

Le détail qui décide de tout : **« finit avant que l'autre commence » ou « finit au moment où l'autre commence » ?** Un segment de début 9 et durée 2 occupe les positions 9 et 10. Sa fin *exclusive* est 11. Un segment qui commence en 11 ne le touche pas. Si tu traites la fin comme inclusive, tes widgets se colleront les uns aux autres et tu passeras une soirée à comprendre pourquoi.

C'est la convention **demi-ouverte** `[début, début + taille[`, la même que `Array.slice`.

## 4. Puis en deux dimensions

Deux rectangles se chevauchent si et seulement si **leurs projections se chevauchent sur les deux axes**. Pas un, pas « au moins un » : les deux.

```
     0  1  2  3  4  5              0  1  2  3  4  5
  0  A  A  A                    0  A  A  A
  1  A  A  A  B  B              1  A  A  A
  2        B  B                 2        B  B  B
  
  chevauchement en x (col 2)    pas de chevauchement en x :
  chevauchement en y (ligne 1)  A occupe 0-2, B occupe 3-5
  → collision                   → pas de collision, même si y se recoupe
```

Cette propriété t'offre une optimisation gratuite : teste l'axe horizontal d'abord et sors immédiatement si c'est faux. Dans un dashboard, la plupart des paires de widgets ne partagent aucune colonne.

## 5. La propagation : file plutôt que récursion

Quand tu déplaces `M` sur un widget `A`, tu descends `A`. Mais `A` descendu peut heurter `B`, qui heurte `C`. C'est la cascade.

Deux façons de la parcourir :

**Récursion** — « je pousse A, et dans la foulée je m'occupe de ce que A pousse ». Naturelle à écrire, mais la pile grandit avec la profondeur et la logique devient difficile à suivre quand un widget est poussé par deux sources.

**File** — plus simple à raisonner :

```
file ← [M]
tant que la file n'est pas vide :
    P ← dépiler
    pour chaque W qui chevauche P :
        déplacer W sous P
        empiler W
```

Le principe : traiter un élément, empiler ses conséquences, recommencer. On ne raisonne jamais sur plus d'un élément à la fois.

**Terminaison** : chaque déplacement pousse un widget vers le bas, sur une grille non bornée en bas. Aucun widget ne peut être poussé indéfiniment par un cycle, parce qu'il n'y a pas de cycle possible — on ne descend jamais quelqu'un au-dessus de soi.

**Un même widget peut être empilé plusieurs fois.** Poussé par `M`, puis re-poussé par un widget lui-même poussé. Ce n'est pas un bug, c'est le fonctionnement normal — mais sache-le, sinon tu croiras que ton algorithme boucle.

## 6. Écrire les tests pendant, pas après

La méthode qui marche sur cette fiche :

1. Écris **un** cas de test, le plus simple. Regarde-le échouer.
2. Écris le minimum de code pour le faire passer.
3. Cas suivant.

Tu n'écris pas l'algorithme complet pour découvrir ensuite qu'il rate trois cas. Tu construis un filet en même temps que le trapèze.

Le tableau de cas de la section Exercices est ton cahier de recette. Coche-les dans l'ordre : chacun est plus dur que le précédent.

## 7. Le coût

Cette fonction tournera **à chaque mouvement de souris**, soit potentiellement 60 fois par seconde.

L'implémentation naïve compare chaque widget à chaque autre : de l'ordre de n² comparaisons. Avec 10 widgets, 100 comparaisons — invisible. Avec 50, 2 500 — encore invisible. Tu es très loin d'un problème, mais tu dois le **savoir** plutôt que l'espérer : d'où l'exercice de mesure.

Retiens la démarche plus que le chiffre : on mesure avant d'optimiser, et on n'optimise pas ce qu'on n'a pas mesuré.

---

## Exercices

### Exercice 1 — Le modèle

Définir le type d'un rectangle placé sur la grille : un identifiant, une position `x`/`y`, une taille `w`/`h`, tous entiers.

**Attendu** : un type simple, plat, sans champ optionnel. Cinq propriétés.

### Exercice 2 — Le chevauchement, cas par cas

Écrire la fonction qui dit si deux rectangles se chevauchent. **Commence par écrire les tests.**

| # | Situation | Attendu |
|---|---|---|
| 1 | Deux rectangles très éloignés | faux |
| 2 | Rectangles identiques | vrai |
| 3 | Recouvrement partiel sur les deux axes | vrai |
| 4 | Un rectangle entièrement contenu dans l'autre | vrai |
| 5 | Même ligne : `x=0,w=3` et `x=3,w=3` | **faux** — adjacents |
| 6 | Même colonne : `y=0,h=2` et `y=2,h=2` | **faux** — adjacents |
| 7 | Colonnes communes, lignes disjointes | faux |
| 8 | Lignes communes, colonnes disjointes | faux |
| 9 | Un seul coin en commun (`x=0,y=0,w=2,h=2` et `x=2,y=2,w=2,h=2`) | faux |

**Attendu** : les neuf passent. Les cas 5, 6 et 9 sont ceux qui comptent — écris-les en premier.

### Exercice 3 — La résolution

Écrire la fonction qui prend la liste des autres rectangles et le rectangle déplacé (à sa position candidate), et retourne la nouvelle liste sans chevauchement, en appliquant la règle du §4.4 du CDC.

| # | Situation | Attendu |
|---|---|---|
| 1 | Position candidate libre | liste identique en contenu |
| 2 | Un seul gêneur | il passe juste sous le déplacé |
| 3 | Deux gêneurs côte à côte | les deux descendent, indépendamment |
| 4 | Cascade A → B → C | les trois positions finales sont correctes |
| 5 | Widget gêné par deux widgets eux-mêmes poussés | il finit sous **le plus bas** des deux |
| 6 | Liste vide | ne plante pas |
| 7 | Le déplacé dépasse la colonne 11 | comportement défini — à toi de choisir, borner ou rejeter, et de le tester |
| 8 | **Idempotence** : rejouer la fonction sur son propre résultat | résultat inchangé |
| 9 | **Non-mutation** : le tableau d'entrée est intact après l'appel | vérifié par une assertion explicite |

**Attendu** : les neuf passent. Le 8 et le 9 sont les plus révélateurs — ils échouent souvent alors que tous les autres passent.

### Exercice 4 — La mesure

Générer 50 rectangles disposés sur la grille, mesurer le temps d'un appel à la résolution, l'afficher.

**Attendu** : tu connais l'ordre de grandeur (microsecondes ? millisecondes ?) et tu sais dire si 60 appels par seconde posent un problème.

### Exercice 5 — Le cas tordu

Construis toi-même le cas qui te semble le plus susceptible de casser ton implémentation. Écris-le. S'il passe, cherches-en un pire.

**Attendu** : tu as trouvé au moins un cas auquel tu n'avais pas pensé en écrivant le code. Si tu n'en trouves aucun, c'est en général que tu n'as pas assez cherché.

---

## Réussi quand

- Les 18 cas des exercices 2 et 3 passent.
- Tu connais le coût d'un appel.
- Le tableau d'entrée n'est jamais modifié.
- Tu peux relancer la suite après avoir changé une ligne de l'algorithme et savoir en deux secondes si tu as cassé quelque chose.

C'est ce dernier point qui justifie toute la fiche 0.

---

## Les pièges

**L'adjacence.** Le piège numéro un, et de très loin. Un rectangle en `x=0` de largeur `3` occupe les colonnes 0, 1 et 2 — **pas** la 3. Une comparaison avec `>=` là où il faut `>` colle tous tes widgets les uns aux autres, sans jamais lever d'erreur. Écris le cas 5 en tout premier.

**Retourner le tableau muté.** Il passera tes tests si tu ne testes pas la non-mutation, et produira un dashboard qui ne se redessine jamais. Le cas 9 de l'exercice 3 existe pour ça.

**Oublier de retirer le widget déplacé du jeu.** Il se chevauche avec lui-même, se pousse lui-même, et tu obtiens un widget qui fuit vers le bas de l'écran.

**Traiter les gêneurs dans l'ordre du tableau.** L'ordre du tableau n'a rien à voir avec l'ordre géométrique. Un widget bas traité avant un widget haut donne un résultat différent — et faux. Trie sur `y`.

**Confondre « ne bouge plus » et « idempotent ».** Ton algorithme peut converger après deux appels et ne pas être idempotent au premier. Le cas 8 le détecte ; sans lui, tu auras des widgets qui dérivent d'un cran à chaque mouvement de souris.

**Vouloir gérer la compaction ici.** Elle n'est pas tranchée (§4.5 du CDC) et c'est une passe **séparée**, à écrire et tester à part. Ne la mélange pas à la résolution : tu ne saurais plus lequel des deux est en cause quand un cas échoue.
