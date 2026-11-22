import { ApiError, NetworkError } from '@/shared/api';

/** What went wrong, whatever the screen. The messages are chosen from this, never from raw status codes. */
export const ErrorKind = {
    Network: 'network',
    Validation: 'validation',
    Unauthorized: 'unauthorized',
    Forbidden: 'forbidden',
    NotFound: 'notFound',
    Conflict: 'conflict',
    Server: 'server',
    Unknown: 'unknown',
} as const;

export type ErrorKind = (typeof ErrorKind)[keyof typeof ErrorKind];

/** Sorts anything a `catch` received into an `ErrorKind`. */
export function toErrorKind(error: unknown): ErrorKind {
    if (error instanceof NetworkError) return ErrorKind.Network;
    if (!(error instanceof ApiError)) return ErrorKind.Unknown;

    if (error.status === 400 || error.status === 422) return ErrorKind.Validation;
    if (error.status === 401) return ErrorKind.Unauthorized;
    if (error.status === 403) return ErrorKind.Forbidden;
    if (error.status === 404) return ErrorKind.NotFound;
    if (error.status === 409) return ErrorKind.Conflict;
    if (error.status >= 500) return ErrorKind.Server;
    return ErrorKind.Unknown;
}
