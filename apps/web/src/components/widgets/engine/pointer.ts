/**
 * Pixels → grid cell conversion while dragging (cadrage V2 §3.2).
 * Pure: the DOM measurement happens in the hook, not here.
 */

import { GRID_COLS } from "../widget-grid.constants";
import type { GridPosition, GridSize } from "../widgets.types";

type Point = {
    readonly x: number;
    readonly y: number;
};

export type PointToCellInput = {
    // Pointer position in the viewport (clientX / clientY)
    readonly pointer: Point;
    // Distance between the pointer and the widget's top-left corner, taken at pointerdown
    readonly grabOffset: Point;
    // Only what the computation reads from getBoundingClientRect() of .widget-grid
    readonly gridRect: { readonly left: number; readonly top: number };
    // One column + one gap, and one row + one gap, in pixels
    readonly stepX: number;
    readonly stepY: number;
    readonly size: GridSize;
};

/**
 * Returns the cell aimed by the widget's top-left corner:
 * round to the nearest cell, then clamp to 0 ≤ x ≤ 12 − w and y ≥ 0.
 * @param input
 * @returns GridPosition
 */
export function pointToCell({pointer, grabOffset, gridRect, stepX, stepY, size}: PointToCellInput): GridPosition {
    // 1. Where the widget's top-left corner would be, in the viewport
    const cornerX: number = pointer.x - grabOffset.x;
    const cornerY: number = pointer.y - grabOffset.y;

    // 2. The same corner, measured from the grid's top-left corner
    const relativeX: number = cornerX - gridRect.left;
    const relativeY: number = cornerY - gridRect.top;

    // 3. Pixels → cells, rounded to the nearest one (switches cell past the half)
    const col: number = Math.round(relativeX / stepX);
    const row: number = Math.round(relativeY / stepY);

    // 4. Inside the grid. Math.max also turns a -0 from Math.round into 0
    return {
        x: Math.min(Math.max(col, 0), GRID_COLS - size.width),
        y: Math.max(row, 0),
    };
}
