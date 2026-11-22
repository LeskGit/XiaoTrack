import { ErrorKind } from './errorKind';

/** Default wording, one per kind. Record<ErrorKind, …>: a new kind without a message won't compile. */
export const defaultErrorMessages = {
    [ErrorKind.Network]: "Can't reach the server. Check your connection and try again.",
    [ErrorKind.Validation]: 'Some fields are invalid. Please check them and try again.',
    [ErrorKind.Unauthorized]: 'Your session has expired. Please log in again.',
    [ErrorKind.Forbidden]: "You don't have permission to do this.",
    [ErrorKind.NotFound]: "We couldn't find what you were looking for.",
    [ErrorKind.Conflict]: 'This conflicts with existing data.',
    [ErrorKind.Server]: 'Something went wrong on our side. Please try again later.',
    [ErrorKind.Unknown]: 'Something went wrong. Please try again.',
} as const satisfies Record<ErrorKind, string>;

/**
 * Per-situation wording: only the kinds whose meaning changes there.
 * Anything not listed falls back to `defaultErrorMessages`.
 */
export const situationErrorMessages = {
    login: {
        [ErrorKind.Unauthorized]: 'Invalid email or password.',
    },
    register: {
        [ErrorKind.Conflict]: 'This email is already in use.',
    },
    logout: {},
    sessionCheck: {},
    layoutSave: {},
} as const satisfies Record<string, Partial<Record<ErrorKind, string>>>;

/** The situations the app knows: getErrorMessage(error, 'lgoin') won't compile. */
export type ErrorSituation = keyof typeof situationErrorMessages;
