import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi, type Credentials, type RegisterPayload } from '@/shared/api';
import { ErrorKind, reportError, toErrorKind } from '@/shared/errors';
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
                if (toErrorKind(error) !== ErrorKind.Unauthorized) {
                    reportError(error, 'sessionCheck');
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
        async ({ displayName, email, password }: RegisterPayload) => {
            await authApi.register({ displayName, email, password });
            // Only the credentials: LoginDto rejects unknown fields (forbidNonWhitelisted → 400)
            await login({ email, password });
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