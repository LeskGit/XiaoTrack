import { BookCheckIcon, CalendarCheckIcon, DumbellIcon, HamIcon, NoteBookPenIcon, TrendingUpDownIcon } from "@/components/icons/library";
import { Dashboard, Habits, Notes, Nutrition, Planning, Workouts } from "@/pages";
import type { ComponentType, SVGProps } from "react";


export const DisplayMode = {
    Sidebar: "sidebar",
    Modal: "modal",
    Fullscreen: "fullscreen"
} as const;

export type DisplayMode = typeof DisplayMode[keyof typeof DisplayMode];

export type RouteConfig = {
    id: string;
    title: string;
    path: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    Component: ComponentType;
    displayMode: DisplayMode;
}

export const defaultRoute = {
    id: "dashboard", title: "Dashboard", path: "dashboard", icon: TrendingUpDownIcon, Component: Dashboard , displayMode: DisplayMode.Sidebar
} as const satisfies RouteConfig;

export const routes = [
    {id: "dashboard", title: "Dashboard", path: "dashboard", icon: TrendingUpDownIcon, Component: Dashboard , displayMode: DisplayMode.Sidebar},
    {id: "nutrition", title: "Nutrition", path: "nutrition", icon: HamIcon, Component: Nutrition , displayMode: DisplayMode.Sidebar},
    {id: "workouts", title: "Workouts", path: "workouts", icon: DumbellIcon, Component: Workouts , displayMode: DisplayMode.Sidebar},
    {id: "planning", title: "Planning", path: "planning", icon: CalendarCheckIcon, Component: Planning , displayMode: DisplayMode.Sidebar},
    {id: "habits", title: "Habits", path: "habits", icon: BookCheckIcon, Component: Habits , displayMode: DisplayMode.Sidebar},
    {id: "notes", title: "Notes", path: "notes", icon: NoteBookPenIcon, Component: Notes , displayMode: DisplayMode.Sidebar}
] as const satisfies ReadonlyArray<RouteConfig>;