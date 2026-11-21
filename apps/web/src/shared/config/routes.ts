import { BookCheckIcon, CalendarCheckIcon, DumbellIcon, HamIcon, NoteBookPenIcon, TrendingUpDownIcon } from "@/components/icons/library";
import { Dashboard, Habits, Login, Notes, Nutrition, Planning, Register, Workouts } from "@/pages";
import type { RouteConfig } from "./routes.types";
import { DisplayMode } from "./routes.types";
import { AuthDomain, MainDomain } from "../types/domain.types";

export const sidebarRoutes = [
    {id: "dashboard", path: MainDomain.DomainDashboard, Component: Dashboard, handle: {icon: TrendingUpDownIcon , title: "Dashboard", displayMode: DisplayMode.Sidebar}},
    {id: "nutrition", path: MainDomain.DomainNutrition, Component: Nutrition, handle: {icon: HamIcon, title: "Nutrition", displayMode: DisplayMode.Sidebar}},
    {id: "workouts", path: MainDomain.DomainWorkouts, Component: Workouts, handle: {icon: DumbellIcon, title: "Workouts", displayMode: DisplayMode.Sidebar}},
    {id: "planning", path: MainDomain.DomainPlanning, Component: Planning, handle: {icon: CalendarCheckIcon, title: "Planning", displayMode: DisplayMode.Sidebar}},
    {id: "habits", path: MainDomain.DomainHabits, Component: Habits, handle: {icon: BookCheckIcon , title: "Habits", displayMode: DisplayMode.Sidebar}},
    {id: "notes", path: MainDomain.DomainNotes,  Component: Notes, handle: {icon: NoteBookPenIcon, title: "Notes", displayMode: DisplayMode.Sidebar}}
] as const satisfies ReadonlyArray<RouteConfig>;

export const authRoutes = {
    Login: {id: "login", path: AuthDomain.DomainLogin, Component: Login, handle: {title: "Login", displayMode: DisplayMode.Fullscreen}},
    Register: {id: "register", path: AuthDomain.DomainRegister, Component: Register, handle: {title: "Register", displayMode: DisplayMode.Fullscreen}}
} as const satisfies Readonly<Record<string, RouteConfig>>;
