import { useRef, type CSSProperties, type ReactNode, type RefObject } from "react";
import Widget from "./Widget";
import type { WidgetInstance } from "./widgets.types";
import "./widget-grid.css";
import { GRID_COLS } from "./widget-grid.constants";
import { sortReadingOrder } from "./engine/geometry";
import { useGridDrag } from "./hooks/useGridDrag";

type WidgetGridProps = {
    readonly widgets: WidgetInstance[];
    readonly toolbar?: ReactNode;
    readonly emptyState?: ReactNode;
    readonly isEditing: boolean;
    readonly onRemoveWidget?: (id: string) => void;
    readonly onDropWidget: (layout: WidgetInstance[]) => void;
};

export default function  WidgetGrid({widgets, toolbar, emptyState, onRemoveWidget, onDropWidget, isEditing}: WidgetGridProps) {
    
    const sortedWidgets: WidgetInstance[] = sortReadingOrder(widgets);
    // Dragging mode
    const gridRef: RefObject<HTMLDivElement | null> = useRef(null);
    const { draggingId, startDrag } = useGridDrag({gridRef: gridRef, widgets: sortedWidgets, onDrop: onDropWidget});

    return (
        <div className="p-4">
            <div className="widget-grid-frame">
                {emptyState ?? (
                    <>
                        {toolbar}
                        <div ref={gridRef} className="widget-grid" style={{"--cols": GRID_COLS} as CSSProperties}>
                            {sortedWidgets.map((w) => (
                            <div className="widget-cell" style={{"--col": w.position.x + 1, "--row": w.position.y + 1, "--w": w.size.width, "--h": w.size.height} as CSSProperties} key={w.id}>
                                <Widget instance={w} onRemove={isEditing ? onRemoveWidget : undefined} onHandlePointerDown={isEditing ? (e) => startDrag(w.id, e) : undefined}/>
                            </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}