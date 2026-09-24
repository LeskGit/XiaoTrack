import  { MainDomain } from "@/shared/types";
import { HamIcon } from "../icons/library";
import { WidgetArchetype, type WidgetDefinition } from "./widgets.types";
import type { defaultPosition, defaultSize } from "@/shared/styles/defaultProperties.styles";


export const widgetCatalog = {
    "nutrition.dailyKcal":  { 
        title: "Daily calories", 
        icon: HamIcon, 
        domain: MainDomain.DomainNutrition, 
        endpoint: "/", 
        archetype: WidgetArchetype.ArchetypeStat, 
        unit: "kcal", 
    },
} as const satisfies Record<string, WidgetDefinition>;

export type WidgetType = keyof typeof widgetCatalog;

export type WidgetInstance = {
    id: number, type: WidgetType, size: defaultSize, position: defaultPosition
};