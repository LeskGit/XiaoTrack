import { describe, expect, it } from 'vitest';
import { compactLayout } from './compact';
import { overlaps } from './geometry';
import type { WidgetInstance } from '../widgets.types';

// Helper: compactLayout never reads the type, any catalog key works
const w = (id: string, x: number, y: number, width = 12, height = 1): WidgetInstance => ({
    id,
    type: 'nutrition.dailyKcal',
    size: { width, height },
    position: { x, y },
});
const yOf = (layout: readonly WidgetInstance[], id: string) =>
    layout.find((widget) => widget.id === id)?.position.y;

// A messy layout reused by the property tests:
//      x0        x6
// y0   ·         B (tall)
// y1   A         B
// y2   ·         B
// y3   ·         ·
// y4   C C C C C C C C C C C C
const messy = [w('A', 0, 1, 6, 1), w('B', 6, 0, 6, 3), w('C', 0, 4, 12, 1)];

describe('compactLayout', () => {
    it('empty grid → []', () => {
        expect(compactLayout([])).toEqual([]);
    });

    it('single widget at y 5 → moved up to y 0', () => {
        expect(compactLayout([w('A', 0, 5)])).toEqual([w('A', 0, 0)]);
    });

    it('hole in a column → closed', () => {
        const result = compactLayout([w('A', 0, 0), w('C', 0, 2)]);
        expect(yOf(result, 'C')).toBe(1);
    });

    it('widget already touching the one above → unchanged', () => {
        const layout = [w('A', 0, 0), w('B', 0, 1)];
        expect(compactLayout(layout)).toEqual(layout);
    });

    it('two independent columns → each one compacted on its own', () => {
        //      x0   x6               x0   x6
        // y0   A    ·           y0   A    B
        // y1   ·    ·     →     y1   C    ·
        // y2   C    B
        const result = compactLayout([w('A', 0, 0, 6), w('C', 0, 2, 6), w('B', 6, 2, 6)]);
        expect(yOf(result, 'A')).toBe(0);
        expect(yOf(result, 'C')).toBe(1);
        expect(yOf(result, 'B')).toBe(0);
    });

    it('wide widget under two widgets of different heights → stops under the lowest one', () => {
        //      x0   x6
        // y0   A    B
        // y1   ·    B          C must stop at y 2, under B, even though column 0 is free at y 1
        // y2   ·    ·
        // y3   C  C  C
        const result = compactLayout([w('A', 0, 0, 6, 1), w('B', 6, 0, 6, 2), w('C', 0, 3, 12, 1)]);
        expect(yOf(result, 'C')).toBe(2);
    });

    it('small widget next to a tall one, nothing above → moved up to y 0', () => {
        const result = compactLayout([w('T', 0, 0, 6, 4), w('S', 6, 3, 6, 1)]);
        expect(yOf(result, 'S')).toBe(0);
    });

    it('unsorted input → same result as sorted input, in input order', () => {
        // C comes first in the array but sits below A: it must not go through A
        const result = compactLayout([w('C', 0, 2), w('A', 0, 0)]);
        expect(result).toEqual([w('C', 0, 1), w('A', 0, 0)]);
    });

    it('x and size never change', () => {
        const result = compactLayout(messy);
        for (const original of messy) {
            const moved = result.find((widget) => widget.id === original.id);
            expect(moved?.position.x).toBe(original.position.x);
            expect(moved?.size).toEqual(original.size);
        }
    });

    it('no overlap and no widget lost', () => {
        const result = compactLayout(messy);
        expect(result).toHaveLength(messy.length);
        result.forEach((a, i) => {
            result.slice(i + 1).forEach((b) => expect(overlaps(a, b)).toBe(false));
        });
    });

    it('messy layout → expected positions', () => {
        // A goes to y 0, B is already at y 0, C stops under B (y 3)
        const result = compactLayout(messy);
        expect(result.map((widget) => [widget.id, widget.position.y])).toEqual([['A', 0], ['B', 0], ['C', 3]]);
    });

    it('idempotent: compacting twice gives the same result', () => {
        const once = compactLayout(messy);
        expect(compactLayout(once)).toEqual(once);
    });

    it('already compact layout → returned unchanged', () => {
        const layout = [w('A', 0, 0, 6, 2), w('B', 6, 0, 6, 1), w('C', 6, 1, 6, 1), w('D', 0, 2, 12, 1)];
        expect(compactLayout(layout)).toEqual(layout);
    });

    it('does not mutate the input', () => {
        const input = [w('A', 0, 3), w('B', 0, 6)];
        const copy = structuredClone(input);
        compactLayout(input);
        expect(input).toEqual(copy);
    });
});
