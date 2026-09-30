import "./widget-grid.css";
import type { WidgetDefinition } from "./widgets.types";
import { Icon } from "../icons";
import type { ReactNode } from "react";

type WidgetCardProps = {
    readonly definition: WidgetDefinition;
    readonly children: ReactNode;
};

export default function WidgetCard(widgetCard: WidgetCardProps) {

    return (
        <div className={`widget-card bg-white border border-gray-200 rounded-xl h-full shadow-sm gap-2.5`}>
            <div className="flex gap-3 items-center">
                <Icon icon={widgetCard.definition.icon} size="sm" />
                <h1>{widgetCard.definition.title}</h1>
            </div>
            <div className="h-px bg-gray-300 my-1"></div>
            {widgetCard.children}
        </div>
    );
}