/** Mirrors the `Role` enum of the API */
export const Role = {
    User: 'USER',
    Admin: 'ADMIN',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

/** What the front needs to know about the logged-in user. */
export type CurrentUser = {
    id: string;
    email: string;
    role: Role;
};

/** Body of `POST /auth/login` and `POST /auth/register`. */
export type Credentials = {
    email: string;
    password: string;
};
