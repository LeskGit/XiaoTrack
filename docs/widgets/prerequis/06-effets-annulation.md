# Fiche 6 — Effets, nettoyage, annulation

> **Taille** : longue · **Dépend de** : fiches 2 et 4 · **Débloque** : `useWidgetData`, donc tout le chargement.

## Pourquoi tu en as besoin

C'est la brique la plus subtile du front. Elle produit des bugs qui ne se voient pas : une requête qui continue après un démontage, un état écrit dans le vide, un widget qui affiche « Erreur » alors que le réseau va très bien.

Et tu as choisi de l'écrire à la main plutôt que d'installer TanStack Query. C'est un bon choix — tu sauras ce que fait cette lib avant de décider si tu en veux une. Mais ça veut dire que ces bugs sont les tiens.

---

## 1. Ce qu'est un effet

Le rendu d'un composant doit être **pur** : mêmes props, même JSX, aucun effet de bord. Or charger des données est exactement un effet de bord.

`useEffect` est la porte de sortie : « après le rendu, exécute ceci ».

```tsx
useEffect(() => {
  console.log("après le rendu");
}, []);
```

Trois moments à distinguer :

```
   render()          effet             nettoyage
      │                │                   │
   calcule le JSX   après que le DOM   avant la prochaine
   (pur)            soit à jour        exécution, et au démontage
```

L'effet ne s'exécute **jamais** pendant le rendu. C'est pour ça qu'un composant doit toujours savoir se dessiner sans données : au premier rendu, la requête n'est même pas partie.

## 2. Le tableau de dépendances

Il contrôle **quand l'effet rejoue** :

```tsx
useEffect(fn, []);          // une fois, au montage
useEffect(fn, [url]);       // au montage, puis à chaque changement de url
useEffect(fn);              // après CHAQUE rendu — presque toujours une erreur
```

La comparaison est faite avec `Object.is`, c'est-à-dire par référence pour les objets. Conséquence importante :

```tsx
useEffect(fn, [{ url }]);   // ✗ un objet neuf à chaque rendu → rejoue toujours
useEffect(fn, [url]);       // ✓ une chaîne : comparée par valeur
```

Mets des primitives dans les dépendances. Si tu as besoin d'un objet, extrais-en les champs qui comptent.

## 3. Le nettoyage

L'effet peut retourner une fonction. React l'appelle :

- **avant chaque réexécution** de l'effet ;
- **au démontage** du composant.

```tsx
useEffect(() => {
  const id = setInterval(() => console.log("tic"), 1000);
  return () => clearInterval(id);      // sans ça : l'intervalle continue à jamais
}, []);
```

La règle à retenir : **tout ce que l'effet démarre, le nettoyage doit pouvoir l'arrêter.** Un intervalle, un écouteur d'événement, un abonnement, une requête réseau.

C'est le contrat le plus important de la fiche. Un effet sans nettoyage qui démarre quelque chose est une fuite.

## 4. StrictMode : le détecteur

Ton `main.tsx:8` enveloppe l'app dans `<StrictMode>`. En développement uniquement, React **monte chaque composant deux fois** :

```
monte → exécute l'effet → nettoie → exécute l'effet à nouveau
```

Ce n'est pas un bug et il ne faut surtout pas le désactiver. C'est un détecteur : il rend visibles immédiatement les effets qui ne se nettoient pas.

Un effet correctement écrit passe ce double montage sans rien changer d'observable. Un effet qui fuit produit deux intervalles, deux abonnements, ou deux requêtes dont l'une n'est jamais annulée.

Si tu vois deux requêtes dans l'onglet réseau en dev : normal. Si tu vois deux requêtes dont **aucune n'est annulée** : bug.

## 5. `AbortController`

L'outil standard pour annuler une opération asynchrone.

```tsx
const controleur = new AbortController();
fetch(url, { signal: controleur.signal });
controleur.abort();      // la promesse de fetch rejette
```

Le schéma dans un effet : créer le contrôleur au début, passer son signal à `fetch`, appeler `abort()` dans le nettoyage. Un contrôleur ne se réutilise pas — une fois abandonné, il l'est définitivement. Il en faut un neuf à chaque exécution de l'effet.

### Le piège majeur de toute la fiche

Quand tu appelles `abort()`, `fetch` **rejette** avec une erreur dont le `name` vaut `"AbortError"`. Si ton `catch` met tout ce qu'il reçoit dans l'état d'erreur :

- chaque démontage de widget affichera « Erreur » ;
- **en StrictMode, ce sera à chaque montage** — donc en permanence, en développement.

Tu chercheras du côté du réseau, de l'API, du CORS. Le bug est dans ton `catch`.

Il faut donc distinguer, dans le `catch`, une annulation d'une vraie erreur : une annulation est un événement normal, elle ne doit **rien** écrire dans l'état.

## 6. Ne pas écrire après démontage

Séquence classique :

```
t=0    le composant monte, la requête part
t=50   l'utilisateur supprime le widget → démontage
t=200  la réponse arrive → setState sur un composant qui n'existe plus
```

Avec un `AbortController` correctement branché, le cas ne se produit pas : la requête est annulée à t=50. C'est la solution propre.

L'alternative qu'on voit souvent — un drapeau booléen `annule` fermé dans la closure — évite l'écriture mais **laisse la requête courir**. Elle traite le symptôme, pas la cause. Utilise le contrôleur.

## 7. Un hook n'est pas un objet partagé

Point de modèle mental, et c'est l'inverse de ce que ton habitude de NestJS suggère.

Un `@Injectable()` en scope singleton, c'est **un** objet que tous les consommateurs partagent. Un hook, c'est du **code** partagé et de l'**état** séparé :

```
useWidgetData          ← une fonction, zéro état
   │
   ├── appelée dans <Widget A/>  → état A
   ├── appelée dans <Widget B/>  → état B
   └── appelée dans <Widget C/>  → état C
```

L'état ne vit pas « dans le hook » — le hook réserve un emplacement dans le composant qui l'appelle. Trois composants, trois emplacements, aucun lien entre eux.

**Corollaire mécanique** : un hook ne peut pas être appelé dans une boucle. React aligne les hooks sur des emplacements numérotés par **ordre d'appel** ; si le nombre d'appels varie d'un rendu à l'autre, tous les emplacements se décalent.

```tsx
// ✗ interdit — et c'est ce qui rend impossible « le Dashboard charge tout »
widgets.map((w) => useWidgetData(w.type));
```

C'est pour cette raison que « un état de chargement par widget » impose « un composant par widget ». Ce n'est pas un choix d'architecture, c'est une contrainte.

## 8. La forme du hook

Il retourne l'union de la fiche 2, jamais un objet à trois champs indépendants :

```ts
// ✓
function useWidgetData(url: string): WidgetDataState

// ✗ autorise { loading: true, error: "x", data: 42 }
function useWidgetData(url: string): { loading: boolean; error: string | null; data: T | null }
```

Le composant qui l'utilise fait un `switch` sur `status` et ne peut structurellement pas afficher une valeur pendant un chargement.

---

## Exercices

### Exercice 1 — Observer le cycle

Un composant avec un effet qui journalise « effet » et dont le nettoyage journalise « nettoyage ». Le monter, le démonter.

**Attendu** : tu constates le double montage de StrictMode et tu peux écrire dans l'ordre les quatre messages attendus.

### Exercice 2 — Les dépendances

Un effet dépendant d'une valeur modifiable par un bouton. Journaliser à chaque exécution. Tester `[]`, `[valeur]`, et sans tableau.

Puis mettre un objet littéral dans les dépendances et observer.

**Attendu** : tu peux prédire, avant de cliquer, si l'effet va rejouer.

### Exercice 3 — La fuite

Un composant qui démarre un intervalle **sans** nettoyage. Le monter et le démonter plusieurs fois en observant la console.

**Attendu** : tu vois les intervalles s'accumuler. Puis tu ajoutes le nettoyage et ils s'arrêtent.

### Exercice 4 — Le hook de chargement

Écrire un hook générique qui prend une URL et retourne l'union de la fiche 2. Il doit gérer le chargement, l'erreur, le succès, l'annulation au démontage, et distinguer l'annulation d'une vraie erreur.

Le tester contre un endpoint lent (n'importe quel service de délai, ou une fonction de fetch simulée avec un `setTimeout` de 3 secondes).

Trois scénarios obligatoires :

| # | Scénario | Attendu |
|---|---|---|
| 1 | Réponse normale | `loading` → `success` |
| 2 | Endpoint qui échoue (404, ou réseau coupé) | `loading` → `error` avec un message utile |
| 3 | **Démontage pendant le chargement** | requête annulée (visible dans l'onglet réseau), aucun avertissement en console, aucun état écrit après |

**Attendu** : les trois scénarios sont propres, y compris en StrictMode.

### Exercice 5 — L'indépendance

Monter trois composants utilisant le même hook avec trois URLs différentes, dont une qui échoue.

**Attendu** : trois états indépendants, l'échec de l'un n'affecte pas les autres.

### Exercice 6 — Le piège de l'AbortError

Écrire volontairement le `catch` fautif (qui met l'annulation dans l'état d'erreur). Observer le comportement en StrictMode.

**Attendu** : tu vois « Erreur » s'afficher alors que tout va bien, et tu comprends pourquoi. Puis tu corriges.

### Exercice 7 — La règle des hooks

Tenter d'appeler le hook dans un `.map()`. Lire l'erreur de l'ESLint et celle de React.

**Attendu** : tu peux expliquer pourquoi c'est interdit, en parlant d'ordre d'appel et non de « bonne pratique ».

---

## Réussi quand

- Le scénario 3 de l'exercice 4 est propre en StrictMode : requête annulée, console silencieuse.
- Tu peux expliquer, ligne par ligne, ce que ton nettoyage empêche.
- Tu sais dire pourquoi le Dashboard ne peut pas charger les données de tous ses widgets.

---

## Les pièges

**L'`AbortError` traité comme une erreur.** Le piège numéro un. Symptôme : un widget en erreur permanent en développement. Cause : trois lignes dans le `catch`.

**Désactiver StrictMode pour faire taire le double montage.** Tu ne supprimes pas le problème, tu supprimes le détecteur. Le bug réapparaîtra en production, où il sera plus difficile à reproduire.

**Un objet dans les dépendances.** Recréé à chaque rendu, donc jamais égal au précédent, donc l'effet rejoue en boucle. Symptôme : une requête toutes les 16 millisecondes.

**Réutiliser un `AbortController`.** Une fois abandonné, il l'est pour toujours : la requête suivante sera annulée immédiatement. Un contrôleur neuf par exécution d'effet.

**Le drapeau booléen au lieu de l'annulation.** Empêche l'écriture d'état mais laisse la requête consommer le réseau et la bande passante. Sur un dashboard où l'on ajoute et supprime des widgets, ça s'accumule.

**Oublier que l'effet ne tourne pas au premier rendu.** Le composant est rendu **avant** que la requête ne parte. S'il essaie de lire une valeur qui n'existe pas encore, il plante. C'est pourquoi l'état initial est `loading` et pas `success` avec des valeurs vides.
