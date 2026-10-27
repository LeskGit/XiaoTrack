import type { ComponentType, SVGProps } from "react";
import type { WidgetType } from "./catalog";
import type { ChartData, StatData } from "./widget-states.types";

/**
 * Grid types
 */

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

/**
 * Archetype types 
 */

export const WidgetArchetype = {
    ArchetypeStat: "stat",
    ArchetypeChart: "chart",
} as const;

export type WidgetArchetype = typeof WidgetArchetype[keyof typeof WidgetArchetype];


export type ArchetypeDataMap = {
    [WidgetArchetype.ArchetypeStat]: StatData;
    [WidgetArchetype.ArchetypeChart]: ChartData;
}

export type BodyProps<A extends WidgetArchetype> = {
    readonly data: ArchetypeDataMap[A];
}

export type ArchetypeSizes = {
    readonly defaultSize: GridSize;
    readonly minSize: GridSize;
};

export type ArchetypeDefinition<A extends WidgetArchetype> = ArchetypeSizes & {
    readonly Body: ComponentType<BodyProps<A>>;
} 

export type ArchetypeTable = {
    readonly [A in WidgetArchetype]: ArchetypeDefinition<A>;
}

export type ArchetypeData<A extends WidgetArchetype = WidgetArchetype> = {
    [K in A]: {readonly archetype: K; readonly data: ArchetypeDataMap[K]};
}[A];

/**
 * Widget type 
 */

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
