import { BookCheckIcon, CalendarCheckIcon, DumbellIcon, HamIcon, NoteBookPenIcon, TrendingUpDownIcon } from "@/components/icons/library";
import { Dashboard, Habits, Notes, Nutrition, Planning, Workouts } from "@/pages";
import type { ComponentType, SVGProps } from "react";


type RouteConfig = {
    title: string;
    path: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    Component: ComponentType;
    showInSidebar: boolean;
}

export const routes: Array<RouteConfig> = [
    {title: "dashboard", path: "/dashboard", icon: TrendingUpDownIcon, Component: Dashboard , showInSidebar: true},
    {title: "nutrition", path: "/nutrition", icon: HamIcon, Component: Nutrition , showInSidebar: true},
    {title: "workouts", path: "/workouts", icon: DumbellIcon, Component: Workouts , showInSidebar: true},
    {title: "planning", path: "/planning", icon: CalendarCheckIcon, Component: Planning , showInSidebar: true},
    {title: "habits", path: "/habits", icon: BookCheckIcon, Component: Habits , showInSidebar: true},
    {title: "notes", path: "/notes", icon: NoteBookPenIcon, Component: Notes , showInSidebar: true}
]