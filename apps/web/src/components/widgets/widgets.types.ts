import type { ComponentType, SVGProps } from "react";
import { MainDomain } from "@/shared/types/domain.types";


export const WidgetArchetype = {
    ArchetypeStat: "stat",
    ArchetypeChart: "chart",
} as const;

export type WidgetArchetype = typeof WidgetArchetype[keyof typeof WidgetArchetype];

type WidgetBase = {
    title: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    domain: MainDomain;
    endpoint: string;
    width: number;
    height: number;
}

export type WidgetDefinition = WidgetBase & (
    | { archetype: typeof WidgetArchetype.ArchetypeStat; unit: string}
    | { archetype: typeof WidgetArchetype.ArchetypeChart;}
);
