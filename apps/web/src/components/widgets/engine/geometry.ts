/**
 * Pure grid geometry: no React, no DOM.
 * Coordinates are in cells, 0-indexed. Inputs are never mutated.
 */

import type { GridPosition, GridRect, GridSize } from "../widgets.types";



/**
 * Tells whether two rects share at least one cell.
 *
 * Intervals are half-open: a rect at `x` with width `w` covers columns `x` to `x + w - 1`.
 * Touching edges (`x 0 w 2` and `x 2 w 2`) or a single shared corner do not overlap.
 * Symmetric: `overlaps(a, b) === overlaps(b, a)`.
 * A rect always overlaps itself: when checking against a list that contains it, exclude it first.
 */
export function overlaps(a: GridRect, b: GridRect) {
    // TODO
} 

/**
 * Tells whether a rect lies within the grid: `x ≥ 0`, `y ≥ 0` and `x + width ≤ GRID_COLS`.
 *
 * There is no bottom limit: the grid grows downward.
 * Does not check the minimum size (see `clampSize`).
 */
export function isInsideGrid(rect: GridRect) {
    // TODO
} 

/**
 * Brings a size back within the allowed bounds.
 *
 * Width is kept between `min.width` and `GRID_COLS`. Height only has a floor (`min.height`), no ceiling.
 * A size is valid when `clampSize` returns the same values.
 * Clamp the size before checking the position: a narrower width changes `x + width`.
 */
export function clampSize(size: GridSize, min: GridSize): GridSize {
    // TODO
} 

/**
 * Returns the first row below every rect, `max(y + height)`, or `0` for an empty list.
 *
 * Every row from this one down is free: it bounds the scan of `findFirstFreeSpot`,
 * and it is where repaired widgets are moved.
 */
export function bottomY(rects: readonly GridRect[]): number {
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
    // TODO
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