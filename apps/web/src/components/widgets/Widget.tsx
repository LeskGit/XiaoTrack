import type { WidgetInstance } from './catalog';
import WidgetCard from './WidgetCard'
import {widgetCatalog} from './catalog'
import { WidgetArchetype, type WidgetDefinition } from './widgets.types';
import StatBody from './catalog/StatBody';

type WidgetProps = {instance: WidgetInstance}

export default function Widget({instance}: WidgetProps) {

    // useWidgetData ici

    const typeWidget = widgetCatalog[instance.type];

    const cardBody = (widget: WidgetDefinition) => {
        switch (widget.archetype) {
            case WidgetArchetype.ArchetypeStat:
                return <WidgetCard size={widget.size} children={<StatBody data={typeWidget}/>}  />
        }
    }

    return(
        cardBody(typeWidget)
    );
}