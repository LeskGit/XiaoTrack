import type { ComponentType, SVGProps } from "react";



export const DisplayMode = {
    Sidebar: "sidebar",
    Modal: "modal",
    Fullscreen: "fullscreen"
} as const;

export type DisplayMode = typeof DisplayMode[keyof typeof DisplayMode];

export type RouteConfig = {
    id: string;
    path: string;
    Component: ComponentType;
    handle?: {
        title?: string;
        icon?: ComponentType<SVGProps<SVGSVGElement>>;
        displayMode?: DisplayMode;
    }
}