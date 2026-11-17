# Authentification — cadrage V1

> Décidé le 2026-11-17. Source de vérité pour l'authentification de l'API (`apps/api`) et son branchement côté front.

## 1. Objectif

Chaque requête vers l'API doit pouvoir répondre à « qui demande ? », pour rattacher les données (widgets, séances, habitudes…) à leur propriétaire.
L'authentification est **faite maison** : le but du projet est d'apprendre, pas de déléguer à un service (Auth0, Clerk, Supabase Auth…).

## 2. Décisions

| Sujet | Choix V1 | Raison |
|---|---|---|
| Mécanisme | **JWT** signé (HS256, secret `JWT_SECRET`) | Standard NestJS, vérifiable sans BD, formateur (signature, claims, expiration) |
| Stockage côté front | **Cookie `httpOnly`** `access_token` | Illisible par le JS de la page (pas de vol par XSS), envoyé automatiquement. Recommandation OWASP |
| Durée | **Jeton unique de 7 jours**, pas de refresh token | Un concept à la fois. Le refresh token est reporté en V2 |
| Vérification | **Guard maison** (`AuthGuard`) avec `@nestjs/jwt` | Une vingtaine de lignes entièrement comprises. Pas de Passport |
| Hash des mots de passe | **argon2id** (paquet `argon2`) | Recommandation OWASP actuelle |

## 3. Contenu du jeton

```ts
type JwtPayload = { sub: string; role: Role }; // sub = id de l'utilisateur (UUID)
```

- `sub` (*subject*) est le claim standard pour « à qui appartient ce jeton ».
- Le rôle est dans le jeton pour que le futur `RolesGuard` n'ait pas besoin de la BD. Conséquence assumée : un changement de rôle ne prend effet qu'à la prochaine connexion (au plus 7 jours).
- **Rien de secret dans le jeton** : il est signé, pas chiffré, et lisible par quiconque le possède.

## 4. Cookie

| Option | Valeur | Pourquoi |
|---|---|---|
| `httpOnly` | `true` | Inaccessible à `document.cookie` |
| `sameSite` | `lax` | Pas envoyé par les formulaires ou requêtes d'autres sites (protection CSRF de base) |
| `secure` | `true` en production uniquement | HTTPS obligatoire en prod ; `localhost` est en HTTP |
| `path` | `/` | Envoyé sur toutes les routes de l'API |
| `maxAge` | 7 jours | Aligné sur l'expiration du jeton |

Le front et l'API doivent être **sur la même origine** en dev : le proxy Vite redirige `/api` vers `localhost:3000` (étape 6).

## 5. Routes

| Route | Garde | Réponse |
|---|---|---|
| `POST /auth/register` | — | `201` + utilisateur public. `409` si l'email existe, `400` si le corps est invalide |
| `POST /auth/login` | — | `200` + utilisateur public + cookie posé. `401 Invalid credentials` (même réponse si l'email est inconnu ou si le mot de passe est faux) |
| `POST /auth/logout` | — | `204` + cookie effacé |
| `GET /auth/me` | `AuthGuard` | `200` + utilisateur public, `401` sans jeton valide |

L'inscription ne connecte pas automatiquement (V1) : le front enchaîne avec un login.

## 6. Règles

- L'email est normalisé (`trim` + minuscules) dans les DTO, avant toute lecture ou écriture.
- Le hash ne quitte jamais le serveur : seule `UsersService.findByEmail` le renvoie, pour le login.
- Toute création de compte donne le rôle `USER`. `ADMIN` n'est attribué que par le seed.
- Les mots de passe font entre 8 et 128 caractères à l'inscription. Le login n'applique que le maximum (protection contre un hachage coûteux).

## 7. Reporté (V2 et au-delà)

- Refresh token avec rotation, et révocation (déconnexion de tous les appareils).
- `RolesGuard` et décorateur `@Roles()` (étape 5 du plan, si besoin avant).
- Décorateur `@CurrentUser()` à la place de `@Req()`.
- Validation des variables d'environnement au démarrage (`ConfigModule.forRoot({ validate })`).
- Limitation du nombre de tentatives de login (`@nestjs/throttler`).
- Mot de passe oublié, vérification de l'email, passkeys.
