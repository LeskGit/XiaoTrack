import type { MainDomain } from "@/shared/types/domain.types";

/**
 * Colour of each domain (charter §2.5), as a CSS value for the --tone variable read by the
 * `tone-tile` utility. Only for icon tiles: never on buttons, text or charts.
 * The dashboard is not a domain of its own: it takes the interface accent.
 */
export const domainToneMap = {
    dashboard: "var(--color-accent)",
    nutrition: "var(--color-domain-nutrition)",
    workouts: "var(--color-domain-workouts)",
    planning: "var(--color-domain-planning)",
    habits: "var(--color-domain-habits)",
    notes: "var(--color-domain-notes)",
} as const satisfies Record<MainDomain, string>;
