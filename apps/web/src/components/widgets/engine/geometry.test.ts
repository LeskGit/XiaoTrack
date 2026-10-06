import { describe, it, expect, expectTypeOf } from 'vitest';
import { bottomY, findFirstFreeSpot, isInsideGrid, overlaps, sortReadingOrder } from './geometry'; 
import type { GridRect } from '../widgets.types'; 

// Helper
const rect = (x: number, y: number, width: number, height: number): GridRect => ({
    position: { x, y },
    size: { width, height },
});

describe('overlaps', () => {
    it.each([
        ['chevauchement partiel',       rect(0, 0, 4, 4), rect(2, 2, 4, 4)],
        ['b englobe a',                 rect(2, 2, 2, 2), rect(0, 0, 10, 10)],
        ['a englobe b',                 rect(0, 0, 10, 10), rect(2, 2, 2, 2)],
        ['rects identiques',            rect(1, 1, 3, 3), rect(1, 1, 3, 3)],
        ['croix (+)',                   rect(2, 0, 2, 6), rect(0, 2, 6, 2)],
    ])('détecte un overlap : %s', (_, a, b) => {
        expect(overlaps(a, b)).toBe(true);
        expect(overlaps(b, a)).toBe(true); 
    });

    it.each([
        ['même colonne, éloignés',      rect(0, 0, 2, 2), rect(0, 10, 2, 2)],
        ['même ligne, éloignés',        rect(0, 0, 2, 2), rect(10, 0, 2, 2)],
        ['totalement séparés',          rect(0, 0, 2, 2), rect(5, 5, 2, 2)],
        ['collés horizontalement',      rect(0, 0, 2, 2), rect(2, 0, 2, 2)],
        ['collés verticalement',        rect(0, 0, 2, 2), rect(0, 2, 2, 2)],
        ['collés par un coin',          rect(0, 0, 2, 2), rect(2, 2, 2, 2)],
        
    ])('pas d\'overlap : %s', (_, a, b) => {
        expect(overlaps(a, b)).toBe(false);
        expect(overlaps(b, a)).toBe(false);
    });
});

describe('isInsideGrid', () => {
    it.each([
        ['Inside the grid', rect(4, 4, 4, 4)],
        ['Inside the grid, but far (height)', rect(2, 100, 2, 2)],
    ])('Is Inside the WidgetGrid %s', (_, a) => {
        expect(isInsideGrid(a)).toBe(true);
    });

    it.each([
        ['Outside cols', rect(13, 0, 10, 10)],
        ['Outside rows', rect(-1, 0, 10, 10)],
        ['Outside cols negative', rect(0, -1, 10, 10)],
    ])('Is Outside the WidgetGrid %s', (_, a) => {
        expect(isInsideGrid(a)).toBe(false);
    });
    
})

describe('bottomY', () => {

    
    // Layouts
    const emptyLayout: GridRect[] = [];
    // One widget
    const singleWidget = [rect(0, 0, 4, 2)];
    // A single full row: 3 widgets of height 1 across the 12 columns
    const singleRow = [rect(0, 0, 4, 1), rect(4, 0, 4, 1), rect(8, 0, 4, 1)];
    // Two rows, every widget has the same height
    const sameHeights = [rect(0, 0, 4, 2), rect(4, 0, 4, 2), rect(0, 2, 4, 2)];
    // Same starting row, different heights: the tallest one sets the result
    const mixedHeights = [rect(0, 0, 4, 1), rect(4, 0, 4, 3), rect(8, 0, 4, 2)];
    // Trap: the widget with the largest y is NOT the one that goes lowest
    const tallestNotLowestY = [rect(0, 0, 4, 6), rect(4, 3, 4, 1)];
    // Trap: the lowest widget comes first in the array (the function must not just read the last one)
    const unsorted = [rect(0, 4, 4, 2), rect(4, 0, 4, 1)];
    // A 4×2 hole between x=4 and x=8 (useful later for findFirstFreeSpot)
    const layoutWithHole = [rect(0, 0, 4, 2), rect(8, 0, 4, 2), rect(0, 2, 12, 1)];

    it.each([
        { name: 'empty grid',                        rects: emptyLayout,       expected: 0 },
        { name: 'single widget',                     rects: singleWidget,      expected: 2 },
        { name: 'single row',                        rects: singleRow,         expected: 1 },
        { name: 'same heights',                      rects: sameHeights,       expected: 4 },
        { name: 'mixed heights',                     rects: mixedHeights,      expected: 3 },
        { name: 'largest y is not the lowest',       rects: tallestNotLowestY, expected: 6 },
        { name: 'lowest widget comes first',         rects: unsorted,          expected: 6 },
        { name: 'a hole does not change the result', rects: layoutWithHole,    expected: 3 },
    ])('$name → $expected', ({ rects, expected }) => {
        expect(bottomY(rects)).toBe(expected);
    });
    
})

describe('findFirstFreeSpot', () => {

    // Layouts
    const emptyLayout: GridRect[] = [];
    // A 4×2 hole between x=4 and x=8, then a full row below it
    const layoutWithHole = [rect(0, 0, 4, 2), rect(8, 0, 4, 2), rect(0, 2, 12, 1)];
    // Same hole, but only 1 row tall
    const shallowHole = [rect(0, 0, 4, 1), rect(8, 0, 4, 1), rect(0, 1, 12, 1)];
    // Row 0 fully used: 3 widgets across the 12 columns
    const fullRow = [rect(0, 0, 4, 1), rect(4, 0, 4, 1), rect(8, 0, 4, 1)];
    // Left half of row 0 used, right half free
    const leftHalf = [rect(0, 0, 6, 1)];
    // Only the last 2 columns of row 0 are free
    const twoColsLeft = [rect(0, 0, 10, 1)];
    // A tall widget on the left leaves space next to it
    const tallLeft = [rect(0, 0, 4, 3)];

    it.each([
        { name: 'empty grid',                           rects: emptyLayout,    size: { width: 2, height: 1 },  expected: { x: 0, y: 0 } },
        { name: 'hole big enough → the hole',           rects: layoutWithHole, size: { width: 4, height: 2 },  expected: { x: 4, y: 0 } },
        { name: 'hole too narrow → skipped',            rects: layoutWithHole, size: { width: 5, height: 1 },  expected: { x: 0, y: 3 } },
        { name: 'full row → below the last row',        rects: fullRow,        size: { width: 2, height: 1 },  expected: { x: 0, y: 1 } },
        { name: 'width 12 on an empty grid → x = 0',    rects: emptyLayout,    size: { width: 12, height: 1 }, expected: { x: 0, y: 0 } },
        { name: 'width 12 with a partial row → x = 0',  rects: leftHalf,       size: { width: 12, height: 1 }, expected: { x: 0, y: 1 } },

        // Traps
        { name: 'hole too short → skipped',             rects: shallowHole,    size: { width: 4, height: 2 },  expected: { x: 0, y: 2 } },
        { name: 'same row first, before the next row',  rects: leftHalf,       size: { width: 6, height: 1 },  expected: { x: 6, y: 0 } },
        { name: 'fits exactly on the right edge',       rects: twoColsLeft,    size: { width: 2, height: 1 },  expected: { x: 10, y: 0 } },
        { name: 'would overflow the right edge',        rects: twoColsLeft,    size: { width: 3, height: 1 },  expected: { x: 0, y: 1 } },
        { name: 'next to a tall widget',                rects: tallLeft,       size: { width: 4, height: 1 },  expected: { x: 4, y: 0 } },
    ])('$name → ($expected.x, $expected.y)', ({ rects, size, expected }) => {
        expect(findFirstFreeSpot(rects, size)).toEqual(expected);
    });
});

describe('sortReadingOrder', () => {

    // Helper: a rect with an id, to track the order
    type TaggedRect = GridRect & { id: string };
    const tagged = (id: string, x: number, y: number, width = 2, height = 1): TaggedRect => ({
        id,
        ...rect(x, y, width, height),
    });
    const ids = (rects: readonly TaggedRect[]): string[] => rects.map((r) => r.id);

    it.each([
        { name: 'empty list',
            rects: [],
            expected: [] },
        { name: 'already sorted',
            rects: [tagged('a', 0, 0), tagged('b', 2, 0), tagged('c', 0, 1)],
            expected: ['a', 'b', 'c'] },
        { name: 'sorted by y',
            rects: [tagged('c', 0, 2), tagged('a', 0, 0), tagged('b', 0, 1)],
            expected: ['a', 'b', 'c'] },
        { name: 'same y → sorted by x',
            rects: [tagged('c', 8, 0), tagged('a', 0, 0), tagged('b', 4, 0)],
            expected: ['a', 'b', 'c'] },
        { name: 'y wins over x',
            rects: [tagged('b', 0, 1), tagged('a', 10, 0)],
            expected: ['a', 'b'] },
        { name: 'uses the top edge, not the bottom',
            rects: [tagged('b', 4, 1, 4, 1), tagged('a', 0, 0, 4, 6)],
            expected: ['a', 'b'] },
        { name: 'stable: same position keeps input order',
            rects: [tagged('first', 0, 0), tagged('second', 0, 0)],
            expected: ['first', 'second'] },
        { name: 'stable: same position, reversed input',
            rects: [tagged('second', 0, 0), tagged('first', 0, 0)],
            expected: ['second', 'first'] },
    ])('$name', ({ rects, expected }) => {
        expect(ids(sortReadingOrder(rects))).toEqual(expected);
    });

    it('does not mutate the input', () => {
        const rects = [tagged('b', 0, 1), tagged('a', 0, 0)];
        sortReadingOrder(rects);
        expect(ids(rects)).toEqual(['b', 'a']);
    });

    it('returns a new array', () => {
        const rects = [tagged('a', 0, 0)];
        expect(sortReadingOrder(rects)).not.toBe(rects);
    });

    it('keeps the same objects, with their extra fields', () => {
        const a = tagged('a', 0, 0);
        const b = tagged('b', 0, 1);
        const sorted = sortReadingOrder([b, a]);
        expect(sorted[0]).toBe(a);
        expect(sorted[1]).toBe(b);
    });

    it('keeps the element type (generic)', () => {
        const sorted = sortReadingOrder([tagged('a', 0, 0)]);
        expectTypeOf(sorted).toEqualTypeOf<TaggedRect[]>();
    });
});