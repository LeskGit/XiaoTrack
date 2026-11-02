import { describe, expect, it } from 'vitest';
import { pointToCell, type PointToCellInput } from './pointer';

// A grid at (100, 50) in the viewport, 100px per column step, 90px per row step.
// Widget 4×1, grabbed 30px right and 10px below its top-left corner.
const base: PointToCellInput = {
    pointer: { x: 0, y: 0 },
    grabOffset: { x: 30, y: 10 },
    gridRect: { left: 100, top: 50 },
    stepX: 100,
    stepY: 90,
    size: { width: 4, height: 1 },
};
const at = (x: number, y: number, overrides: Partial<PointToCellInput> = {}): PointToCellInput => ({
    ...base,
    ...overrides,
    pointer: { x, y },
});

describe('pointToCell', () => {
    it('corner exactly on a cell → that cell', () => {
        // corner (400, 230) → relative (300, 180) → (3, 2)
        expect(pointToCell(at(430, 240))).toEqual({ x: 3, y: 2 });
    });

    it('just before half a cell → same cell', () => {
        // relative x 345 → 3.45 → 3
        expect(pointToCell(at(475, 240))).toEqual({ x: 3, y: 2 });
    });

    it('just after half a cell → next cell', () => {
        // relative x 355 → 3.55 → 4
        expect(pointToCell(at(485, 240))).toEqual({ x: 4, y: 2 });
    });

    it('pointer left of the grid → x 0', () => {
        // relative x -80 → -0.8 → -1 → clamped to 0
        expect(pointToCell(at(50, 240))).toEqual({ x: 0, y: 2 });
    });

    it('wide widget near the right edge → x = 12 − w', () => {
        // 8 wide: relative x 1270 → 12.7 → 13 → clamped to 12 − 8 = 4
        expect(pointToCell(at(1400, 240, { size: { width: 8, height: 1 } }))).toEqual({ x: 4, y: 2 });
    });

    it('pointer above the grid → y 0', () => {
        // relative y -60 → -0.67 → -1 → clamped to 0
        expect(pointToCell(at(430, 0))).toEqual({ x: 3, y: 0 });
    });

    it('grid shifted in the page (scroll) → same cell', () => {
        // The page scrolled 300px down: the grid AND the pointer move up by 300px
        const scrolled = at(430, 240 - 300, { gridRect: { left: 100, top: 50 - 300 } });
        expect(pointToCell(scrolled)).toEqual({ x: 3, y: 2 });
    });
});
