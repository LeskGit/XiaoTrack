import "./widget-grid.css";
import type { WidgetDefinition } from "./widgets.types";
import { Icon, IconButton } from "../icons";
import type { ReactNode } from "react";
import { PlusIcon } from "../icons/library";

type WidgetCardProps = {
    readonly definition: WidgetDefinition;
    readonly children: ReactNode;
    readonly onRemove: () => void;
};

export default function WidgetCard(widgetCard: WidgetCardProps) {

    return (
        <div className={`widget-card bg-white border border-gray-200 rounded-xl h-full shadow-sm gap-2.5`}>
            <div className="flex gap-3 items-center">
                <Icon icon={widgetCard.definition.icon} size="sm" />
                <h1>{widgetCard.definition.title}</h1>
                <IconButton
                    icon={PlusIcon}
                    size="sm"
                    onClick={widgetCard.onRemove}
                    ariaLabel="Close"
                    className="rotate-45"
                    classNameBtn="ml-auto h-8 w-8 shrink-0 rounded-lg text-gray-500 hover:bg-gray-100"
                />
            </div>
            <div className="h-px bg-gray-300 my-1"></div>
            {widgetCard.children}
        </div>
    );
}