import { createBrowserRouter } from "react-router";
import { routes } from "./routes";

createBrowserRouter([
    routes.map((r) => {
        path: r.path, Component: r.Component
    })
])