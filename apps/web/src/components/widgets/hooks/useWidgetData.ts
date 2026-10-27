import type { DataState } from "@/shared/types/state.types";
import { widgetCatalog } from "../catalog";
import { WidgetArchetype, type ArchetypeData, type WidgetInstance } from "../widgets.types";

export const useWidgetData = (instance: WidgetInstance): DataState<ArchetypeData> => {
    const { archetype } = widgetCatalog[instance.type];

    switch (archetype) {
        case WidgetArchetype.ArchetypeStat:
            return { status: "success", data: { archetype, data: { value: 1840, unit: "kcal" } } };
        case WidgetArchetype.ArchetypeChart:
            return { status: "success", data: { archetype, data: { points: [3, 5, 2, 8] } } };
        default: {
            const unreachable: never = archetype;
            return unreachable;
        }
    }
};