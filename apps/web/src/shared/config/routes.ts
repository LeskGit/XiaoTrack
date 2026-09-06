import { BookCheckIcon, CalendarCheckIcon, DumbellIcon, HamIcon, NoteBookPenIcon, TrendingUpDownIcon } from "@/components/icons/library";
import { Dashboard, Habits, Notes, Nutrition, Planning, Workouts } from "@/pages";
import type { RouteConfig } from "./routes.types";
import { DisplayMode } from "./routes.types";
import { MainDomain } from "../types/domain.types";

export const sidebarRoutes = [
    {id: "dashboard", path: MainDomain.DomainDashboard, Component: Dashboard, handle: {icon: TrendingUpDownIcon , title: "Dashboard", displayMode: DisplayMode.Sidebar}},
    {id: "nutrition", path: MainDomain.DomainNutrition, Component: Nutrition, handle: {icon: HamIcon, title: "Nutrition", displayMode: DisplayMode.Sidebar}},
    {id: "workouts", path: MainDomain.DomainWorkouts, Component: Workouts, handle: {icon: DumbellIcon, title: "Workouts", displayMode: DisplayMode.Sidebar}},
    {id: "planning", path: MainDomain.DomainPlanning, Component: Planning, handle: {icon: CalendarCheckIcon, title: "Planning", displayMode: DisplayMode.Sidebar}},
    {id: "habits", path: MainDomain.DomainHabits, Component: Habits, handle: {icon: BookCheckIcon , title: "Habits", displayMode: DisplayMode.Sidebar}},
    {id: "notes", path: MainDomain.DomainNotes,  Component: Notes, handle: {icon: NoteBookPenIcon, title: "Notes", displayMode: DisplayMode.Sidebar}}
] as const satisfies ReadonlyArray<RouteConfig>;