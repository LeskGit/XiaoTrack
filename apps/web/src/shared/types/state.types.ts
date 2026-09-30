


export type DataState<T> =
    | { status: "loading" }
    | { status: "success"; data: T }
    | { status: "error"; message: string };

