import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError, authApi, type Credentials } from '@/shared/api';
import { AuthContext } from './authContext';
import { AuthStatus, type AuthContextValue, type AuthState } from './authContext.types';

type AuthProviderProps = {
    readonly children: ReactNode;
};

export default function AuthProvider({ children }: AuthProviderProps) {
    const [state, setState] = useState<AuthState>({ status: AuthStatus.Checking });

    // On mount: ask the API whether the cookie holds a valid session
    useEffect(() => {
        const controller = new AbortController();

        authApi
            .me(controller.signal)
            .then((user) => setState({ status: AuthStatus.Authenticated, user }))
            .catch((error: unknown) => {
                // Cancelled by the cleanup (StrictMode remount, unmount): nothing to update
                if (controller.signal.aborted) return;

                // 401 is the normal "not logged in" answer; anything else is a real failure
                if (!(error instanceof ApiError && error.status === 401)) {
                    console.error('Session check failed', error);
                }
                setState({ status: AuthStatus.Anonymous });
            });

        return () => controller.abort();
    }, []);

    // useCallback: stable references, so the memoised value below does not change on every render
    const login = useCallback(async (credentials: Credentials) => {
        const user = await authApi.login(credentials);
        setState({ status: AuthStatus.Authenticated, user });
    }, []);

    // The API does not set the cookie on register: log in right after (decision D)
    const register = useCallback(
        async (credentials: Credentials) => {
            await authApi.register(credentials);
            await login(credentials);
        },
        [login],
    );

    const logout = useCallback(async () => {
        await authApi.logout();
        setState({ status: AuthStatus.Anonymous });
    }, []);

    // useMemo: a new object only when the state or an action changes, otherwise every consumer would re-render
    const value = useMemo<AuthContextValue>(
        () => ({ ...state, login, register, logout }),
        [state, login, register, logout],
    );

    // React 19: the context itself is the provider (no more `.Provider`)
    return <AuthContext value={value}>{children}</AuthContext>;
}