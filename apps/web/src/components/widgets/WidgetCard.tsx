import "./widget-grid.css";
import type { WidgetDefinition } from "./widgets.types";
import { Icon, IconButton } from "../icons";
import type { ReactNode } from "react";
import { PlusIcon } from "../icons/library";

type WidgetCardProps = {
    readonly definition: WidgetDefinition;
    readonly children: ReactNode;
    readonly onRemove?: () => void;
};

export default function WidgetCard({definition, children, onRemove}: WidgetCardProps) {

    return (
        <div className={`widget-card bg-white border border-gray-200 rounded-xl h-full shadow-sm gap-2.5`}>
            {/* onRemove is only passed in edit mode: it marks the title bar as the drag handle.
                Step 2.1 will replace this test with the handle prop. */}
            <div className={`flex gap-3 items-center h-8 ${onRemove ? "widget-card-handle" : ""}`}>
                <Icon icon={definition.icon} size="sm" />
                <h1>{definition.title}</h1>
                {onRemove && 
                    <IconButton
                        icon={PlusIcon}
                        size="sm"
                        onClick={onRemove}
                        ariaLabel="Close"
                        className="rotate-45"
                        classNameBtn="ml-auto h-8 w-8 shrink-0 rounded-lg text-gray-500 hover:bg-gray-100"
                    />
                }   
            </div>
            <div className="h-px bg-gray-300 my-1"></div>
            {children}
        </div>
    );
}