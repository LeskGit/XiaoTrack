import type { WidgetInstance } from './widgets.types';
import WidgetCard from './WidgetCard'
import {widgetCatalog, type WidgetType} from './catalog'
import { type WidgetDefinition } from './widgets.types';
import { WidgetArchetype } from "./widgets.types"
import StatBody from './bodies/StatBody';
import { useWidgetData } from './hooks/useWidgetData';

type WidgetProps = {
    readonly instance: WidgetInstance
    readonly onRemove: (id: string) => void;
}

export default function Widget({instance, onRemove}: WidgetProps) {

    const definitionWidget = widgetCatalog[instance.type];
    const dataWidget = useWidgetData(instance);

    const handleRemoveClick = () => {onRemove(instance.id)};

    const cardBody = (definitionWidget: WidgetDefinition) => {
        switch (definitionWidget.archetype) {
            case WidgetArchetype.ArchetypeStat:
                return <WidgetCard definition={definitionWidget} onRemove={handleRemoveClick}>
                            {dataWidget.status === "success"
                            ? <StatBody data={dataWidget.data} />
                            : <p>{dataWidget.status === "error" ? dataWidget.message : "Loading ..."}</p>}
                        </WidgetCard>
            case WidgetArchetype.ArchetypeChart:
                return <WidgetCard definition={definitionWidget} onRemove={handleRemoveClick}>
                            {dataWidget.status === "success"
                            ? <StatBody data={dataWidget.data} />
                            : <p>{dataWidget.status === "error" ? dataWidget.message : "Loading ..."}</p>}
                        </WidgetCard>
        }
    }

    return(
        cardBody(definitionWidget)
    );
}