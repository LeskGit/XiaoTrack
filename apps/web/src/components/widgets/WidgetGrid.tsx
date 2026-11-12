import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import Widget from "./Widget";
import WidgetGridCell from "./WidgetGridCell";
import type { WidgetInstance } from "./widgets.types";
import "./widget-grid.css";
import {
    GRID_COLS,
    WIDGET_ENTRANCE_MAX_DELAY_MS,
    WIDGET_ENTRANCE_MS,
    WIDGET_ENTRANCE_STEP_MS,
    WIDGET_EXIT_MS,
} from "./widget-grid.constants";
import { sortReadingOrder } from "./engine/geometry";
import { useGridDrag } from "./hooks/useGridDrag";
import { useFlipAnimation } from "./hooks/useFlipAnimation";
import { prefersReducedMotion } from "@/shared/utils";

type WidgetGridProps = {
    readonly widgets: WidgetInstance[];
    readonly toolbar?: ReactNode;
    // Shown under the grid (the floating edit bar)
    readonly footer?: ReactNode;
    readonly emptyState?: ReactNode;
    readonly isEditing: boolean;
    readonly onRemoveWidget?: (id: string) => void;
    readonly onDropWidget: (layout: WidgetInstance[]) => void;
};

const NO_IDS: ReadonlySet<string> = new Set();

export default function  WidgetGrid({widgets, toolbar, footer, emptyState, onRemoveWidget, onDropWidget, isEditing}: WidgetGridProps) {

    const sortedWidgets: WidgetInstance[] = sortReadingOrder(widgets);
    // Dragging mode
    const gridRef: RefObject<HTMLDivElement | null> = useRef(null);
    const { draggingId, dragDelta, previewLayout, shownLayout, startDrag } = useGridDrag({gridRef: gridRef, widgets: sortedWidgets, onDrop: onDropWidget});
    // Where the held widget would really land if dropped now (after push and compaction)
    const landing: WidgetInstance | undefined = draggingId ? previewLayout?.find((p) => p.id === draggingId) : undefined;

    // Cells slide to their new place instead of jumping (neighbours, compaction, drop)
    useFlipAnimation({ gridRef, draggingId, dragDelta });

    // First display: the widgets come in one after the other. After that, new ones pop in at once.
    const [isSettled, setIsSettled] = useState(false);
    useEffect(() => {
        const timer = window.setTimeout(() => setIsSettled(true), WIDGET_ENTRANCE_MS);
        return () => window.clearTimeout(timer);
    }, []);

    // Removal: the widget plays its exit animation first, and leaves the draft afterwards
    const [exitingIds, setExitingIds] = useState<ReadonlySet<string>>(NO_IDS);
    const exitTimersRef = useRef<Map<string, number>>(new Map());

    // Leaving edit mode (Cancel, Save) forgets the removals in progress.
    // Adjusting state while rendering, when a prop changes: React's recommended pattern (no effect needed).
    const [wasEditing, setWasEditing] = useState(isEditing);
    if (wasEditing !== isEditing) {
        setWasEditing(isEditing);
        setExitingIds(NO_IDS);
    }
    // ...and their timers, so a Cancel is not followed by a late removal (also on unmount)
    useEffect(() => {
        const timers = exitTimersRef.current;
        return () => {
            timers.forEach((timer) => window.clearTimeout(timer));
            timers.clear();
        };
    }, [isEditing]);

    const handleRemove = (id: string) => {
        // Already leaving: a second click on ✕ does nothing
        if (!onRemoveWidget || exitTimersRef.current.has(id)) return;
        setExitingIds((prev) => new Set(prev).add(id));
        const timer = window.setTimeout(() => {
            exitTimersRef.current.delete(id);
            setExitingIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            onRemoveWidget(id);
        }, prefersReducedMotion() ? 0 : WIDGET_EXIT_MS);
        exitTimersRef.current.set(id, timer);
    };

    return (
        <div className="p-4">
            <div className="widget-grid-frame">
                {emptyState ?? (
                    <>
                        {toolbar}
                        <div
                            ref={gridRef}
                            className={`widget-grid ${isEditing ? "is-editing" : ""} ${draggingId ? "is-drag-active" : ""}`}
                            style={{"--cols": GRID_COLS} as CSSProperties}
                        >
                            {sortedWidgets.map((w, index) => {
                            const isDragged: boolean = dragDelta !== null && w.id === draggingId;
                            const isExiting: boolean = exitingIds.has(w.id);
                            // The held widget keeps its own cell (its transform is relative to it);
                            // the others take their place in the preview, if there is one
                            const shownWidget: WidgetInstance = draggingId === w.id ? w : (shownLayout?.find((p) => p.id === w.id) ?? w);
                            const enterDelay: number = isSettled ? 0 : Math.min(index * WIDGET_ENTRANCE_STEP_MS, WIDGET_ENTRANCE_MAX_DELAY_MS);
                            return(
                                <WidgetGridCell
                                    key={w.id}
                                    id={w.id}
                                    isAddedNow={isSettled && isEditing}
                                    className={`widget-cell ${isDragged ? "is-dragging" : ""} ${isExiting ? "is-exiting" : ""}`}
                                    style={{
                                        "--col": shownWidget.position.x + 1,
                                        "--row": shownWidget.position.y + 1,
                                        "--w":   w.size.width,
                                        "--h":   w.size.height,
                                        "--enter-delay": `${enterDelay}ms`,
                                        ...(isDragged && { "--dx": `${dragDelta?.x}px`, "--dy": `${dragDelta?.y}px` })
                                    } as CSSProperties}
                                >
                                    <Widget
                                        instance={w}
                                        onRemove={isEditing && !isExiting ? handleRemove : undefined}
                                        onHandlePointerDown={isEditing && !isExiting ? (e) => startDrag(w.id, e) : undefined}
                                    />
                                </WidgetGridCell>
                            )})}
                            {/* Last child: the cells keep their DOM order, so the held handle keeps its pointer capture */}
                            {landing && (
                                <div className="widget-placeholder" aria-hidden="true" style={{
                                        "--col": landing.position.x + 1,
                                        "--row": landing.position.y + 1,
                                        "--w":   landing.size.width,
                                        "--h":   landing.size.height,
                                } as CSSProperties} />
                            )}
                        </div>
                        {footer}
                    </>
                )}
            </div>
        </div>
    );
}
