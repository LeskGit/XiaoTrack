/** Error thrown by `request` when the API answers with a non-2xx status. */
export class ApiError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

/** Thrown by `request` when the API cannot be reached at all (server down, no connection). */
export class NetworkError extends Error {
    constructor(options?: ErrorOptions) {
        super('Network request failed', options);
        this.name = 'NetworkError';
    }
}

export const HttpMethod = {
    Get: 'GET',
    Post: 'POST',
    Put: 'PUT',
    Patch: 'PATCH',
    Delete: 'DELETE',
} as const;

export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];

type RequestOptions = {
    method?: HttpMethod;
    body?: unknown;
    signal?: AbortSignal;
};

/**
 * Calls the API through the `/api` prefix
 * Throws an `ApiError` for any non-2xx status: `fetch` itself only rejects on network failures.
 */
export async function request<T>(
    path: string,
    { method = HttpMethod.Get, body, signal }: RequestOptions = {},
): Promise<T> {
    let response: Response;
    try {
        response = await fetch(`/api${path}`, {
            method,
            headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body),
            signal,
        });
    } catch (error) {
        // A cancelled request is not a failure: let the AbortError through untouched
        if (signal?.aborted) throw error;
        // fetch only rejects when the server can't be reached: name it, keep the original as `cause`
        throw new NetworkError({ cause: error });
    }

    if (!response.ok) {
        throw new ApiError(response.status, await readErrorMessage(response));
    }

    // 204 No Content (e.g. logout): there is no body to parse
    if (response.status === 204) {
        return undefined as T;
    }

    // Trust boundary: TypeScript cannot check what the server actually sent
    return (await response.json()) as T;
}

/** NestJS errors look like `{ message: string | string[], statusCode }`. */
async function readErrorMessage(response: Response): Promise<string> {
    try {
        const data: unknown = await response.json();
        if (typeof data === 'object' && data !== null && 'message' in data) {
            const { message } = data;
            if (Array.isArray(message)) return message.join(', ');
            if (typeof message === 'string') return message;
        }
    } catch {
        // The body is not JSON: fall back to the status text
    }
    return response.statusText;
}
