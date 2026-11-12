import { widgetCatalog, type WidgetType } from "../catalog";
import { resolveWidgetDefaultSize } from "../engine/instance";
import { WidgetArchetype } from "../widgets.types";
import WidgetPaletteItem from "./WidgetPaletteItem";
import "./palette.css";

type WidgetPaletteProps = {
    readonly placedTypes: readonly WidgetType[];
    readonly onAdd: (type: WidgetType) => void;
}

const paletteEntries = (Object.keys(widgetCatalog) as WidgetType[]).map((type) => {
    const definition = widgetCatalog[type];
    return {
        type,
        title: definition.title,
        icon: definition.icon,
        archetype: definition.archetype,
        size: resolveWidgetDefaultSize(type),
    };
});

// One section per archetype (cadrage V1: palette grouped by archetype, no search)
const paletteGroups = [
    { archetype: WidgetArchetype.ArchetypeStat, label: "Stats" },
    { archetype: WidgetArchetype.ArchetypeChart, label: "Charts" },
].map((group) => ({
    ...group,
    entries: paletteEntries.filter((entry) => entry.archetype === group.archetype),
}));

export default function WidgetPalette({placedTypes, onAdd}: WidgetPaletteProps) {

    return (
        <div className="flex flex-col gap-6 overflow-y-auto">
            {paletteGroups.map((group) => (
                <section key={group.archetype} aria-labelledby={`palette-${group.archetype}`}>
                    <h3
                        id={`palette-${group.archetype}`}
                        className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-gray-500 uppercase"
                    >
                        {group.label}
                        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[0.6875rem] font-medium text-gray-500">
                            {group.entries.length}
                        </span>
                    </h3>
                    <ul className="flex flex-col gap-2">
                        {group.entries.map((entry) => (
                            <WidgetPaletteItem
                                key={entry.type}
                                title={entry.title}
                                size={entry.size}
                                icon={entry.icon}
                                isPlaced={placedTypes.includes(entry.type)}
                                onAdd={() => onAdd(entry.type)}
                            />
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    )
}
