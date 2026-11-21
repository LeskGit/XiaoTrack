import type { Credentials, CurrentUser } from "@/shared/api";

/** All possible status of authentication */
export const AuthStatus = {
    Checking: 'checking', // Waiting for JWT
    Authenticated: 'authenticated', // Connected as a user
    Anonymous: 'anonymous', // Disconnected
} as const;

export type AuthStatus = (typeof AuthStatus)[keyof typeof AuthStatus];

/** All possible states of Authentication */
export type AuthState = 
    | { status: typeof AuthStatus.Checking }
    | { status: typeof AuthStatus.Authenticated, user: CurrentUser }
    | { status: typeof AuthStatus.Anonymous };

/** Actions exposed by the context. They throw the `ApiError` so the calling form can display it. */
export type AuthActions = {
    login: (credentials: Credentials) => Promise<void>;
    register: (credentials: Credentials) => Promise<void>;
    logout: () => Promise<void>;
};

/** What `useAuth()` returns. */
export type AuthContextValue = AuthState & AuthActions;