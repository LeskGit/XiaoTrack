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
    displayName: string;
    role: Role;
};

/** Body of `POST /auth/login`. */
export type Credentials = {
    email: string;
    password: string;
};

/** Body of `POST /auth/register`: the credentials plus the name shown in the UI. */
export type RegisterPayload = Credentials & {
    displayName: string;
};
