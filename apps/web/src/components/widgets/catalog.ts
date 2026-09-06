import  { MainDomain } from "@/shared/types";
import { HamIcon } from "../icons/library";
import { WidgetArchetype, type WidgetDefinition } from "./widgets.types";




export const widgetCatalog = {
    "nutrition.dailyKcal":  { 
        title: "Daily calories", icon: HamIcon, domain: MainDomain.DomainNutrition, endpoint: "/", width: 2, height: 1, archetype: WidgetArchetype.ArchetypeStat, unit: "kcal", 
    },
} as const satisfies Record<string, WidgetDefinition>;

export type WidgetType = keyof typeof widgetCatalog;

export type WidgetInstance = {
    type: WidgetType, x: number, y: number;
};