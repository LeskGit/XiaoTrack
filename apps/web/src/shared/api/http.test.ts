import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, HttpMethod, NetworkError, request } from '@/shared/api';

/** Replaces the global fetch for one test. */
function mockFetch(implementation: () => Promise<Response>) {
    const fetchMock = vi.fn(implementation);
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('request', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('calls the API under /api and returns the parsed body', async () => {
        const fetchMock = mockFetch(async () => json(200, { id: 'user-1' }));

        await expect(request('/auth/me')).resolves.toEqual({ id: 'user-1' });
        expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({ method: 'GET' }));
    });

    it('sends a JSON body with its content type', async () => {
        const fetchMock = mockFetch(async () => json(200, {}));

        await request('/auth/login', { method: HttpMethod.Post, body: { email: 'a@b.test' } });

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/auth/login',
            expect.objectContaining({
                method: 'POST',
                body: '{"email":"a@b.test"}',
                headers: { 'Content-Type': 'application/json' },
            }),
        );
    });

    it('returns undefined for 204 No Content', async () => {
        mockFetch(async () => new Response(null, { status: 204 }));

        await expect(request('/auth/logout', { method: HttpMethod.Post })).resolves.toBeUndefined();
    });

    it('throws an ApiError with the status and the NestJS message (array joined)', async () => {
        mockFetch(async () => json(400, { message: ['email must be an email', 'password too short'], statusCode: 400 }));

        const error = await request('/auth/register').catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({ status: 400, message: 'email must be an email, password too short' });
    });

    it('turns a fetch rejection into a NetworkError that keeps the original as cause', async () => {
        const original = new TypeError('Failed to fetch');
        mockFetch(async () => Promise.reject(original));

        const error = await request('/auth/me').catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(NetworkError);
        expect((error as NetworkError).cause).toBe(original);
    });

    it('lets a cancelled request through untouched: an abort is not a network failure', async () => {
        const controller = new AbortController();
        const abortError = new DOMException('The operation was aborted.', 'AbortError');
        mockFetch(async () => {
            controller.abort();
            return Promise.reject(abortError);
        });

        await expect(request('/auth/me', { signal: controller.signal })).rejects.toBe(abortError);
    });
});
