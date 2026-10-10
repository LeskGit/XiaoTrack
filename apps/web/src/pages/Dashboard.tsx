import type { WidgetInstance } from "@/components/widgets/widgets.types"
import WidgetGrid from "@/components/widgets/WidgetGrid"
import { useState } from "react";
import { sortReadingOrder } from "@/components/widgets/engine/geometry";

const widgets: WidgetInstance[] = ([
    {id: "1", type: "nutrition.dailyKcal"},
    {id: "1", type: "nutrition.dailyKcal"},
    {id: "1", type: "nutrition.dailyKcal"},
    {id: "1", type: "nutrition.dailyKcal"},
    
]);

const displayWidgets = (instances) => {
    
    const sortedWidgets: WidgetInstance = sortReadingOrder(instances);
}

export default function Dashboard() {

    const [savedWidgets, setSavedWidgets] = useState(widgets);
    const [dirtyWidgets, setDirtyWidgets] = useState(widgets);
    const [isEdited, setEdited] = useState(false);
    const [isPaletteOpen, setPalette] = useState(false);

    return (
        <WidgetGrid widgets={widgets} />
    )
}