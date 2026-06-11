import { createBrowserRouter, redirect } from "react-router";
import { sidebarRoutes } from "./routes";
import MainLayout from "@/layout/MainLayout";

export const router = createBrowserRouter([
    {
        path: "/",
        Component: MainLayout,
        children: [
            {index: true, loader: () => redirect("/dashboard")},
            ...sidebarRoutes
        ] 
    },
])