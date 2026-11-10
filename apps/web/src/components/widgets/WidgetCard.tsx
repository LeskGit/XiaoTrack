import "./widget-grid.css";
import type { WidgetDefinition } from "./widgets.types";
import { Icon, IconButton } from "../icons";
import type { ReactNode, PointerEvent } from "react";
import { PlusIcon } from "../icons/library";

type WidgetCardProps = {
    readonly definition: WidgetDefinition;
    readonly children: ReactNode;
    readonly onRemove?: () => void;
    readonly onHandlePointerDown?: (e: PointerEvent<HTMLDivElement>) => void;
};

export default function WidgetCard({definition, children, onRemove, onHandlePointerDown}: WidgetCardProps) {

    const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
        // Check if target is button or not left clicked action
        if ((e.target as HTMLElement).closest("button") || e.button !== 0) return;
        onHandlePointerDown?.(e);
    }


    return (
        <div className={`widget-card bg-white border border-gray-200 rounded-xl h-full shadow-sm gap-2.5`}>
            <div onPointerDown={onHandlePointerDown ? handlePointerDown : undefined} className={`flex gap-3 items-center h-8 ${onHandlePointerDown ? "widget-card-handle" : ""}`}>
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