import { BookCheckIcon, CalendarCheckIcon, DumbellIcon, HamIcon, NoteBookPenIcon, TrendingUpDownIcon } from "@/components/icons/library";
import { Dashboard, Habits, Notes, Nutrition, Planning, Workouts } from "@/pages";
import type { ComponentType, SVGProps } from "react";
import type { LoaderFunction } from "react-router-dom";


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
    loader?: LoaderFunction,
    metadata?: {
        title?: string;
        icon?: ComponentType<SVGProps<SVGSVGElement>>;
        displayMode?: DisplayMode;
    }
}

export const sidebarRoutes = [
    {id: "dashboard", path: "dashboard", Component: Dashboard, metadata: {icon: TrendingUpDownIcon , title: "Dashboard", displayMode: DisplayMode.Sidebar}},
    {id: "nutrition", path: "nutrition", Component: Nutrition, metadata: {icon: HamIcon, title: "Nutrition", displayMode: DisplayMode.Sidebar}},
    {id: "workouts", path: "workouts", Component: Workouts, metadata: {icon: DumbellIcon, title: "Workouts", displayMode: DisplayMode.Sidebar}},
    {id: "planning", path: "planning", Component: Planning, metadata: {icon: CalendarCheckIcon, title: "Planning", displayMode: DisplayMode.Sidebar}},
    {id: "habits", path: "habits", Component: Habits, metadata: {icon: BookCheckIcon , title: "Habits", displayMode: DisplayMode.Sidebar}},
    {id: "notes", path: "notes",  Component: Notes, metadata: {icon: NoteBookPenIcon, title: "Notes", displayMode: DisplayMode.Sidebar}}
] as const satisfies ReadonlyArray<RouteConfig>;