import type { ComponentType, SVGProps } from "react";
import { MainDomain } from "@/shared/types/domain.types";


export const WidgetArchetype = {
    ArchetypeStat: "stat",
    ArchetypeChart: "chart",
} as const;

export type WidgetArchetype = typeof WidgetArchetype[keyof typeof WidgetArchetype];

export const WidgetSize = {
    SizeSmall:  "small",
    SizeMedium: "medium",
    SizeLarge:  "large",
    SizeWide:   "wide",
} as const;
export type WidgetSize = typeof WidgetSize[keyof typeof WidgetSize];

export const widgetSizeClasses = {
    small:  "col-span-1 md:col-span-2 row-span-1",
    medium: "col-span-2 md:col-span-3 row-span-1",
    large:  "col-span-3 md:col-span-4 row-span-2",
    wide:   "col-span-full row-span-1",
} as const satisfies Record<WidgetSize, string>;

type WidgetBase = {
    title: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    domain: MainDomain;
    endpoint: string;
    size: WidgetSize;
}

export type WidgetDefinition = WidgetBase & (
    | { archetype: typeof WidgetArchetype.ArchetypeStat; unit: string}
    | { archetype: typeof WidgetArchetype.ArchetypeChart;}
);
