


export const MainDomain = {
    DomainDashboard: "dashboard",
    DomainNutrition: "nutrition",
    DomainWorkouts: "workouts",
    DomainPlanning: "planning",
    DomainHabits: "habits",
    DomainNotes: "notes",
} as const;

export type MainDomain = typeof MainDomain[keyof typeof MainDomain];
