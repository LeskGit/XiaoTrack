import { createBrowserRouter, redirect } from "react-router";
import { authRoutes, sidebarRoutes } from "./routes";
import MainLayout from "@/layout/MainLayout";
import RequireAuth from "@/app/routing/RequireAuth";

export const router = createBrowserRouter([
    // Public, outside the shell: no header, no sidebar
    authRoutes.Login,
    authRoutes.Register,

    // Private: the pathless guard wraps the whole shell
    {
        Component: RequireAuth,
        children: [
            {
                path: "/",
                Component: MainLayout,
                children: [
                    {index: true, loader: () => redirect("/dashboard")},
                    ...sidebarRoutes
                ]
            },
        ],
    },
])