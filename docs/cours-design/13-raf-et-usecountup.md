# 13. Animer en JavaScript : requestAnimationFrame et useCountUp

> **Prérequis :** chapitres 10 (transitions et courbes d'accélération) et 11 (`@keyframes`). **Lecture :** ~15 min. **Fichiers concernés :** `hooks/useCountUp.ts`, `bodies/StatBody.tsx`, `widget-grid.css`.

## 1. Le problème

Quand un widget « Daily calories » apparaît, on veut que son chiffre défile de 0 jusqu'à 1 840, comme un compteur. C'est un petit effet, mais il dit à l'œil « cette valeur vient d'arriver ».

En CSS, tu ne peux pas faire ça simplement. Une transition ou une animation `@keyframes` fait varier une **propriété de style** (`opacity`, `translate`, `color`...). Ici, ce qui change, c'est le **texte** affiché dans un `<p>` : « 0 », puis « 312 », puis « 1,207 »... Aucune propriété CSS ne contient ce texte. Il existe une astuce à base de `@property` et de compteurs CSS, mais elle est lourde, et elle ne sait pas formater un nombre (« 1,840 » avec sa virgule).

Il faut donc que JavaScript recalcule le nombre et que React l'affiche, plusieurs dizaines de fois par seconde. Reste à savoir **quand** recalculer : c'est le rôle de `requestAnimationFrame`.

## 2. La notion

### La boucle d'affichage du navigateur

Ton écran se rafraîchit à une fréquence fixe, le plus souvent 60 fois par seconde (60 Hz), parfois 120 ou 144 sur les écrans récents. À chaque rafraîchissement, le navigateur peut produire une nouvelle **image** (on dit aussi *frame*). Entre deux images, il fait toujours le même travail, dans cet ordre :

```
 ┌──────────── une image (~16,7 ms à 60 Hz) ────────────┐
 │ 1. JS en attente (clics, timers...)                  │
 │ 2. callbacks requestAnimationFrame   ← on calcule ici │
 │ 3. style  → 4. mise en page (layout) → 5. peinture    │
 └──────────────────────────────────────────────────────┘
```

Une animation fluide, c'est une animation qui produit **une nouvelle valeur par image**, ni plus (du travail perdu), ni moins (des saccades).

### requestAnimationFrame

`requestAnimationFrame(callback)`, souvent abrégé **rAF**, dit au navigateur : « juste avant de dessiner la prochaine image, appelle `callback` ». Le callback reçoit un argument : l'heure exacte de cette image, en millisecondes (un nombre à virgule, comme `1532.4`).

- Ça ne s'exécute **qu'une fois**. Pour animer, le callback se redemande lui-même : c'est une boucle.
- `requestAnimationFrame` renvoie un numéro. `cancelAnimationFrame(numéro)` annule l'appel prévu, ce qui arrête la boucle.
- Si l'onglet est caché, le navigateur suspend les rAF. Avec `setInterval`, l'animation continuerait de tourner pour rien, et elle ne serait pas calée sur les images de l'écran.

### performance.now()

`performance.now()` donne l'heure actuelle, en millisecondes, **sur la même horloge** que l'argument reçu par le callback rAF. On l'utilise pour noter l'heure de départ : `now - start` donne le temps écoulé depuis le début de l'animation.

### La progression de 0 à 1

Toute animation se ramène à un nombre, la **progression**, qui va de 0 (début) à 1 (fin) :

```
progress = min((now - start) / durée, 1)
```

À mi-parcours (350 ms sur 700 ms), `progress = 0.5`. Le `min(…, 1)` empêche de dépasser 1 si une image arrive en retard.

### La fonction d'accélération

Si on affiche `from + (target - from) * progress`, le compteur avance à vitesse constante. C'est mécanique et peu naturel. On passe donc la progression dans une **fonction d'accélération** (*easing*), le même concept que les `cubic-bezier` du chapitre 10, mais écrit à la main :

```
easeOutCubic(p) = 1 - (1 - p)³
```

| `p` (temps) | 0 | 0,25 | 0,5 | 0,75 | 1 |
|---|---|---|---|---|---|
| `easeOutCubic(p)` (distance parcourue) | 0 | 0,58 | 0,875 | 0,98 | 1 |

À la moitié du temps, on a déjà fait 87,5 % du chemin : le compteur file au début et ralentit en arrivant. C'est le même esprit que `--ease-out-soft`.

### L'interpolation

On passe enfin de la progression « adoucie » à la valeur à afficher :

```
valeur = from + (target - from) * eased
```

Avec `from = 0`, `target = 1840` et `eased = 0.875`, on affiche 1 610.

## 3. Exemple minimal

Colle ceci dans un fichier `compteur.html` et ouvre-le dans ton navigateur :

```html
<p id="out" style="font: 600 48px system-ui; font-variant-numeric: tabular-nums">0</p>
<button id="go">Compter jusqu'à 1840</button>
<script>
  const out = document.getElementById("out");
  let frame;

  document.getElementById("go").onclick = () => {
    cancelAnimationFrame(frame);          // si une animation tourne déjà, on l'arrête
    const start = performance.now();
    const target = 1840;

    const tick = (now) => {
      const progress = Math.min((now - start) / 700, 1);
      const eased = 1 - (1 - progress) ** 3;
      out.textContent = Math.round(target * eased).toLocaleString("en");
      if (progress < 1) frame = requestAnimationFrame(tick);   // on redemande l'image suivante
    };
    frame = requestAnimationFrame(tick);
  };
</script>
```

Ce que tu dois observer : le nombre monte vite, puis ralentit avant de s'arrêter pile sur « 1,840 ». Remplace `eased` par `progress` dans le calcul : le compteur avance à vitesse constante, et tu verras tout de suite que c'est moins agréable.

## 4. Dans XiaoTrack

### Le hook : [useCountUp.ts](../../apps/web/src/components/widgets/hooks/useCountUp.ts)

```ts
 4  const COUNT_UP_MS = 700;
 ...
10  export const useCountUp = (target: number, durationMs: number = COUNT_UP_MS): number => {
11      const [display, setDisplay] = useState(0);
12      // Where the next animation starts: the value currently shown (an interrupted count keeps going from there)
13      const fromRef = useRef(0);
14
15      useEffect(() => {
16          const from: number = fromRef.current;
17          const instant: boolean = prefersReducedMotion();
18          const start: number = performance.now();
19          let frame: number;
20
21          const tick = (now: number) => {
22              const progress: number = instant ? 1 : Math.min((now - start) / durationMs, 1);
23              // easeOutCubic: fast at first, slows down near the target
24              const eased: number = 1 - (1 - progress) ** 3;
25              const value: number = from + (target - from) * eased;
26              fromRef.current = value;
27              setDisplay(value);
28              if (progress < 1) frame = requestAnimationFrame(tick);
29          };
30
31          frame = requestAnimationFrame(tick);
32          return () => cancelAnimationFrame(frame);
33      }, [target, durationMs]);
34
35      return display;
36  };
```

Ligne par ligne :

- **l. 4** : la durée par défaut, 700 ms. Un peu plus longue que `--motion-slow` (400 ms), parce qu'un nombre a besoin de temps pour être « lu » en train de monter.
- **l. 10** : un hook personnalisé. Il reçoit la valeur cible et renvoie la valeur **à afficher maintenant**. Le composant qui l'utilise n'a pas à savoir qu'il y a une animation.
- **l. 11** : `display` est un **état** React, parce que chaque changement doit redessiner le composant. On part de 0 au montage.
- **l. 13** : `fromRef` est une **référence**, pas un état. Elle garde la dernière valeur calculée sans provoquer de nouveau rendu. On s'en sert au moment où une nouvelle animation démarre (l. 16).
- **l. 15 et 33** : l'effet se relance à chaque changement de `target` (ou de durée). Si la source renvoie une nouvelle valeur, une nouvelle animation part.
- **l. 16** : le point de départ est la valeur **actuellement affichée**. Si la cible change en pleine animation (on est à 900, et la cible passe de 1 840 à 2 000), le compteur repart de 900, sans retour brutal à 0.
- **l. 17** : si le système demande moins d'animations, on saute directement à la fin (chapitre 16).
- **l. 18** : l'heure de départ, sur la même horloge que `now` (l. 21).
- **l. 19** : `frame` est déclaré avec `let`, parce qu'il change à chaque image (l. 28). La fonction de nettoyage (l. 32) lit toujours la **dernière** valeur, puisqu'elle partage la même variable.
- **l. 22** : la progression de 0 à 1. Avec `instant`, elle vaut 1 dès la première image : une seule image, directement à la cible.
- **l. 24** : `easeOutCubic`, écrit à la main. `**` est l'opérateur puissance en JavaScript.
- **l. 25** : l'interpolation. Le résultat est un nombre à virgule (1 610,3...), le formatage viendra plus tard.
- **l. 26** : on mémorise la valeur affichée, pour la prochaine animation éventuelle (l. 16).
- **l. 27** : on met l'état à jour, React redessine. Pendant 700 ms, cela fait environ 42 rendus de `StatBody` : c'est sans danger pour un composant aussi petit.
- **l. 28** : tant qu'on n'est pas au bout, on redemande l'image suivante.
- **l. 32** : le **nettoyage**. Si le composant disparaît (widget retiré) ou si `target` change, React appelle cette fonction avant de relancer l'effet : la boucle en cours est annulée. Sans elle, deux boucles tourneraient en même temps et se disputeraient l'affichage. En développement, React (mode `StrictMode`) lance chaque effet deux fois exprès pour vérifier que ce nettoyage existe.

### L'utilisation : [StatBody.tsx](../../apps/web/src/components/widgets/bodies/StatBody.tsx)

```tsx
 6  // Number of decimals written in the raw value (1840 → 0, 72.5 → 1): the count-up keeps the same precision
 7  const decimalsOf = (value: number): number => (String(value).split(".")[1] ?? "").length;
 8
 9  export default function StatBody({ data }: StatBodyProps) {
10      const shown: number = useCountUp(data.value);
11      const decimals: number = decimalsOf(data.value);
12      const formatted: string = new Intl.NumberFormat("en", {
13          minimumFractionDigits: decimals,
14          maximumFractionDigits: decimals,
15      }).format(shown);
```

- **l. 7** : on compte les décimales de la **vraie** valeur. `String(1840)` donne `"1840"` : pas de point, donc 0 décimale. `String(72.5)` donne `"72.5"` : la partie après le point fait 1 caractère. Le `?? ""` gère le cas sans point (`split` renvoie alors un seul morceau, et `[1]` vaut `undefined`).
- **l. 10** : `shown` est la valeur animée, avec plein de décimales parasites (`1610.347...`).
- **l. 12 à 15** : `Intl.NumberFormat` est l'outil standard de formatage des nombres. Locale `"en"` (règle du projet) : séparateur de milliers « , ». En forçant autant de décimales que la vraie valeur, le compteur affiche « 1,610 » pendant l'animation et « 72.5 » à l'arrivée, jamais « 1,610.347 ».

Côté CSS, dans [widget-grid.css](../../apps/web/src/components/widgets/widget-grid.css) (l. 217) :

```css
font-variant-numeric: tabular-nums;   /* the digits keep the same width while counting up */
```

Par défaut, dans Inter comme dans la plupart des polices, les chiffres n'ont pas tous la même largeur (le « 1 » est plus étroit que le « 8 »). Pendant le défilement, le nombre changerait de largeur à chaque image et l'unité « kcal » tremblerait à côté. `tabular-nums` demande à la police ses **chiffres tabulaires**, tous de la même largeur : le nombre défile sur place.

## 5. Pièges

- **Oublier `cancelAnimationFrame` dans le nettoyage.** La boucle continue après la disparition du composant, et React affiche un avertissement en développement.
- **Calculer avec un compteur d'images (« +10 par image ») au lieu du temps.** Sur un écran 120 Hz, l'animation irait deux fois plus vite. Toujours partir de `now - start`.
- **Stocker la valeur de départ dans un état au lieu d'une référence.** Il faudrait l'ajouter aux dépendances de l'effet, et chaque image relancerait l'effet : la boucle se recréerait en permanence.
- **Le piège `decimalsOf(0.1 + 0.2)`.** En JavaScript, `0.1 + 0.2` vaut `0.30000000000000004` (les nombres à virgule sont stockés en binaire, et 0,1 n'y tombe pas juste). `decimalsOf` compterait alors 17 décimales, et le widget afficherait un nombre interminable. Même problème avec les très petits nombres écrits en notation scientifique (`String(0.00000015)` donne `"1.5e-7"`). Tant que les sources renvoient des valeurs propres, rien ne se voit ; le jour où une valeur vient d'un calcul, il faudra arrondir avant, ou faire porter le nombre de décimales par le contrat de données.
- **Recréer `Intl.NumberFormat` à chaque rendu** (l. 12) coûte un peu. Ici c'est négligeable ; dans une longue liste, on le créerait une fois hors du composant.

## 6. À retenir

- Le CSS anime des propriétés de style, pas un texte : pour un nombre qui défile, il faut JavaScript.
- `requestAnimationFrame` appelle ta fonction juste avant chaque image, et se redemande lui-même pour faire une boucle.
- Une animation = une progression de 0 à 1 calculée à partir du temps, passée dans une fonction d'accélération, puis interpolée entre départ et arrivée.
- Le nettoyage (`cancelAnimationFrame`) dans le `return` de `useEffect` est obligatoire.
- `tabular-nums` évite que le nombre tremble pendant qu'il défile.

## 7. Exercice

Dans `useCountUp.ts`, passe `COUNT_UP_MS` à `3000` et remplace la ligne 24 par une progression linéaire (`const eased: number = progress;`). Recharge le dashboard (avec au moins un widget stat enregistré) et observe. Puis remets l'easing et garde 3000 ms. Qu'est-ce qui change dans la perception ? Annule tout ensuite avec `git checkout -- apps/web/src/components/widgets/hooks/useCountUp.ts`.

Question bonus : pourquoi le compteur repart-il de 0 à chaque rechargement de la page, alors que la valeur n'a pas changé ?

<details><summary>Solution</summary>

- **Linéaire, 3 s** : le compteur avance à vitesse constante. Il semble « traîner » à la fin, parce que les derniers chiffres changent aussi vite que les premiers, alors que l'œil attend un ralentissement avant l'arrêt.
- **easeOutCubic, 3 s** : les centaines défilent très vite au début, puis le nombre se pose doucement. Même à 3 s, l'animation paraît plus courte, car l'essentiel du chemin est fait dans la première seconde.
- **Bonus** : au rechargement, le composant est monté à neuf. `useState(0)` et `useRef(0)` repartent de 0, et l'effet anime de 0 jusqu'à la cible. C'est voulu : c'est l'animation d'arrivée.

</details>
