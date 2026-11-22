import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, NetworkError } from '@/shared/api';
import { ErrorKind, getErrorMessage, reportError, toErrorKind } from '@/shared/errors';

describe('toErrorKind', () => {
    it.each([
        [400, ErrorKind.Validation],
        [422, ErrorKind.Validation],
        [401, ErrorKind.Unauthorized],
        [403, ErrorKind.Forbidden],
        [404, ErrorKind.NotFound],
        [409, ErrorKind.Conflict],
        [500, ErrorKind.Server],
        [503, ErrorKind.Server],
        [418, ErrorKind.Unknown],
    ])('sorts an ApiError %i into %s', (status, kind) => {
        expect(toErrorKind(new ApiError(status, 'message'))).toBe(kind);
    });

    it('sorts a NetworkError into network', () => {
        expect(toErrorKind(new NetworkError())).toBe(ErrorKind.Network);
    });

    it.each([new TypeError('bug'), 'a string', null, undefined])('sorts anything else (%p) into unknown', (error) => {
        expect(toErrorKind(error)).toBe(ErrorKind.Unknown);
    });
});

describe('getErrorMessage', () => {
    it('uses the situation wording when the situation overrides that kind', () => {
        expect(getErrorMessage(new ApiError(401, ''), 'login')).toBe('Invalid email or password.');
        expect(getErrorMessage(new ApiError(409, ''), 'register')).toBe('This email is already in use.');
    });

    it('falls back to the default wording when the situation does not override that kind', () => {
        // Same 401, other meaning: outside the login form it means the session is gone
        expect(getErrorMessage(new ApiError(401, ''), 'logout')).toBe('Your session has expired. Please log in again.');
        expect(getErrorMessage(new NetworkError(), 'login')).toBe(
            "Can't reach the server. Check your connection and try again.",
        );
    });

    it('uses the default wording without a situation', () => {
        expect(getErrorMessage(new Error('bug'))).toBe('Something went wrong. Please try again.');
    });

    it('never shows the raw message sent by the API', () => {
        const message = getErrorMessage(new ApiError(400, 'displayName must match /^[\\p{L}]+$/u'), 'register');
        expect(message).not.toContain('displayName');
    });
});

describe('reportError', () => {
    afterEach(() => vi.restoreAllMocks());

    it('logs the error tagged with its situation', () => {
        const log = vi.spyOn(console, 'error').mockImplementation(() => {});
        const error = new Error('boom');

        reportError(error, 'logout');

        expect(log).toHaveBeenCalledWith('[logout]', error);
    });
});
