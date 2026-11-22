import { toErrorKind, type ErrorKind } from './errorKind';
import { defaultErrorMessages, situationErrorMessages, type ErrorSituation } from './errorMessages';

/** The message to show the user for this error, in this situation. */
export function getErrorMessage(error: unknown, situation?: ErrorSituation): string {
    const kind = toErrorKind(error);
    // Typed as a partial map: some situations override nothing ({}), the lookup must still be allowed
    const overrides: Partial<Record<ErrorKind, string>> = situation ? situationErrorMessages[situation] : {};
    return overrides[kind] ?? defaultErrorMessages[kind];
}

/** The one place errors are logged: the day a monitoring tool comes, only this function changes. */
export function reportError(error: unknown, situation: ErrorSituation): void {
    console.error(`[${situation}]`, error);
}
