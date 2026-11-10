import { useState, type RefObject } from "react"
import type { GridPosition, WidgetInstance } from "../widgets.types";
import { GRID_COLS } from "../widget-grid.constants";
import { pointToCell } from "../engine/pointer";
import { resolveLayout } from "../engine/resolve";

export type  UseGridDragOptions = {
    readonly gridRef: RefObject<HTMLDivElement | null>;
    readonly widgets: WidgetInstance[];
    readonly onDrop: (layout: WidgetInstance[]) => void;
}

export type UseGridDragResult = {
    readonly draggingId: string | null;
    readonly startDrag: (id: string, event: React.PointerEvent<HTMLDivElement>) => void;
}

export const useGridDrag = ({gridRef, widgets, onDrop}: UseGridDragOptions): UseGridDragResult  => {
    const [draggingId, setDraggingId] = useState<string|null>(null)

    const startDrag = (id: string, event: React.PointerEvent<HTMLDivElement>) => {
        console.log(event);
        const moved = widgets.find((w) => w.id === id);
        const handle = event.currentTarget;
        const cell = handle.closest(".widget-cell");
        if (!moved || !cell) return;

        const snapshot = widgets;

        const cellRect = cell.getBoundingClientRect();
        console.log(cellRect);
        const grabOffset = {x: event.clientX - cellRect.left, y: event.clientY - cellRect.top};
        console.log(grabOffset);

        let targetCell: GridPosition | null = null;

        const onMove = (e: globalThis.PointerEvent) => {
            // If another pointer on a touch screen : not the same that started the gesture, return
            const grid = gridRef.current;
            if (e.pointerId !== event.pointerId || !grid) return;

            // Measured at every move: the page may have scrolled or been resized
            const rect = grid.getBoundingClientRect();
            const style = getComputedStyle(grid);
            const columnGap = parseFloat(style.columnGap);
            const rowGap = parseFloat(style.rowGap);
            const rowHeight = parseFloat(style.gridAutoRows);

            // One column + one gap, and one row + one gap, in pixels
            const stepX = (rect.width + columnGap) / GRID_COLS;
            const stepY = rowHeight + rowGap;

            targetCell = pointToCell({
                pointer: { x: e.clientX, y: e.clientY },
                grabOffset,
                gridRect: rect,
                stepX,
                stepY,
                size: moved.size,
            });
        }

        const onUp = (e: globalThis.PointerEvent) => {
            if (e.pointerId !== event.pointerId) return;

            // Stop listening first: nothing may change targetCell from now on
            handle.removeEventListener("pointermove", onMove);
            handle.removeEventListener("pointerup", onUp);
            setDraggingId(null);

            // Simple click, no movement: nothing to write
            if (!targetCell) return;

            // Moved a few pixels but back on the starting cell: nothing to write
            const { x, y } = moved.position;
            console.log(targetCell.x);
            console.log(targetCell.y);
            if (targetCell.x === x && targetCell.y === y) return;

            onDrop(resolveLayout(snapshot, id, targetCell));
        };

        handle.setPointerCapture(event.pointerId);
        handle.addEventListener("pointermove", onMove);
        handle.addEventListener("pointerup", onUp);
        setDraggingId(id);
    }

    return { draggingId, startDrag };
}