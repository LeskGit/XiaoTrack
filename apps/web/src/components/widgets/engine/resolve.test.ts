import { describe, expect, it } from 'vitest';
import { findPushedSpot, resolveLayout } from './resolve';
import { isInsideGrid, overlaps, sortReadingOrder } from './geometry';
import type { GridRect, WidgetInstance } from '../widgets.types';

// Helpers
const rect = (x: number, y: number, width: number, height: number): GridRect => ({
    position: { x, y },
    size: { width, height },
});
// resolveLayout never reads the type, any catalog key works. Full width by default.
const w = (id: string, x: number, y: number, width = 12, height = 1): WidgetInstance => ({
    id,
    type: 'nutrition.dailyKcal',
    size: { width, height },
    position: { x, y },
});
const positionOf = (layout: readonly WidgetInstance[], id: string) =>
    layout.find((widget) => widget.id === id)?.position;
const readingOrder = (layout: readonly WidgetInstance[]) =>
    sortReadingOrder(layout).map((widget) => widget.id);

// Checks the three grid rules of the cadrage V2
const expectValidLayout = (layout: readonly WidgetInstance[]) => {
    layout.forEach((a, i) => {
        expect(isInsideGrid(a)).toBe(true);
        layout.slice(i + 1).forEach((b) => expect(overlaps(a, b)).toBe(false));
        // No vertical hole: either on the top row, or something right above blocks it
        if (a.position.y > 0) {
            const oneUp = { ...a, position: { x: a.position.x, y: a.position.y - 1 } };
            expect(layout.some((b) => b !== a && overlaps(oneUp, b))).toBe(true);
        }
    });
};

describe('findPushedSpot', () => {
    it('no overlap → position unchanged', () => {
        //      x0          x6
        // y0   M  M  M  ·  W  W
        expect(findPushedSpot([rect(0, 0, 6, 1)], rect(8, 0, 2, 1))).toEqual({ x: 8, y: 0 });
    });

    it('overlap, free space right after → moved right, same y', () => {
        // W (4 wide) at x0 overlaps M (x0..6) → x6, and 6 + 4 ≤ 12
        expect(findPushedSpot([rect(0, 0, 6, 1)], rect(0, 0, 4, 1))).toEqual({ x: 6, y: 0 });
    });

    it('another widget on the right but room further → cascades right', () => {
        // M at x0..6, P at x6..9, W (2 wide): x6 is taken by P → x9, and 9 + 2 ≤ 12
        const placed = [rect(0, 0, 6, 1), rect(6, 0, 3, 1)];
        expect(findPushedSpot(placed, rect(0, 0, 2, 1))).toEqual({ x: 9, y: 0 });
    });

    it('no room on the right (would exceed 12) → moved down', () => {
        // M at x0..10, W (4 wide): x10 + 4 = 14 > 12 → under M, back to x0
        expect(findPushedSpot([rect(0, 0, 10, 1)], rect(0, 0, 4, 1))).toEqual({ x: 0, y: 1 });
    });

    it('full width widget → always moved down', () => {
        expect(findPushedSpot([rect(0, 0, 4, 1)], rect(0, 0, 12, 2))).toEqual({ x: 0, y: 1 });
    });

    it('moved down under a tall blocker', () => {
        // M is 3 rows tall: W must go under it, at y3
        expect(findPushedSpot([rect(0, 0, 12, 3)], rect(0, 1, 4, 1))).toEqual({ x: 0, y: 3 });
    });

    it('after moving down, its own column is tried before the right', () => {
        // M at x2..10, N at x10..12. W (2 wide) at x2:
        // x10 (N) → x12 (too far) → down to y1, back to x2, which is free there
        const placed = [rect(2, 0, 8, 1), rect(10, 0, 2, 1)];
        expect(findPushedSpot(placed, rect(2, 0, 2, 1))).toEqual({ x: 2, y: 1 });
    });

    it('several overlapped widgets → uses the rightmost edge', () => {
        // W (x2..5) overlaps A (x0..3) and B (x3..7) at once → x7
        const placed = [rect(0, 0, 3, 1), rect(3, 0, 4, 2)];
        expect(findPushedSpot(placed, rect(2, 0, 3, 1))).toEqual({ x: 7, y: 0 });
    });

    it('result never overlaps a placed widget and stays inside the grid', () => {
        const placed = [rect(0, 0, 5, 2), rect(5, 0, 4, 1), rect(9, 0, 3, 3), rect(5, 1, 2, 2)];
        for (const width of [2, 3, 4, 6, 12]) {
            const position = findPushedSpot(placed, rect(0, 0, width, 1));
            const result = rect(position.x, position.y, width, 1);
            expect(isInsideGrid(result)).toBe(true);
            expect(placed.every((other) => !overlaps(result, other))).toBe(true);
        }
    });

    it('does not mutate its inputs', () => {
        const placed = [rect(0, 0, 6, 1)];
        const widget = rect(0, 0, 4, 1);
        const copies = structuredClone({ placed, widget });
        findPushedSpot(placed, widget);
        expect({ placed, widget }).toEqual(copies);
    });
});

describe('resolveLayout', () => {
    // A, B, C: full width widgets stacked in a column
    const column = [w('A', 0, 0), w('B', 0, 1), w('C', 0, 2)];

    describe('reference examples (cadrage V2 §4.2)', () => {
        it.each([
            { name: 'A to y1 → B, A, C',             moved: 'A', target: { x: 0, y: 1 }, expected: ['B', 'A', 'C'] },
            { name: 'A to y2 → B, C, A',             moved: 'A', target: { x: 0, y: 2 }, expected: ['B', 'C', 'A'] },
            { name: 'C to y0 → C, A, B',             moved: 'C', target: { x: 0, y: 0 }, expected: ['C', 'A', 'B'] },
            { name: 'A to y0 (same place) → A, B, C', moved: 'A', target: { x: 0, y: 0 }, expected: ['A', 'B', 'C'] },
        ])('$name', ({ moved, target, expected }) => {
            const result = resolveLayout(column, moved, target);
            expect(readingOrder(result)).toEqual(expected);
            expectValidLayout(result);
        });

        it('A, B: A to y5 (empty space) → B, A, A moves up under B', () => {
            const result = resolveLayout([w('A', 0, 0), w('B', 0, 1)], 'A', { x: 0, y: 5 });
            expect(positionOf(result, 'B')).toEqual({ x: 0, y: 0 });
            expect(positionOf(result, 'A')).toEqual({ x: 0, y: 1 });
        });
    });

    it('column freed by the moved widget → pushed widget goes right', () => {
        //      x0   x6                        x0   x6
        // y0   A    D                    y0   A    B
        // y1   B    D     D onto B  →    y1   D    ·
        // y2   ·    D                    y2   D
        //                                y3   D
        const snapshot = [w('A', 0, 0, 6, 1), w('B', 0, 1, 6, 1), w('D', 6, 0, 6, 3)];
        const result = resolveLayout(snapshot, 'D', { x: 0, y: 1 });
        expect(positionOf(result, 'A')).toEqual({ x: 0, y: 0 });
        expect(positionOf(result, 'D')).toEqual({ x: 0, y: 1 });
        expect(positionOf(result, 'B')).toEqual({ x: 6, y: 0 });
        expectValidLayout(result);
    });

    it('known limit: A dropped on B side by side → A old place stays empty', () => {
        //      x0   x6                        x0   x6
        // y0   A    B                    y0   ·    A
        // y1   C  C  C    A onto B  →    y1   ·    B
        //                                y2   C  C  C
        const snapshot = [w('A', 0, 0, 6, 1), w('B', 6, 0, 6, 1), w('C', 0, 1, 12, 1)];
        const result = resolveLayout(snapshot, 'A', { x: 6, y: 0 });
        expect(positionOf(result, 'A')).toEqual({ x: 6, y: 0 });
        expect(positionOf(result, 'B')).toEqual({ x: 6, y: 1 });
        expect(positionOf(result, 'C')).toEqual({ x: 0, y: 2 });
        expect(result.some((widget) => overlaps(widget, rect(0, 0, 1, 1)))).toBe(false);
        expectValidLayout(result);
    });

    it('target out of bounds → clamped to the grid', () => {
        const result = resolveLayout([w('A', 0, 0, 4, 1)], 'A', { x: 20, y: -3 });
        expect(positionOf(result, 'A')).toEqual({ x: 8, y: 0 });
    });

    it('unknown movedId → snapshot returned unchanged', () => {
        expect(resolveLayout(column, 'nope', { x: 0, y: 2 })).toEqual(column);
    });

    it('same widgets in, same widgets out (nothing lost, nothing added)', () => {
        const result = resolveLayout(column, 'A', { x: 0, y: 2 });
        expect(result.map((widget) => widget.id).sort()).toEqual(['A', 'B', 'C']);
    });

    it('sizes never change', () => {
        const snapshot = [w('A', 0, 0, 6, 2), w('B', 6, 0, 3, 1), w('C', 0, 2, 12, 1)];
        const result = resolveLayout(snapshot, 'C', { x: 3, y: 0 });
        for (const original of snapshot) {
            expect(result.find((widget) => widget.id === original.id)?.size).toEqual(original.size);
        }
    });

    it('no overlap and no vertical hole, whatever the target', () => {
        const snapshot = [
            w('A', 0, 0, 4, 2), w('B', 4, 0, 4, 1), w('C', 8, 0, 4, 3),
            w('D', 4, 1, 2, 2), w('E', 0, 3, 12, 1),
        ];
        for (const target of [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 6, y: 1 }, { x: 2, y: 2 }, { x: 0, y: 6 }]) {
            expectValidLayout(resolveLayout(snapshot, 'B', target));
        }
    });

    it('deterministic: same input → same output', () => {
        expect(resolveLayout(column, 'A', { x: 0, y: 1 })).toEqual(resolveLayout(column, 'A', { x: 0, y: 1 }));
    });

    it('does not mutate the snapshot', () => {
        const copy = structuredClone(column);
        resolveLayout(column, 'A', { x: 0, y: 2 });
        expect(column).toEqual(copy);
    });
});
