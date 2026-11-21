import type { Credentials, CurrentUser, RegisterPayload } from './auth.types';
import { HttpMethod, request } from './http';

/** Auth endpoints. The JWT never shows up here: it lives in an httpOnly cookie handled by the browser. */
export const authApi = {
    login: (credentials: Credentials) =>
        request<CurrentUser>('/auth/login', { method: HttpMethod.Post, body: credentials }),

    register: (payload: RegisterPayload) =>
        request<CurrentUser>('/auth/register', { method: HttpMethod.Post, body: payload }),

    logout: () => request<void>('/auth/logout', { method: HttpMethod.Post }),

    me: (signal?: AbortSignal) => request<CurrentUser>('/auth/me', { signal }),
};
