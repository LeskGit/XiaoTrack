import "./widget-grid.css";
import type { WidgetDefinition } from "./widgets.types";
import { Icon, IconButton } from "../icons";
import type { ReactNode, PointerEvent } from "react";
import { GripIcon, PlusIcon } from "../icons/library";

type WidgetCardProps = {
    readonly definition: WidgetDefinition;
    readonly children: ReactNode;
    readonly onRemove?: () => void;
    readonly onHandlePointerDown?: (e: PointerEvent<HTMLDivElement>) => void;
};

export default function WidgetCard({definition, children, onRemove, onHandlePointerDown}: WidgetCardProps) {

    // Edit mode = the grid gave us a drag handler
    const isEditable: boolean = onHandlePointerDown !== undefined;

    const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
        // Check if target is button or not left clicked action
        if ((e.target as HTMLElement).closest("button") || e.button !== 0) return;
        onHandlePointerDown?.(e);
    }

    return (
        <article className={`widget-card ${isEditable ? "is-editable" : ""}`}>
            <div
                onPointerDown={isEditable ? handlePointerDown : undefined}
                className={`widget-card-header ${isEditable ? "widget-card-handle" : ""}`}
            >
                {isEditable && (
                    <span className="widget-card-grip" aria-hidden="true">
                        <Icon icon={GripIcon} size="custom" className="h-4 w-4" />
                    </span>
                )}
                <span className="widget-card-icon" aria-hidden="true">
                    <Icon icon={definition.icon} size="custom" className="h-4 w-4" iconWeight="regular" />
                </span>
                <h2 className="widget-card-title">{definition.title}</h2>
                {onRemove &&
                    <IconButton
                        icon={PlusIcon}
                        size="custom"
                        onClick={onRemove}
                        ariaLabel={`Remove ${definition.title}`}
                        className="h-4 w-4 rotate-45"
                        iconWeight="bold"
                        classNameBtn="widget-card-remove"
                    />
                }
            </div>
            <div className="widget-card-body">
                {children}
            </div>
        </article>
    );
}
