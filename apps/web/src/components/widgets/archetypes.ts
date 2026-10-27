import ChartBody from "./bodies/ChartBody";
import StatBody from "./bodies/StatBody";
import { WidgetArchetype, type ArchetypeTable } from "./widgets.types";

export const widgetArchetypes: ArchetypeTable = {
    [WidgetArchetype.ArchetypeStat]: {
        Body: StatBody,
        defaultSize: { height: 1, width: 2 },
        minSize: { height: 1, width: 2 },
    },
    [WidgetArchetype.ArchetypeChart]: {
        Body: ChartBody,
        defaultSize: { height: 2, width: 4 },
        minSize: { height: 2, width: 3 },
    },
};