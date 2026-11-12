import WidgetCard from "./WidgetCard";
import { widgetCatalog } from "./catalog";
import { widgetArchetypes } from "./archetypes";
import { useWidgetData } from "./hooks/useWidgetData";
import WidgetSkeleton from "./bodies/WidgetSkeleton";
import WidgetError from "./bodies/WidgetError";
import type { PointerEvent } from "react";
import type { ArchetypeData, WidgetArchetype, WidgetInstance } from "./widgets.types";

type WidgetProps = {
    readonly instance: WidgetInstance;
    readonly onRemove?: (id: string) => void;
    readonly onHandlePointerDown?: (e: PointerEvent<HTMLDivElement>) => void
};

function renderBody<A extends WidgetArchetype>(input: ArchetypeData<A>) {
    const { Body } = widgetArchetypes[input.archetype];
    return <Body data={input.data} />;
}

export default function Widget({ instance, onRemove, onHandlePointerDown }: WidgetProps) {
    const definition = widgetCatalog[instance.type];
    const dataState = useWidgetData(instance);

    const handleRemoveClick = onRemove ? () => onRemove(instance.id) : undefined;

    return (
        <WidgetCard definition={definition} onRemove={handleRemoveClick} onHandlePointerDown={onHandlePointerDown}>
            {dataState.status === "success" && renderBody(dataState.data)}
            {dataState.status === "loading" && <WidgetSkeleton />}
            {dataState.status === "error" && <WidgetError message={dataState.message} />}
        </WidgetCard>
    );
}