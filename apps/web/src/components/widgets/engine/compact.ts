/**
 * Vertical compaction: every widget moves up until it touches another one
 * or the top of the grid (cadrage V2 §5).
 */

import type { WidgetInstance } from "../widgets.types";
import { overlaps, sortReadingOrder } from "./geometry";


/**
 * Vertical compaction: every widget moves up until it touches another one
 * or the top of the grid.
 * Precondition: no overlap in the input.
 * @returns the same widgets, in input order
 */
export function compactLayout(layout: readonly WidgetInstance[]): WidgetInstance[] {
    const placed: WidgetInstance[] = [];
    const compacted = new Map<string, WidgetInstance>();

    for (const widget of sortReadingOrder(layout)) {
        let y = widget.position.y;
        while (y > 0) {
            const candidate: WidgetInstance = { ...widget, position: { x: widget.position.x, y: y - 1 } };
            if (placed.some((other) => overlaps(candidate, other))) break;
            y = y - 1;
        }
        const result: WidgetInstance = y === widget.position.y
            ? widget
            : { ...widget, position: { x: widget.position.x, y } };
        placed.push(result);
        compacted.set(widget.id, result);
    }

    return layout.map((widget) => compacted.get(widget.id) ?? widget);
}