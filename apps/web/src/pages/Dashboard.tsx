import type { WidgetInstance } from "@/components/widgets/widgets.types"
import WidgetGrid from "@/components/widgets/WidgetGrid"
import { useState } from "react";
import type { WidgetType } from "@/components/widgets/catalog";
import { createInstance } from "@/components/widgets/engine/instance";

const fixtureTypes: WidgetType[] = [
    "nutrition.dailyKcal",
    "nutrition.dailyKcal",
    "chartExemple",
    "chartExemple",
    "nutrition.dailyKcal",
    "chartExemple",
];

const fixture: WidgetInstance[] = fixtureTypes.reduce<WidgetInstance[]>(
    (acc, type) => [...acc, createInstance(type, acc)],
    [],
);

export default function Dashboard() {

    const [savedWidgets, setSavedWidgets] = useState(fixture);
    const [draftWidgets, setDraftWidgets] = useState(fixture);
    const [isEditing, setIsEditing] = useState(false);
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);

    const isDirty: boolean = savedWidgets !== draftWidgets;

    return (
        <WidgetGrid widgets={isEditing ? draftWidgets : savedWidgets} />
    )
}