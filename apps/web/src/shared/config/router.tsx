import { createBrowserRouter } from "react-router";
import { sidebarRoutes } from "./routes";
import MainLayout from "@/layout/MainLayout";

export const router = createBrowserRouter([
    {
        path: "/",
        Component: MainLayout,
        children: sidebarRoutes.map((r) => ({path: r.path, Component: r.Component, handle: r.metadata})) 
    },
])