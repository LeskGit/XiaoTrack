import  { MainDomain } from "@/shared/types";
import { HamIcon } from "../icons/library";
import { WidgetArchetype, WidgetSize, type WidgetDefinition } from "./widgets.types";


export const widgetCatalog = {
    "nutrition.dailyKcal":  { 
        title: "Daily calories", 
        icon: HamIcon, 
        domain: MainDomain.DomainNutrition, 
        endpoint: "/", 
        size: WidgetSize.SizeSmall,
        archetype: WidgetArchetype.ArchetypeStat, 
        unit: "kcal", 
    },
} as const satisfies Record<string, WidgetDefinition>;

export type WidgetType = keyof typeof widgetCatalog;

export type WidgetInstance = {
    id: number, type: WidgetType, position: number;
};