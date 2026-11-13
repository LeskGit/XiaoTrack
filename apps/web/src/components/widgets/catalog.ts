import { BookCheckIcon, CalendarCheckIcon, DumbellIcon, HamIcon, NoteBookPenIcon, TrendingUpDownIcon } from "../icons/library";
import { type WidgetDefinition } from "./widgets.types";
import { domainToneMap } from "@/shared/styles";
import { WidgetArchetype } from "./widgets.types"

export const widgetCatalog = {
    "nutrition.dailyKcal":  { 
        title: "Daily calories", 
        icon: HamIcon, 
        tone: domainToneMap.nutrition,
        endpoint: "/", 
        archetype: WidgetArchetype.ArchetypeStat, 
        unit: "kcal", 
    },
    "chartExemple":  { 
        title: "chartExemple", 
        icon: BookCheckIcon, 
        endpoint: "/", 
        archetype: WidgetArchetype.ArchetypeChart, 
        defaultSize: {width: 4, height: 3}
    },

    // Test entries (V2): varied sizes to exercise the push and compaction rules.
    // Sizes go from 2×1 to full width (12×2).

    // Nutrition
    "nutrition.protein": {
        title: "Daily protein",
        icon: HamIcon,
        tone: domainToneMap.nutrition,
        endpoint: "/",
        archetype: WidgetArchetype.ArchetypeStat,
        unit: "g",
    },
    "nutrition.water": {
        title: "Water intake",
        icon: HamIcon,
        tone: domainToneMap.nutrition,
        endpoint: "/",
        archetype: WidgetArchetype.ArchetypeStat,
        unit: "L",
        defaultSize: {width: 3, height: 1},
    },
    "nutrition.weeklyKcal": {
        title: "Calories this week",
        icon: HamIcon,
        tone: domainToneMap.nutrition,
        endpoint: "/",
        archetype: WidgetArchetype.ArchetypeChart,
        defaultSize: {width: 6, height: 2},
    },

    // Workout
    "workout.sessionsThisWeek": {
        title: "Sessions this week",
        icon: DumbellIcon,
        tone: domainToneMap.workouts,
        endpoint: "/",
        archetype: WidgetArchetype.ArchetypeStat,
        unit: "sessions",
    },
    "workout.personalRecords": {
        title: "Personal records",
        icon: DumbellIcon,
        tone: domainToneMap.workouts,
        endpoint: "/",
        archetype: WidgetArchetype.ArchetypeStat,
        unit: "PR",
        defaultSize: {width: 3, height: 2},
    },
    "workout.volume": {
        title: "Training volume",
        icon: DumbellIcon,
        tone: domainToneMap.workouts,
        endpoint: "/",
        archetype: WidgetArchetype.ArchetypeChart,
    },

    // Body
    "body.weight": {
        title: "Current weight",
        icon: TrendingUpDownIcon,
        endpoint: "/",
        archetype: WidgetArchetype.ArchetypeStat,
        unit: "kg",
    },
    "body.weightTrend": {
        title: "Weight trend",
        icon: TrendingUpDownIcon,
        endpoint: "/",
        archetype: WidgetArchetype.ArchetypeChart,
        defaultSize: {width: 8, height: 2},
    },

    // Habits
    "habits.streak": {
        title: "Current streak",
        icon: CalendarCheckIcon,
        tone: domainToneMap.habits,
        endpoint: "/",
        archetype: WidgetArchetype.ArchetypeStat,
        unit: "days",
    },
    "habits.weeklyOverview": {
        title: "Habits this week",
        icon: CalendarCheckIcon,
        tone: domainToneMap.habits,
        endpoint: "/",
        archetype: WidgetArchetype.ArchetypeChart,
        defaultSize: {width: 12, height: 2},
    },

    // Journal and learning
    "journal.entries": {
        title: "Journal entries",
        icon: NoteBookPenIcon,
        tone: domainToneMap.notes,
        endpoint: "/",
        archetype: WidgetArchetype.ArchetypeStat,
        unit: "entries",
        defaultSize: {width: 2, height: 2},
    },
    "learning.booksRead": {
        title: "Books read",
        icon: BookCheckIcon,
        endpoint: "/",
        archetype: WidgetArchetype.ArchetypeStat,
        unit: "books",
    },
} as const satisfies Record<string, WidgetDefinition>;

export type WidgetType = keyof typeof widgetCatalog;

