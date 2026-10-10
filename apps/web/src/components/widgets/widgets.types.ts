import type { ComponentType, SVGProps } from "react";
import type { WidgetType } from "./catalog";


export type GridSize = {
    readonly width: number;
    readonly height: number;
}

export type GridPosition = {
    readonly x: number;
    readonly y: number;
}

export type GridRect = {
    size: GridSize, position: GridPosition
}

export type ArchetypeDefinition = {
    defaultSize: GridSize;
    minSize: GridSize;
}

export const WidgetArchetype = {
    ArchetypeStat: "stat",
    ArchetypeChart: "chart",
} as const;

export type WidgetArchetype = typeof WidgetArchetype[keyof typeof WidgetArchetype];

type WidgetBase = {
    title: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    endpoint: string;
    defaultSize?: GridSize;
}

export type StatWidgetDefinition = WidgetBase & ({ archetype: typeof WidgetArchetype.ArchetypeStat; unit: string});
export type ChartWidgetDefinition = WidgetBase & ({ archetype: typeof WidgetArchetype.ArchetypeChart});

export type WidgetDefinition = WidgetBase & (
    | StatWidgetDefinition
    | ChartWidgetDefinition
);

export type WidgetInstance = GridRect & {
    id: string, type: WidgetType,
};
