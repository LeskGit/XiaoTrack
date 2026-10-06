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

    return (aInterval.xStart < bInterval.xEnd && bInterval.xStart < aInterval.xEnd
        && aInterval.yStart < bInterval.yEnd && bInterval.yStart < aInterval.yEnd)  
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

export function findFirstFreeSpot(rects: readonly GridRect[], size: GridSize): GridPosition {
    const lastRange: number = bottomY(rects);
    const fallbackPosition: GridPosition = {x: 0, y: lastRange};

    for (let y = 0; y <= lastRange; y++) {
        for (let x = 0; x <= GRID_COLS - size.width; x++) {
            const candidateRect: GridRect = {position: {x, y}, size};
            if (rects.every((r) => !overlaps(candidateRect, r))) {return candidateRect.position;}
        }
    }
    return fallbackPosition;
}


export function sortReadingOrder<T extends GridRect>(rects: readonly T[]): T[] {
    const sortedList: T[] = rects.toSorted((w1, w2) => w1.position.y - w2.position.y || w1.position.x - w2.position.x);
    return sortedList;
} 