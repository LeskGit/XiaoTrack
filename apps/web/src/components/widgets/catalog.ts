import { HamIcon } from "../icons/library";
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
} as const satisfies Record<string, WidgetDefinition>;

export type WidgetType = keyof typeof widgetCatalog;

