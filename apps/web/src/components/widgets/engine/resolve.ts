/**
 * Layout resolution while a widget is being moved (cadrage V2 §4).
 *
*/

import { GRID_COLS } from "../widget-grid.constants";
import type { GridPosition, GridRect, WidgetInstance } from "../widgets.types";
import { compactLayout } from "./compact";
import { moveTo, overlaps, sortReadingOrder } from "./geometry";

/**
 * Finds where a pushed widget lands among the already placed ones
 * its own column first, then cascading right, then one row down and again.
 * @param placed widgets already at their final place, never moved
 * @param widget the widget to place, at its current position
 * @returns GridPosition : the first free spot found
 */
export function findPushedSpot(placed: readonly GridRect[], widget: GridRect): GridPosition {
    const width: number = widget.size.width;
    // Keeps the origin column inside the grid, otherwise the inner loop would never run
    const originX: number = Math.min(widget.position.x, GRID_COLS - width);

    // No end condition: under the lowest placed widget everything is free, so it always returns
    for (let y = widget.position.y; ; y++) {
        let x: number = originX;
        while (x + width <= GRID_COLS) {
            const blockers: GridRect[] = placed.filter((r) => overlaps(moveTo(widget, x, y), r));
            if (blockers.length === 0) {return {x, y};}
            x = Math.max(...blockers.map((r) => r.position.x + r.size.width));
        }
    }
}

export function resolveLayout(snapshot: WidgetInstance[], movedId: string, target: GridPosition): WidgetInstance[] {
    const moved = snapshot.find((w) => w.id === movedId) ?? undefined;
    if (moved == undefined) {return snapshot;}
    // delete movedId temporary and compact snapshot
    const removedM: WidgetInstance[] = snapshot.filter((w) => w.id !== movedId);
    const compactedLayout: WidgetInstance[] = sortReadingOrder(compactLayout(removedM));
    const x: number = Math.min(Math.max(target.x, 0), GRID_COLS - moved.size.width);
    const y: number = Math.max(target.y, 0);
    const placed: WidgetInstance[] = [moveTo(moved, x, y)];
    for (const widget of compactedLayout) {
        const pos = findPushedSpot(placed, widget);
        placed.push(moveTo(widget, pos.x, pos.y));
    }
    const newLayout: WidgetInstance[] = compactLayout(placed);
    return newLayout;
}

