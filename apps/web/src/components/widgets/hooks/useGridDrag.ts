import { useEffect, useRef, useState, type RefObject } from "react"
import type { GridPosition, WidgetInstance } from "../widgets.types";
import { DRAG_DWELL_MS, GRID_COLS } from "../widget-grid.constants";
import { pointToCell } from "../engine/pointer";
import { resolveLayout } from "../engine/resolve";

export type  UseGridDragOptions = {
    readonly gridRef: RefObject<HTMLDivElement | null>;
    readonly widgets: WidgetInstance[];
    readonly onDrop: (layout: WidgetInstance[]) => void;
}

export type UseGridDragResult = {
    readonly draggingId: string | null;
    readonly dragDelta: {x: number, y: number} | null;
    readonly previewLayout: WidgetInstance[] | null;
    readonly shownLayout: WidgetInstance[] | null;
    readonly startDrag: (id: string, event: React.PointerEvent<HTMLDivElement>) => void;
}

export const useGridDrag = ({gridRef, widgets, onDrop}: UseGridDragOptions): UseGridDragResult  => {
    const [draggingId, setDraggingId] = useState<string|null>(null)
    const [dragDelta, setDragDelta] = useState<{x: number, y: number} | null>(null);
    const [previewLayout, setPreviewLayout] = useState<WidgetInstance[] | null>(null);
    const [shownLayout, setShownLayout] = useState<WidgetInstance[] | null>(null);

    // Ends the gesture in progress without writing anything
    const cleanupRef = useRef<(() => void) | null>(null);

    // Unmount in the middle of a gesture (e.g. navigation): remove the listeners left behind
    useEffect(() => {
        return () => cleanupRef.current?.();
    }, []);

    const startDrag = (id: string, event: React.PointerEvent<HTMLDivElement>) => {
        // A gesture is already running (second finger on another handle): ignore this one
        if (cleanupRef.current) return;

        const moved = widgets.find((w) => w.id === id);
        const handle = event.currentTarget;
        const cell = handle.closest(".widget-cell");
        if (!moved || !cell) return;

        const snapshot = widgets;

        const cellRect = cell.getBoundingClientRect();
        const grabOffset = {x: event.clientX - cellRect.left, y: event.clientY - cellRect.top};

        let targetCell: GridPosition | null = null;
        let dwellTimer: number | undefined;

        const onMove = (e: globalThis.PointerEvent) => {
            // If another pointer on a touch screen : not the same that started the gesture, return
            const grid = gridRef.current;
            if (e.pointerId !== event.pointerId || !grid) return;
            setDragDelta({x: e.clientX - event.clientX, y: e.clientY - event.clientY});

            // Measured at every move: the page may have scrolled or been resized
            const rect = grid.getBoundingClientRect();
            const style = getComputedStyle(grid);
            const columnGap = Number.parseFloat(style.columnGap);
            const rowGap = Number.parseFloat(style.rowGap);
            const rowHeight = Number.parseFloat(style.gridAutoRows);

            // One column + one gap, and one row + one gap, in pixels
            const stepX = (rect.width + columnGap) / GRID_COLS;
            const stepY = rowHeight + rowGap;

            const nextCell = pointToCell({
                pointer: { x: e.clientX, y: e.clientY },
                grabOffset,
                gridRect: rect,
                stepX,
                stepY,
                size: moved.size,
            });

            if (nextCell.x === targetCell?.x && nextCell.y === targetCell?.y) return
            targetCell = nextCell;
            const resolvedLayout: WidgetInstance[] = resolveLayout(snapshot, id, nextCell);
            // The dashed landing cell follows the target right away
            setPreviewLayout(resolvedLayout);
            // The neighbours move only once the pointer has stayed DRAG_DWELL_MS on the same cell
            // (cadrage V2 §3.3). Each new cell restarts the wait.
            window.clearTimeout(dwellTimer);
            dwellTimer = window.setTimeout(() => {
                setShownLayout(resolvedLayout);
            }, DRAG_DWELL_MS);
        }

        // The only way out of a gesture: every exit (drop, Escape, cancel, unmount) goes through here
        const cleanup = () => {
            handle.removeEventListener("pointermove", onMove);
            handle.removeEventListener("pointerup", onUp);
            handle.removeEventListener("pointercancel", onCancel);
            window.removeEventListener("keydown", onKeyDown);
            // After Escape the button is still pressed: give the pointer back to the page
            if (handle.hasPointerCapture(event.pointerId)) {
                handle.releasePointerCapture(event.pointerId);
            }
            window.clearTimeout(dwellTimer);
            setDraggingId(null);
            setDragDelta(null);
            setPreviewLayout(null);
            setShownLayout(null);
            cleanupRef.current = null;
        };

        // The system interrupted the gesture (incoming call, OS gesture on a tablet): nothing is written
        const onCancel = (e: globalThis.PointerEvent) => {
            if (e.pointerId !== event.pointerId) return;
            cleanup();
        };

        // Escape: the widget goes back to its place, the draft is untouched
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            e.preventDefault();
            cleanup();
        };

        const onUp = (e: globalThis.PointerEvent) => {
            if (e.pointerId !== event.pointerId) return;

            // Stop listening first: nothing may change targetCell from now on
            cleanup();

            // Simple click, no movement: nothing to write
            if (!targetCell) return;

            // Moved a few pixels but back on the starting cell: nothing to write
            const { x, y } = moved.position;
            if (targetCell.x === x && targetCell.y === y) return;

            onDrop(resolveLayout(snapshot, id, targetCell));
        };

        handle.setPointerCapture(event.pointerId);
        handle.addEventListener("pointermove", onMove);
        handle.addEventListener("pointerup", onUp);
        handle.addEventListener("pointercancel", onCancel);
        // On window: the keyboard is not tied to the handle, nor to the pointer capture
        window.addEventListener("keydown", onKeyDown);
        cleanupRef.current = cleanup;
        setDraggingId(id);
    }

    return { draggingId, dragDelta, previewLayout, shownLayout, startDrag };
}