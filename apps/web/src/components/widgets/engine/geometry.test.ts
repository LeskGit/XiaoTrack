import { describe, it, expect } from 'vitest';
import { bottomY, isInsideGrid, overlaps } from './geometry'; 
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
        ['collés horizontalement',      rect(0, 0, 2, 2), rect(2, 0, 2, 2)],
        ['collés verticalement',        rect(0, 0, 2, 2), rect(0, 2, 2, 2)],
        ['collés par un coin',          rect(0, 0, 2, 2), rect(2, 2, 2, 2)],
    ])('détecte un overlap : %s', (_, a, b) => {
        expect(overlaps(a, b)).toBe(true);
        expect(overlaps(b, a)).toBe(true); 
    });

    it.each([
        ['même colonne, éloignés',      rect(0, 0, 2, 2), rect(0, 10, 2, 2)],
        ['même ligne, éloignés',        rect(0, 0, 2, 2), rect(10, 0, 2, 2)],
        ['totalement séparés',          rect(0, 0, 2, 2), rect(5, 5, 2, 2)],
        
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
