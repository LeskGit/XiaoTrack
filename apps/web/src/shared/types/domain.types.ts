


export const MainDomain = {
    DomainDashboard: "dashboard",
    DomainNutrition: "nutrition",
    DomainWorkouts: "workouts",
    DomainPlanning: "planning",
    DomainHabits: "habits",
    DomainNotes: "notes",
} as const;

export type MainDomain = typeof MainDomain[keyof typeof MainDomain];

/** Public pages, outside the app shell (no sidebar, no auth guard). */
export const AuthDomain = {
    DomainLogin: "login",
    DomainRegister: "register",
} as const;

export type AuthDomain = typeof AuthDomain[keyof typeof AuthDomain];
