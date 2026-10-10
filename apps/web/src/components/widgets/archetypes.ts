import { WidgetArchetype, type ArchetypeDefinition } from "./widgets.types";


export const widgetArchetypes = {
    [WidgetArchetype.ArchetypeStat]: {defaultSize: {height: 1, width: 2}, minSize: {height: 1, width: 2}},
    [WidgetArchetype.ArchetypeChart]: {defaultSize: {height: 2, width: 4}, minSize: {height: 2, width: 3}},
} as const satisfies Record<WidgetArchetype, ArchetypeDefinition>;