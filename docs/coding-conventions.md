# Conventions de codage — XiaoTrack

Doc de référence personnelle. À relire au retour sur le projet quand les conventions ne sont plus fraîches en tête.

**Principe directeur :** chaque règle a un *pourquoi*. Si le pourquoi ne s'applique plus, la règle bouge. Ce n'est pas un manuel d'entreprise — c'est une mémoire externe.

**Périmètre actuel :** front web (`apps/web`, React + TS + Tailwind v4 + Vite). Le back NestJS aura ses propres règles à ajouter quand le travail y reviendra.

---

## Sommaire

1. [Décisions de projet](#1-décisions-de-projet)
2. [Nommage](#2-nommage)
3. [Typage TypeScript](#3-typage-typescript)
4. [Composants React](#4-composants-react)
5. [Imports](#5-imports)
6. [Styling Tailwind](#6-styling-tailwind)
7. [Organisation des dossiers et barrels](#7-organisation-des-dossiers-et-barrels)
8. [Accessibilité — minimum vital](#8-accessibilité--minimum-vital)
9. [Commentaires](#9-commentaires)
10. [Dette legacy à résorber](#10-dette-legacy-à-résorber)

---

## 1. Décisions de projet

Choix arbitrés une fois pour toutes. Si l'un d'entre eux change, tout le doc bouge.

| Choix | Décision | Pourquoi |
|---|---|---|
| Langue des identifiants code | **Anglais partout** | Compatibilité écosystème + libs. Pas de mix coûteux à maintenir. |
| Langue du texte UI affiché | **Anglais (cible)** | Cohérence avec la langue du code. État transitoire : du français subsiste, à migrer (voir §10). Tout nouveau texte UI doit être écrit directement en anglais. |
| Langue de cette doc | **Français** | Doc personnelle. |
| `type` vs `interface` | **`type` partout** | Cohérence avec l'existant. `interface` réservé si extension externe par déclaration nécessaire (rare). |
| Imports internes | **`@/` cross-folder, relatif pour siblings** | Lisibilité naturelle quand on lit le fichier. |
| Ordre des classes Tailwind | **Libre** | Réévaluer si `prettier-plugin-tailwindcss` est installé un jour. |

---

## 2. Nommage

### 2.1 Fichiers

| Type | Convention | Exemple |
|---|---|---|
| Composant React | `PascalCase.tsx` | `MainHeader.tsx` |
| Hook | `useXxx.ts` (camelCase, préfixe `use`) | `useDebounce.ts` |
| Utilitaire pur | `camelCase.ts` | `formatDate.ts` |
| Types co-localisés | `xxx.types.ts` (camelCase + suffixe) | `icons.types.ts` |
| Barrel | `index.ts` | — |
| Asset SVG | `kebab-case.svg` | `rising-arrow.svg` |
| Asset image | `kebab-case.{png,jpg,webp}` | `default-avatar.png` |

**Pourquoi :** PascalCase pour fichiers de composants permet de distinguer en un coup d'œil composant vs utilitaire dans un explorateur. Le suffixe `.types.ts` rend les types co-localisés grep-ables et triables.

### 2.2 Identifiants dans le code

| Catégorie | Convention | Exemple |
|---|---|---|
| Composant React | `PascalCase` | `IconButton`, `MainHeader` |
| Hook | `useXxx` | `useTheme` |
| Variable / fonction | `camelCase` | `formattedDate`, `handleSubmit` |
| Constante "vraie" (immuable, partagée) | `SCREAMING_SNAKE_CASE` | `MAX_UPLOAD_SIZE` |
| Constante locale / config objet | `camelCase` | `sizeMapTW` |
| Type / Interface | `PascalCase` | `IconProps`, `User` |
| Variable booléenne | préfixe `is` / `has` / `should` / `can` | `isLoading`, `hasError`, `canEdit` |
| Handler interne au composant | préfixe `handle` | `handleClick`, `handleSubmit` |
| Prop d'événement (callback reçu) | préfixe `on` | `onClick`, `onSelect` |

**Pourquoi `handle` vs `on` :** la convention React distingue *qui définit* (`handle` = défini ici) de *qui consomme* (`on` = nom de la prop côté API). Cohérent avec les attributs DOM natifs (`onClick`, `onChange`).

### 2.3 Composants d'icônes

Suffixe `Icon` **systématique** sur toute variable qui représente un composant SVG, qu'il soit importé directement ou exposé via un éventuel registre.

```
import BellIcon from "@/assets/icons/bell.svg?react";
```

**Pourquoi :** lève d'avance toute collision avec un futur composant métier homonyme (`Bell` notification, `User` profil, etc.). Coût négligeable (4 caractères), bénéfice durable (jamais à renommer rétroactivement).

---

## 3. Typage TypeScript

### 3.1 `import type` systématique

`verbatimModuleSyntax` est activé : tout import qui n'est *que* de type doit utiliser `import type`. Pas de mélange dans la même ligne quand on peut l'éviter.

**Pourquoi :** garantit qu'aucun import de type ne survit au compilateur en runtime. Évite les imports circulaires accidentels.

### 3.2 Props : `readonly` + suffixe `Props`

```
type IconProps = {
    readonly icon: ComponentType<SVGProps<SVGSVGElement>>;
    readonly size?: SizeKey;
};
```

**Pourquoi :** `readonly` exprime l'immutabilité côté consommateur (les props ne sont pas censées être mutées). Le suffixe `Props` rend le type découvrable dans l'IDE.

### 3.3 Étendre les attributs HTML natifs plutôt que les redéclarer

Quand un composant wrappe un élément DOM (`<button>`, `<input>`, `<div>`, etc.), étendre le type d'attribut natif correspondant et spread les props sur l'élément :

| Élément | Type à étendre |
|---|---|
| `<button>` | `ButtonHTMLAttributes<HTMLButtonElement>` |
| `<input>` | `InputHTMLAttributes<HTMLInputElement>` |
| `<a>` | `AnchorHTMLAttributes<HTMLAnchorElement>` |
| `<div>` et autres génériques | `HTMLAttributes<HTMLDivElement>` |
| Élément SVG | `SVGProps<SVGSVGElement>` |

**Pourquoi :** récupère gratuitement et de façon typée toute la surface DOM (`onClick`, `disabled`, `aria-*`, `data-*`, etc.). Évite de réinventer une API parallèle qui finira incomplète.

### 3.4 Pas de `any`

Si le type est inconnu, `unknown` puis narrow par garde de type. `any` n'apparaît qu'en commentaire de TODO temporaire avec une raison.

**Pourquoi :** `any` désactive silencieusement le checker. `unknown` force à prouver le type avant utilisation.

### 3.5 Préférer les utilitaires built-in

`Omit<T, K>`, `Pick<T, K>`, `Partial<T>`, `Required<T>`, `Readonly<T>` plutôt que redéclarer un type proche.

**Exemple — flipper la sémantique d'une prop héritée :**
```
type IconButtonProps =
    Omit<IconProps, "className">                  // on retire le className "icon"
    & ButtonHTMLAttributes<HTMLButtonElement>     // on récupère le className "bouton" + tout le natif
    & { iconClassName?: string };                 // slot dédié pour styliser l'icône intérieure
```

### 3.6 `as const` pour les maps figées

Toute table de correspondance (clé → valeur fixe) doit être déclarée `as const` pour figer les types littéraux. Le type des clés se dérive ensuite via `keyof typeof`.

```
export const sizeMapTW = {
    sm: "w-5 h-5",
    md: "w-10 h-10",
    lg: "w-15 h-15",
    custom: "",
} as const;

export type SizeKey = keyof typeof sizeMapTW;
```

**Pourquoi :** évite le drift entre la map et le type. Une seule source de vérité.

### 3.7 Génériques

- Un seul paramètre : `T`.
- Plusieurs : nom descriptif préfixé `T` (`TKey`, `TValue`, `TProps`).
- Pas de `<T = unknown>` par défaut sans raison — les défauts masquent les usages incorrects.

---

## 4. Composants React

### 4.1 Un composant par fichier, export `default`

Le composant principal du fichier est exporté en `default`. Les types associés sont nommés. Les sous-composants privés restent dans le même fichier *uniquement* s'ils ne sont jamais utilisés ailleurs ; sinon ils sortent dans leur propre fichier.

**Pourquoi :** `default` permet à l'IDE de proposer le bon nom à l'import. La règle "1 fichier = 1 composant public" rend la navigation prévisible.

### 4.2 Self-closing pour composants sans children

```
// Bon
<MainLayout />

// Mauvais
<MainLayout></MainLayout>
```

### 4.3 Destructurer les props dans la signature

```
export default function Icon({ icon: IconComponent, className, size }: IconProps) { ... }
```

Pas de `props.xxx` en série dans le corps. Si la liste devient trop longue (>6-7 props), c'est probablement le signal qu'il faut découper le composant.

### 4.4 Ordre canonique du fichier

1. Imports externes (React, libs)
2. Imports internes (`@/...`)
3. Imports relatifs (`./...`)
4. Imports de types (`import type`)
5. Imports d'assets (SVG, images)
6. Constantes / sous-helpers locaux au fichier
7. Composant principal (export default)

### 4.5 Spread des props natives sur la racine

Pour les composants qui wrappent un élément DOM, sortir explicitement les props "métier" du composant et spread le reste sur l'élément racine :

```
function IconButton({ icon, size, iconClassName, ...rest }: IconButtonProps) {
    return (
        <button {...rest}>
            <Icon icon={icon} size={size} className={iconClassName} />
        </button>
    );
}
```

**Pourquoi :** l'utilisateur peut passer `aria-label`, `disabled`, `type`, `data-testid`, etc. sans qu'on doive maintenir une whitelist.

### 4.6 Convention `className` pour composants à plusieurs slots

- `className` → racine du composant (élément le plus extérieur)
- `xxxClassName` → sous-élément nommé (`iconClassName`, `labelClassName`, etc.)
- À 3+ slots, basculer vers le pattern `classNames` objet : `<Card classNames={{ root, header, body }}>`. Pas avant.

### 4.7 Stabilité entre renders

- Pas de `new Date()`, `new Set()`, `[]`, `{}` créé directement dans le corps du composant si la valeur sert à autre chose qu'un affichage immédiat. Utiliser `useState`, `useMemo`, ou sortir hors du composant.
- Pas de fonction inline en prop quand elle est passée à un composant memoisé (sinon elle casse la mémo).
- Mais : ne pas anticiper avec `useCallback`/`useMemo` partout. Les ajouter quand un profilage ou une mémo le justifie.

---

## 5. Imports

### 5.1 Règle d'origine

- **`@/`** dès qu'un import traverse au moins un dossier (cross-folder).
- **Relatif (`./xxx`, `../xxx`)** pour les voisins directs (même dossier ou dossier parent immédiat utilisé en pratique comme un seul module).

```
// Bon
import { Icon } from "@/components/icons";          // cross-folder
import SidebarCategory from "./SidebarCategory";    // sibling
```

### 5.2 Ordre des imports (groupes séparés par une ligne vide)

1. React et libs externes
2. Imports internes `@/...`
3. Imports relatifs
4. Imports de types (`import type`)
5. Imports d'assets (SVG `?react`, images, CSS)

### 5.3 Imports de SVG

Toujours via le suffixe `?react` (vite-plugin-svgr). Le composant obtenu est passé à `<Icon />` ou `<IconButton />` — jamais rendu directement comme `<Bell />` sauf cas exceptionnel justifié.

```
import Bell from "@/assets/icons/bell.svg?react";
// puis
<Icon icon={Bell} size="md" />
```

---

## 6. Styling Tailwind

### 6.1 Pas de `style={{ ... }}` sauf valeur dynamique

Si la valeur est statique, c'est une classe Tailwind. `style` est réservé aux valeurs calculées au runtime (positionnement basé sur des coordonnées, couleur dérivée de données, etc.).

### 6.2 Extraire les longues chaînes de classes

Au-delà de **~80 caractères** ou si la chaîne est **réutilisée**, extraire en constante locale au fichier ou en helper exporté.

```
// Bon
const headerLogoClasses = "bg-linear-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg text-white p-1";

<Icon icon={RisingArrow} size="lg" className={headerLogoClasses} />
```

### 6.3 Pattern `cn` / `clsx` à introduire le moment venu

Pour conditionner des classes (`isActive`, `disabled`, etc.), aujourd'hui : template strings simples. Quand la conditionnalité dépasse 2-3 cas dans un composant, installer `clsx` (ou écrire un mini `cn`) et l'utiliser systématiquement. Pas avant — pas de besoin actuel.

### 6.4 Variantes (cva) — pour plus tard

Quand un composant a 3+ axes de variation (taille × variant × état), envisager `class-variance-authority`. Hors scope aujourd'hui.

### 6.5 Tokens de design via `as const`

Toute échelle (tailles, couleurs sémantiques, espaces) qui mappe une clé sémantique vers une chaîne de classes Tailwind doit être déclarée comme une map `as const` dans `shared/styles/`, avec un `keyof typeof` pour le type.

Pattern de référence : `sizeMapTW` dans `shared/styles/defaultProperties.styles.ts`.

---

## 7. Organisation des dossiers et barrels

### 7.1 Structure d'un dossier de composant

```
ComponentName/
    ComponentName.tsx        # composant principal
    componentName.types.ts   # types exposés
    index.ts                 # barrel : ré-exporte composant + types
```

### 7.2 Quand créer un barrel `index.ts`

- **Obligatoire** dès qu'un dossier expose plus d'un symbole (ex: `components/icons` exporte `Icon`, `IconButton`, et leurs types).
- **Optionnel mais recommandé** même pour un seul composant — permet d'écrire `import { Avatar } from "@/components/avatar"` au lieu de `from "@/components/avatar/Avatar"`. Cohérence > économie.

### 7.3 Forme du barrel

```
export { default as Icon } from "./Icon";
export { default as IconButton } from "./IconButton";
export type { IconProps, IconButtonProps } from "./icons.types";
```

Pas de logique dans `index.ts`. Que des ré-exports.

### 7.4 Frontière `components/` vs `layout/` vs `pages/`

- `components/` : briques UI réutilisables, sans connaissance du contexte applicatif (`Icon`, `Avatar`, plus tard `Button`, `Input`, etc.).
- `layout/` : structure de page persistante (header, sidebar, content frame). Connaissent l'app mais pas le métier.
- `pages/` : écrans complets. Composent du `components/` et du `layout/`.

Si un composant est utilisé par plusieurs pages → il monte dans `components/`. Si un composant n'est jamais utilisé qu'une fois → il reste dans le dossier de la page qui l'utilise.

### 7.5 `shared/`

Réservé aux choses **transversales sans dépendance UI** : types utilitaires, tokens de style, helpers purs. Pas de composants React dans `shared/`.

---

## 8. Accessibilité — minimum vital

Liste non négociable. Tout PR doit la respecter.

1. **`<button>` doit avoir un nom accessible.** Soit du texte enfant, soit `aria-label`. Une icône seule ne compte pas.
2. **`<img>` doit avoir un `alt`.** Vide (`alt=""`) si purement décoratif, descriptif sinon. Jamais omis.
3. **Pas d'élément cliquable sur un `<div>`/`<span>` sans handler clavier.** Si c'est cliquable, c'est un `<button>`. Sauf raison documentée.
4. **Inputs de formulaire doivent être labellisés** (`<label>` associé via `htmlFor`, ou `aria-label`).

Ces 4 règles couvrent ~80 % de l'accessibilité de base. Le reste (focus management, contrastes, ARIA avancé) viendra par cas.

---

## 9. Commentaires

### 9.1 Default : pas de commentaire

Le code bien nommé se lit. Un commentaire qui paraphrase le code est du bruit qui pourrira (le code change, le commentaire reste, ils divergent).

### 9.2 Quand commenter

Uniquement quand le **pourquoi** n'est pas évident à la lecture :
- Contrainte cachée ("ce timeout est à 350ms parce que l'API X plafonne à 3 req/s")
- Workaround pour un bug externe (référence l'issue/version)
- Invariant subtil maintenu manuellement
- Comportement contre-intuitif assumé

### 9.3 JSDoc

Réservé aux types et fonctions **exportés** non triviaux. Pas pour les composants internes. Ne pas paraphraser la signature — décrire l'intention et les cas-limites.

### 9.4 Format `TODO` / `FIXME`

```
// TODO(axel): remplacer par un vrai handler de logout — placeholder
// FIXME: fallback `src` cassé, voir doc conventions §10
```

Préfixe avec un identifiant (initiales ou nom). Sans identifiant, le TODO devient orphelin.

---

## 10. Dette legacy à résorber

État actuel du code qui contrevient à ces règles. À nettoyer au prochain passage sur le composant concerné.

| Fichier | Problème | Correction |
|---|---|---|
| `apps/web/src/layout/Sidebar/MainSiderbar.tsx` | Typo dans le nom de fichier (`Siderbar`) | Renommer en `MainSidebar.tsx` |
| `apps/web/src/layout/layout.types.ts` | Typo `SBCategoriePprops`, FR `Categorie` | Renommer en `SidebarCategoryProps` (EN, sans abréviation cryptique) |
| `apps/web/src/layout/Header/MainHeader.tsx` | Prop `categorieName` (FR) | Renommer en `categoryName` |
| `apps/web/src/layout/MainLayout.tsx` | `<MainSidebar></MainSidebar>` et `<MainContent></MainContent>` | Self-closing (§4.2) |
| `apps/web/src/App.tsx` | `<MainLayout></MainLayout>` | Self-closing (§4.2) |
| `apps/web/src/components/avatar/Avatar.tsx` | Fallback `src` est une string littérale, ne sera pas résolue par Vite | Importer le default avatar et l'utiliser comme valeur de défaut typée |
| `apps/web/src/components/icons/Icon.tsx` et `IconButton.tsx` | `icon: ComponentType` non paramétré ; sémantique de `className` ambiguë sur `IconButton` | Typer `ComponentType<SVGProps<SVGSVGElement>>` ; appliquer §4.6 sur `IconButton` |
| `apps/web/src/shared/types/compound.types.ts` | `BaseCompoundProps` défini, jamais utilisé | Supprimer ou câbler |
| `apps/web/src/layout/MainLayout.tsx` | `new Date()` dans le render | Sortir hors composant ou via `useState` (§4.7) |
| `apps/web/src/layout/` | Pas de barrel `index.ts` | Ajouter (§7.2) |
| `apps/web/src/layout/Header/MainHeader.tsx` | Imports d'icônes sans suffixe (`Bell`, `Menu`, `RisingArrow`) | Renommer en `BellIcon`, `MenuIcon`, `RisingArrowIcon` (§2.3) |
| `apps/web/src/layout/Sidebar/MainSiderbar.tsx` | Import `Menu` sans suffixe | Renommer en `MenuIcon` (§2.3) |
| `apps/web/src/layout/MainLayout.tsx` | Texte UI FR `categorieName="Tableau de bord"` | Migrer la valeur en EN (ex: `"Dashboard"`) (§1) |
| `apps/web/src/layout/Sidebar/MainSiderbar.tsx` | Texte UI FR `title='Categorie'` | Migrer en EN (§1) |
| `apps/web/src/layout/Header/MainHeader.tsx` | Locale d'affichage de date `'fr-FR'` | À aligner sur la langue cible (`'en-US'` ou `'en-GB'`) une fois la migration UI faite (§1) |

Quand un de ces points est corrigé, supprimer la ligne correspondante de ce tableau.
