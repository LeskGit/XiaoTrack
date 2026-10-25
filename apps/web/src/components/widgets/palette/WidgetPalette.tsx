import { widgetCatalog, type WidgetType } from "../catalog";
import { resolveWidgetDefaultSize } from "../engine/instance";
import WidgetPaletteItem from "./WidgetPaletteItem";

type WidgetPaletteProps = {
    readonly placedTypes: readonly WidgetType[];
    readonly onAdd: (type: WidgetType) => void;
}

const paletteEntries =  (Object.keys(widgetCatalog) as WidgetType[]).map((type) => {
    const definition = widgetCatalog[type];
    const size = resolveWidgetDefaultSize(type);
    return {
        type,
        title: definition.title,
        icon: definition.icon,
        description: `${definition.archetype} · ${size.width} x ${size.height}`,
    };
});

export default function WidgetPalette({placedTypes, onAdd}: WidgetPaletteProps) {

    return (
        <div className="">
            <ul className="flex flex-col gap-2">
                {paletteEntries.map((entry) => (
                        <WidgetPaletteItem  
                            title={entry.title}
                            description={entry.description}
                            icon={entry.icon}
                            isPlaced={placedTypes.includes(entry.type)}
                            onAdd={() => onAdd(entry.type)}
                        />
                ))}
            </ul>
        </div>
    )
}