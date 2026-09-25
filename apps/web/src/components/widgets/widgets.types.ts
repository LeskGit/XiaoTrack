import type { ComponentType, SVGProps } from "react";
import { MainDomain } from "@/shared/types/domain.types";
import type { DefaultPosition, DefaultSize } from "@/shared/styles/defaultProperties.styles";
import type { WidgetType } from "./catalog";

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
}

export type WidgetDefinition = WidgetBase & (
    | { archetype: typeof WidgetArchetype.ArchetypeStat; unit: string}
    | { archetype: typeof WidgetArchetype.ArchetypeChart;}
);

export type WidgetInstance = {
    id: number, type: WidgetType, size: DefaultSize, position: DefaultPosition
};