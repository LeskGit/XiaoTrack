# 03 — React Router v7 (cookbook)

> Depuis v7, le package s'appelle **`react-router`** (le web n'a plus besoin de `react-router-dom`). Il est **déjà installé** dans ton projet.
> Mode utilisé : **data router** (`createBrowserRouter` + `<RouterProvider>`) — c'est lui qui débloque `loader`, `action`, `errorElement`, `handle`/`useMatches`.
> Ton repo utilise déjà : `createBrowserRouter`, `Component:` (pas `element:`), index route + `redirect()`, métadonnées sous `handle`, titre via `useMatches`. Les exemples ci-dessous suivent ces idiomes.

## Sommaire

1. [Rappel du montage (data router)](#1)
2. [Navigation : `Link`, `NavLink`, `useNavigate`](#2)
3. [Routes imbriquées + `<Outlet>`](#3)
4. [`Component` vs `element`](#4)
5. [Index route + `redirect()`](#5)
6. [Métadonnées de route : `handle` + `useMatches`](#6)
7. [Paramètres d'URL & query string](#7)
8. [Loaders & actions](#8)
9. [Error boundaries de route](#9)
10. [Routes protégées (sans store)](#10)
11. [Lazy loading](#11)

---

<a id="1"></a>
## 1. Rappel du montage (data router)

Forme générale (proche de ton `shared/config/router.tsx`) :

```tsx
import { createBrowserRouter, redirect } from "react-router";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,               // coquille commune (header/sidebar/outlet)
    children: [
      { index: true, loader: () => redirect("/dashboard") }, // route "fantôme" : redirige, ne rend rien
      // ...routes de sections
    ],
  },
]);
```

```tsx
import { RouterProvider } from "react-router";
export default function App() { return <RouterProvider router={router} />; }
```

---

<a id="2"></a>
## 2. Navigation

Jamais de `<a href>` interne (ça recharge la page) :

```tsx
import { Link, NavLink } from "react-router";

<Link to="/dashboard">Dashboard</Link>

// NavLink connaît l'état actif → ta sidebar l'utilise déjà
<NavLink to="/dashboard" className={({ isActive }) => (isActive ? "font-bold" : "")}>
  Dashboard
</NavLink>
```

Navigation programmatique :

```tsx
import { useNavigate } from "react-router";
const navigate = useNavigate();
navigate("/notes");   // aller
navigate(-1);          // revenir en arrière
```

---

<a id="3"></a>
## 3. Routes imbriquées + `<Outlet>`

La route parente pose la coquille ; l'enfant s'affiche dans `<Outlet>`. C'est le rôle de ton `MainLayout` (header + sidebar fixes, contenu variable).

```tsx
import { Outlet } from "react-router";

function MainLayout() {
  return (
    <div className="grid md:grid-cols-[16rem_1fr] grid-rows-[auto_1fr] h-screen gap-1">
      <div className="col-span-full">{/* Header */}</div>
      <aside>{/* Sidebar */}</aside>
      <main><Outlet /></main>   {/* ← Dashboard, Notes, etc. s'affichent ici */}
    </div>
  );
}
```

> `useOutlet()` existe si tu veux savoir s'il y a un enfant rendu (ex. afficher un contenu par défaut sinon).

---

<a id="4"></a>
## 4. `Component` vs `element`

Deux façons de brancher un composant sur une route :

```tsx
{ path: "notes", element: <Notes /> }   // tu passes un élément JSX déjà instancié
{ path: "notes", Component: Notes }      // tu passes le composant, RR l'instancie (ton choix actuel)
```

`Component:` est pratique quand tu génères les routes depuis une **config** (comme ton `sidebarRoutes.map`), car tu manipules des références de composants, pas du JSX. Les deux marchent ; reste cohérent.

---

<a id="5"></a>
## 5. Index route + `redirect()`

L'**index route** est l'enfant affiché quand l'URL correspond au parent exactement (`/`). Pour rediriger `/` → `/dashboard` **avant tout rendu** (zéro flash) :

```tsx
{ index: true, loader: () => redirect("/dashboard") }
```

Pourquoi mieux que `<Navigate to="/dashboard">` : la redirection se joue en **phase loader** (avant rendu), et `redirect()` fait un `replaceState` → `/` ne pollue pas l'historique (pas de piège au bouton « précédent »). C'est ta décision du 2026-06-11.

---

<a id="6"></a>
## 6. Métadonnées de route : `handle` + `useMatches`

React Router ne lit les métadonnées custom que sous la clé **`handle`** (via `useMatches()`). C'est comme ça qu'on affiche un **titre dynamique** dans le header sans state dupliqué.

```tsx
// config
{ path: "dashboard", Component: Dashboard, handle: { title: "Dashboard", icon: TrendingUpDownIcon } }
```

```tsx
// dans le Header — le titre suit l'URL, survit au refresh/back
import { useMatches } from "react-router";

type RouteHandle = { title?: string; icon?: ComponentType<SVGProps<SVGSVGElement>> };

function useRouteTitle(): string {
  const matches = useMatches();
  const last = matches.at(-1);
  const handle = last?.handle as RouteHandle | undefined; // handle est typé `unknown` → narrow
  return handle?.title ?? "XiaoTrack";                     // fallback : l'index route n'a PAS de handle
}
```

> 🔗 **Dans ton projet (TODO ouvert)** — `useMatches().at(-1)?.handle` est typé `unknown` → ne compile pas tel quel. Deux options : (a) un **cast** ciblé comme ci-dessus, (b) un **type guard** qui vérifie `typeof handle === "object" && handle && "title" in handle`. Prévois toujours le `?? "…"` car l'index route (redirect) n'a pas de `handle`. La règle sous-jacente : **« l'URL EST le state »** (ta décision 2026-06-11) — pas de `useState`+`useEffect` pour le titre.

---

<a id="7"></a>
## 7. Paramètres d'URL & query string

**Params de chemin** (`path: "widget/:id"`) :

```tsx
import { useParams } from "react-router";
const { id } = useParams(); // string | undefined → gère le cas manquant
```

**Query string** (état partageable/bookmarkable : filtre, onglet, vue) :

```tsx
import { useSearchParams } from "react-router";
const [params, setParams] = useSearchParams();
const view = params.get("view") ?? "grid";
setParams({ view: view === "grid" ? "list" : "grid" });
```

Règle : ce qui doit être **partageable dans l'URL** (quelle vue, quel filtre) → search params. La **disposition des widgets** → `useState` + persistance (`04`), pas l'URL.

---

<a id="8"></a>
## 8. Loaders & actions

**Loader** = charge la donnée **avant** le rendu (évite le « montage → useEffect → spinner → flash ») :

```tsx
import type { LoaderFunctionArgs } from "react-router";

async function loader({ params }: LoaderFunctionArgs) {
  const res = await fetch(`/api/widgets/${params.id}`);
  if (!res.ok) throw new Response("Not found", { status: 404 });
  return res.json();
}
// config: { path: "widget/:id", Component: WidgetDetail, loader }
```

```tsx
import { useLoaderData } from "react-router";
const data = useLoaderData() as WidgetDetailData;
```

**Action** = gère une soumission de formulaire (`<Form method="post">`) côté route. Utile plus tard quand ton back NestJS expose des endpoints d'écriture. Pour le v1 (état local + localStorage), tu n'en as pas besoin.

> Tu utilises déjà un loader pour la redirection (§5) — c'est le même mécanisme, sans données.

---

<a id="9"></a>
## 9. Error boundaries de route

Un `errorElement` attrape toute erreur du loader/action/rendu de la route (et de ses enfants) :

```tsx
import { useRouteError, isRouteErrorResponse } from "react-router";

function RouteError() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) return <p>Erreur {error.status} : {error.statusText}</p>;
  return <p>Une erreur est survenue.</p>;
}
// config: { path: "/", Component: MainLayout, errorElement: <RouteError />, children: [...] }
```

---

<a id="10"></a>
## 10. Routes protégées (sans store)

Ton projet n'a pas de store : la garde lit l'auth via un **custom hook** (localStorage token, ou Context auth), pas un selector.

```tsx
import { Navigate, Outlet, useLocation } from "react-router";

function useAuth() {
  // exemple générique : token en localStorage. À toi de brancher ta vraie source.
  return { isAuthenticated: Boolean(localStorage.getItem("token")) };
}

function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}
```

```tsx
// config : imbrique les routes privées sous la garde
{ Component: RequireAuth, children: [ { path: "settings", Component: Settings } ] }
```

Variante **loader** (redirige avant même le rendu) : `loader: () => localStorage.getItem("token") ? null : redirect("/login")`.

---

<a id="11"></a>
## 11. Lazy loading

Charge le code d'une route seulement quand on y va → bundle initial plus léger. Utile si un widget lourd (charts) n'est pas nécessaire au premier écran.

```tsx
{
  path: "settings",
  lazy: async () => {
    const { default: Settings } = await import("@/pages/Settings");
    return { Component: Settings };
  },
}
```

---

> Récap pour XiaoTrack : `MainLayout` = coquille avec `<Outlet>` ; sections générées depuis `sidebarRoutes` (`Component` + `handle`) ; `/` redirige via index route + `redirect()` ; titre via `useMatches` (« l'URL est le state »). L'état des widgets vit dans `useState` + persistance (`04`), **pas** dans l'URL.
