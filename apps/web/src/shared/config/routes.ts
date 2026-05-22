import { BookCheckIcon, CalendarCheckIcon, DumbellIcon, HamIcon, NoteBookPenIcon, TrendingUpDownIcon } from "@/components/icons/library";
import { Dashboard, Habits, Notes, Nutrition, Planning, Workouts } from "@/pages";
import type { ComponentType, SVGProps } from "react";


type RouteConfig = {
    id: string;
    title: string;
    path: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    Component: ComponentType;
    showInSidebar: boolean;
}

export const routes: Array<RouteConfig> = [
    {id: "dashboard", title: "Dashboard", path: "dashboard", icon: TrendingUpDownIcon, Component: Dashboard , showInSidebar: true},
    {id: "nutrition", title: "Nutrition", path: "nutrition", icon: HamIcon, Component: Nutrition , showInSidebar: true},
    {id: "workouts", title: "Workouts", path: "workouts", icon: DumbellIcon, Component: Workouts , showInSidebar: true},
    {id: "planning", title: "Planning", path: "planning", icon: CalendarCheckIcon, Component: Planning , showInSidebar: true},
    {id: "habits", title: "Habits", path: "habits", icon: BookCheckIcon, Component: Habits , showInSidebar: true},
    {id: "notes", title: "Notes", path: "notes", icon: NoteBookPenIcon, Component: Notes , showInSidebar: true}
]