/**
 * Pure grid geometry: no React, no DOM.
 * Coordinates are in cells, 0-indexed. Inputs are never mutated.
 */

import { GRID_COLS } from "../widget-grid.constants";
import type { GridPosition, GridRect, GridSize } from "../widgets.types";

type GridInterval = {
    xStart: number;
    xEnd: number;
    yStart: number;
    yEnd: number;
}

/**
 * Check if two rects overlaps (border overlaps too)
 * @param a GridRect
 * @param b GridRect
 * @returns boolean : if True, an overlap exists and WidgetGrid have to adjust the second rect   
 */
export function overlaps(a: GridRect, b: GridRect): boolean {
    const aInterval: GridInterval = {xStart: a.position.x, xEnd: a.position.x + a.size.width, yStart: a.position.y, yEnd: a.position.y + a.size.height};
    const bInterval: GridInterval = {xStart: b.position.x, xEnd: b.position.x + b.size.width, yStart: b.position.y, yEnd: b.position.y + b.size.height};

    return (aInterval.xStart <= bInterval.xEnd && bInterval.xStart <= aInterval.xEnd
        && aInterval.yStart <= bInterval.yEnd && bInterval.yStart <= aInterval.yEnd)  
} 

/**
 * Check if the rect is inside the grid's range, no need to handle height max because it is unlimited
 * @param rect 
 * @returns boolean
 */
export function isInsideGrid(rect: GridRect): boolean {
    const rectInterval: GridInterval = {xStart: rect.position.x, xEnd: rect.position.x + rect.size.width, yStart: rect.position.y, yEnd: rect.position.y + rect.size.height};
    return (rectInterval.xStart >= 0 && rectInterval.xEnd <= GRID_COLS && rectInterval.yStart >= 0)
} 

/**
 * Returns the first row below every rect, `max(y + height)`, or `0` for an empty list.
 * @param rects 
 * @returns number : indice of the last used row 
 */
export function bottomY(rects: readonly GridRect[]): number {
    return Math.max(0, ...rects.map((r) => r.position.y + r.size.height))
} 

export function buildReferenceGrid(rects: readonly GridRect[]): number[][] {
    // TODO
}

/**
 * Returns the first position where a rect of `size` fits without overlapping any of `rects`.
 *
 * Scans rows top to bottom, then columns left to right (reading order), so holes are filled first.
 * If nothing fits higher up, the row `bottomY(rects)` is always free: adding never fails.
 *
 * Precondition: `size` is already clamped (`size.width ≤ GRID_COLS`).
 * Otherwise no column fits, and the widget would overflow the grid.
 */
export function findFirstFreeSpot(rects: readonly GridRect[], size: GridSize): GridPosition {
    for (let i = 0; i < GRID_COLS; i++) {
        for (let j = 0; j <= bottomY(rects); j++) {
            if (rects[i][j].)
        }
    }
} 

/**
 * Returns a copy sorted in reading order: by `y`, then by `x`.
 *
 * Drives the stacking order in phone mode, where positions are ignored.
 * Generic so that sorting `WidgetInstance[]` keeps `id` and `type` in the result type.
 * Stable: two rects at the same position keep their original order.
 */
export function sortReadingOrder<T extends GridRect>(rects: readonly T[]): T[] {
    // TODO
} 

/**
 * Turns already-parsed storage data into a valid layout (cadrage §6.3, schema E of the plan).
 *
 * - Not an array: `[]`.
 * - Unreadable item (no string `id`, coordinates that are not numbers) or unknown `type`: dropped, with a warning.
 * - Invalid geometry (outside the columns, negative, below the minimum size): size clamped, then moved to the end of the grid.
 * - Overlap: the second one in reading order is moved to the end of the grid.
 *
 * Valid items are placed first. Items to repair follow in their original order,
 * each one at `y = bottomY` of everything placed before it. Same input, same output.
 * `JSON.parse` and saving belong to the storage layer: the repair is not saved until the user saves.
 */
export function repairLayout(raw: unknown) {
    // TODO
} 