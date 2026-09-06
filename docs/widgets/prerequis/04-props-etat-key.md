# Fiche 4 — Props, état, et identité

> **Taille** : moyenne · **Dépend de** : rien · **Débloque** : tout le rendu, et la correction de deux bugs ouverts dans ton code.

> Cette fiche se termine **sur ton vrai code**. `Widget.tsx:5` et `Dashboard.tsx:9` sont ses exercices d'application.

## Pourquoi tu en as besoin

Trois notions que tu as déjà croisées, et sur lesquelles ton code actuel a deux bugs. Ce n'est pas de l'ignorance — c'est un modèle mental venu de la POO qui ne colle pas. Cette fiche le remplace.

La troisième notion (`key`) est celle que presque personne ne comprend vraiment avant de s'y être brûlé, et elle décide directement de si ton dashboard relancera ou non des requêtes réseau à chaque pixel de drag.

---

## 1. Un composant reçoit un seul argument

Voilà la phrase qui règle le bug de `Widget.tsx:5` :

> **Un composant React est une fonction qui prend exactement un paramètre : l'objet des props.**

Quand tu écris `<Widget instance={x} titre="a" />`, React appelle `Widget({ instance: x, titre: "a" })`. Un objet. Toujours. Même avec zéro prop (`Widget({})`), même avec quinze.

Donc typer les props d'un composant, c'est typer **cet objet** :

```tsx
type ProfilProps = { nom: string; age: number };

function Profil({ nom, age }: ProfilProps) {
  return <p>{nom}, {age} ans</p>;
}
```

La destructuration `{ nom, age }` extrait les champs de l'objet reçu. L'annotation `: ProfilProps` type l'objet, pas les champs individuellement.

### Le piège exact de ton code

En TypeScript, `{ a: B }` dans une position de **paramètre** ne veut pas dire la même chose que dans une position de **type** :

```tsx
// Position de TYPE : "un objet avec un champ nom de type string"
type P = { nom: string };

// Position de PARAMÈTRE : "extrais le champ nom, et appelle-le string"
function f({ nom: string }) { /* ... */ }
//          └── renommage, pas annotation !
```

Dans le second cas, tu as créé une variable locale nommée `string`, de type implicite `any`. Aucune erreur de syntaxe, aucun avertissement évident — juste un composant qui ne reçoit rien de ce que tu crois.

C'est exactement ce qu'il y a dans `Widget.tsx:5` : `function Widget({instance: WidgetInstance})` crée une variable locale appelée `WidgetInstance`, et l'import de type au-dessus devient inutilisé.

La forme correcte sépare clairement les deux positions :

```tsx
function Widget({ instance }: { instance: WidgetInstance }) { ... }
//               └ paramètre ┘  └────── type ──────┘
```

**Le réflexe POO qui induit en erreur** : en Delphi, une méthode a des paramètres nommés et typés un par un. `procedure Dessiner(Instance: TWidgetInstance)`. Ici il n'y a qu'un paramètre, une enveloppe, et les « paramètres » sont ses champs.

## 2. L'état : `useState`

```tsx
const [valeur, setValeur] = useState(0);
```

Trois choses à comprendre.

**Le type se déduit de la valeur initiale.** `useState(0)` donne `number`. `useState("")` donne `string`. Et `useState([])` donne… `never[]` — un tableau qui ne peut contenir aucun élément, parce que TypeScript n'a aucun moyen de deviner ce que tu comptes y mettre.

C'est le bug de `Dashboard.tsx:9`. La correction est le paramètre générique :

```tsx
const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
```

**L'état se remplace, il ne se modifie pas.**

```tsx
// ✗ React ne verra rien : même référence
widgets.push(nouveau);
setWidgets(widgets);

// ✓ nouvelle référence
setWidgets([...widgets, nouveau]);
```

React compare l'ancienne et la nouvelle valeur avec `===`. Un tableau muté est identique à lui-même : aucun rendu. C'est la même exigence d'immutabilité que la fiche 3, pour la même raison.

**Le setter accepte une fonction.** Quand la nouvelle valeur dépend de l'ancienne, préfère cette forme :

```tsx
setWidgets((precedent) => [...precedent, nouveau]);
```

Elle te garantit de travailler sur la valeur à jour, même si plusieurs mises à jour s'enchaînent dans le même cycle.

## 3. `key` et l'identité — le morceau important

Quand React re-rend une liste, il doit répondre à une question : **quel élément du nouveau rendu correspond à quel élément de l'ancien ?**

`key` est ta réponse. Ce n'est pas une optimisation, ce n'est pas « pour aider React à aller plus vite » : c'est la **définition de l'identité** d'un élément dans le temps.

- Même `key` d'un rendu à l'autre → React considère que c'est le **même** élément. Il le **re-rend** : les props changent, l'état interne survit, les effets ne repartent pas.
- `key` différente → React considère que c'est un **autre** élément. Il **démonte** l'ancien et **monte** un neuf : état détruit, effets nettoyés puis relancés.

### Pourquoi `key={index}` casse

```tsx
{items.map((item, i) => <Compteur key={i} nom={item.nom} />)}
```

Trois compteurs, avec chacun un état interne (le nombre de clics) :

```
Rendu 1 :   key=0 → "Alice" (3 clics)
            key=1 → "Bob"   (7 clics)
            key=2 → "Carol" (1 clic)

On supprime Bob.

Rendu 2 :   key=0 → "Alice"    ← même key, état conservé : 3 clics ✓
            key=1 → "Carol"    ← même key qu'avant, React croit que c'est Bob !
                                 Carol hérite des 7 clics de Bob ✗
```

React n'a pas de bug : tu lui as dit que l'élément d'identité `1` existait dans les deux rendus. Il a conservé son état et changé ses props. Le résultat est un état qui migre sur le mauvais élément.

**Ce bug est invisible tant que tes composants n'ont pas d'état interne.** C'est exactement le cas de tes stubs actuels — `Widget.tsx` affiche « TEST WIDGET » et rien d'autre. Le jour où il chargera des données, l'état apparaîtra, et le bug avec lui.

### Ce que ça donne pour les widgets

```tsx
{widgets.map((instance) => (
  <Widget key={instance.type} instance={instance} />
))}
```

`instance.type` est stable pour toute la vie du widget. Le déplacer change `x` et `y` — donc ses **props** — mais pas son identité. React re-rend, ne remonte pas, l'état de chargement survit, aucune requête ne repart.

Compare avec ce qui arriverait autrement :

```tsx
<Widget key={`${instance.type}-${instance.x}-${instance.y}`} ... />   // ✗
```

Pendant un drag, `x` et `y` changent à chaque mouvement de souris. Chaque changement démonte et remonte le widget : requête annulée, requête relancée, squelette qui clignote. À 60 images par seconde. Un dashboard qui martèle ton API pendant que tu déplaces une carte.

C'est un des rares endroits où la décision « un seul exemplaire par type » te rend un service imprévu : elle te donne une identité **indépendante de la position**, ce qui est précisément ce dont `key` a besoin.

## 4. Re-render ≠ remontage

Deux mots qu'on confond, et deux comportements opposés :

| | Re-render | Remontage |
|---|---|---|
| Déclenché par | props ou état qui changent | `key` qui change, parent qui retire puis remet |
| État interne | **conservé** | **détruit** |
| Effets | rejoués seulement si leurs deps changent | nettoyés puis relancés |
| Coût | faible | élevé (requêtes relancées) |

Un composant peut être re-rendu des centaines de fois sans jamais être remonté. C'est le cas normal.

---

## Exercices

### Exercice 1 — Le paramètre unique

Écrire un composant qui affiche un nom et un âge, typé avec un type nommé. Puis, volontairement, écrire la version fautive `function X({ nom: string })` et observer ce que TypeScript infère pour la variable créée.

**Attendu** : tu peux expliquer, sans hésiter, la différence entre position de type et position de paramètre.

### Exercice 2 — `useState` typé

Écrire un composant avec un tableau vide en état initial, sans paramètre générique. Essayer d'y ajouter un élément.

**Attendu** : tu vois l'erreur `never`, tu la corriges avec le générique, et tu peux dire pourquoi elle apparaît.

### Exercice 3 — Le POC de `key`

Le plus important de la fiche.

Construire une page avec :
- une liste d'au moins quatre éléments, chacun rendu par un composant enfant ;
- **chaque enfant a un état interne visible** — un compteur avec un bouton « + » ;
- un bouton pour supprimer un élément au milieu de la liste ;
- la liste rendue avec `key={index}`.

Protocole :
1. Incrémente les compteurs avec des valeurs **différentes et mémorables** (1, 2, 3, 4).
2. Supprime le deuxième élément.
3. Regarde où sont passés les compteurs.

Puis remplace par une `key` stable (l'identifiant de l'élément) et refais le protocole.

**Attendu** : tu as vu de tes yeux les compteurs migrer sur les mauvais éléments, et tu peux expliquer pourquoi.

### Exercice 4 — Re-render vs remontage

Reprendre l'exercice 3. Ajouter dans l'enfant un affichage qui prouve un remontage (par exemple, un état initialisé avec un nombre aléatoire, qui change donc à chaque montage).

Faire varier une prop sans changer la `key`, puis faire varier la `key`.

**Attendu** : tu observes que le premier cas conserve le nombre et le second le change, et tu sais dire lequel est un re-render et lequel un remontage.

### Exercice 5 — L'immutabilité

Dans un composant, tenter d'ajouter un élément avec `push` puis `setState` avec le même tableau. Observer que rien ne se re-rend. Corriger.

**Attendu** : tu peux expliquer pourquoi le `push` ne déclenche rien.

### Exercice 6 — Sur ton vrai code

Corriger `Widget.tsx:5` (la signature de props) et `Dashboard.tsx:9` (le `useState` non typé).

**Attendu** : `Widget` reçoit et utilise réellement son instance, `widgets` peut contenir des `WidgetInstance`, et `npm run build` passe dans `apps/web`.

---

## Réussi quand

- Tu expliques la différence entre position de type et position de paramètre sans hésiter.
- Tu peux prédire ce qui arrive à l'état d'un enfant quand sa `key` change.
- Les deux bugs de ton code sont fermés.

---

## Les pièges

**`key={index}` « parce que la liste ne bouge pas ».** Elle bougera : c'est un dashboard où on ajoute et supprime. Et le bug est invisible jusqu'au jour où l'enfant a un état — donc jusqu'au jour où c'est coûteux à diagnostiquer.

**Mettre `key` sur le mauvais élément.** `key` va sur l'élément retourné par le `.map()`, celui du niveau le plus haut. Pas sur un enfant à l'intérieur.

**Croire que `key` est une prop.** Le composant ne la reçoit pas : `props.key` est `undefined`. C'est une instruction pour React, consommée avant l'appel. Si tu as besoin de la valeur dans l'enfant, passe-la deux fois : `key={id} id={id}`.

**Muter l'état puis appeler le setter.** `widgets[0].x = 3; setWidgets(widgets)` ne re-rend rien. Même cause que la fiche 3 : React compare les références.

**Composer une `key` à partir de données changeantes.** La position, un timestamp, un index — tout ce qui change au cours de la vie de l'élément est un mauvais candidat. Une `key` doit répondre à « qui est cet élément », pas à « où en est-il ».
