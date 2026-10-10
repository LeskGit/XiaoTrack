import { BookCheckIcon, HamIcon } from "../icons/library";
import { type WidgetDefinition } from "./widgets.types";
import { WidgetArchetype } from "./widgets.types"

export const widgetCatalog = {
    "nutrition.dailyKcal":  { 
        title: "Daily calories", 
        icon: HamIcon, 
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
} as const satisfies Record<string, WidgetDefinition>;

export type WidgetType = keyof typeof widgetCatalog;

