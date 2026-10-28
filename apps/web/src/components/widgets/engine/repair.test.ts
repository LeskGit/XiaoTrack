import { beforeEach, describe, expect, it, vi } from 'vitest';
import { repairLayout } from './repair';
import type { WidgetInstance } from '../widgets.types';

// Helpers: a stat widget (min 2×1) and a chart widget (min 3×2)
const stat = (id: string, x: number, y: number, width = 2, height = 1): WidgetInstance => ({
    id,
    type: 'nutrition.dailyKcal',
    size: { width, height },
    position: { x, y },
});
const chart = (id: string, x: number, y: number, width = 4, height = 3): WidgetInstance => ({
    id,
    type: 'chartExemple',
    size: { width, height },
    position: { x, y },
});
const positionOf = (layout: readonly WidgetInstance[], id: string) =>
    layout.find((w) => w.id === id)?.position;

describe('repairLayout', () => {
    // Silence the expected warnings, and let tests check them
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    describe('not an array → []', () => {
        it.each([
            { name: 'null',      raw: null },
            { name: 'undefined', raw: undefined },
            { name: 'object',    raw: { foo: 1 } },
            { name: 'string',    raw: '[]' },
            { name: 'number',    raw: 42 },
        ])('$name', ({ raw }) => {
            expect(repairLayout(raw)).toEqual([]);
        });

        it('empty array → []', () => {
            expect(repairLayout([])).toEqual([]);
        });
    });

    describe('unreadable item → dropped with a warning', () => {
        const { id: _id, ...withoutId } = stat('a', 0, 0);

        it.each([
            { name: 'not an object',        item: 42 },
            { name: 'null',                 item: null },
            { name: 'without id',           item: withoutId },
            { name: 'empty id',             item: { ...stat('a', 0, 0), id: '' } },
            { name: 'id is not a string',   item: { ...stat('a', 0, 0), id: 7 } },
            { name: 'without size',         item: { ...stat('a', 0, 0), size: undefined } },
            { name: 'width is a string',    item: { ...stat('a', 0, 0), size: { width: '2', height: 1 } } },
            { name: 'x is NaN',             item: { ...stat('a', 0, 0), position: { x: NaN, y: 0 } } },
            { name: 'y is not an integer',  item: { ...stat('a', 0, 0), position: { x: 0, y: 1.5 } } },
        ])('$name', ({ item }) => {
            expect(repairLayout([item])).toEqual([]);
            expect(console.warn).toHaveBeenCalled();
        });

        it('valid neighbours are kept', () => {
            expect(repairLayout([stat('a', 0, 0), 42, stat('b', 2, 0)])).toEqual([stat('a', 0, 0), stat('b', 2, 0)]);
        });
    });

    describe('unknown type → dropped with a warning', () => {
        it.each([
            { name: 'removed from the catalog',  type: 'nutrition.oldWidget' },
            { name: 'inherited key (toString)',  type: 'toString' },
        ])('$name', ({ type }) => {
            expect(repairLayout([{ ...stat('a', 0, 0), type }])).toEqual([]);
            expect(console.warn).toHaveBeenCalled();
        });
    });

    it('duplicate id → the second one is dropped', () => {
        expect(repairLayout([stat('a', 0, 0), stat('a', 4, 0)])).toEqual([stat('a', 0, 0)]);
        expect(console.warn).toHaveBeenCalled();
    });

    it('extra fields are not kept', () => {
        const withExtra = { ...stat('a', 0, 0), bgColor: 'red' };
        expect(repairLayout([withExtra])).toEqual([stat('a', 0, 0)]);
    });

    describe('invalid geometry → moved to the bottom', () => {
        it('x 11 w 2 → moved to the bottom', () => {
            const result = repairLayout([stat('a', 0, 0), stat('b', 11, 0)]);
            expect(positionOf(result, 'b')).toEqual({ x: 0, y: 1 });
        });

        it.each([
            { name: 'negative x', widget: stat('b', -1, 0) },
            { name: 'negative y', widget: stat('b', 0, -1) },
        ])('$name → moved to the bottom', ({ widget }) => {
            const result = repairLayout([stat('a', 0, 0), widget]);
            expect(positionOf(result, 'b')).toEqual({ x: 0, y: 1 });
        });

        it('1×1 → clamped to 2×1 and moved', () => {
            const result = repairLayout([stat('a', 0, 0, 1, 1)]);
            expect(result).toEqual([stat('a', 0, 0, 2, 1)]);
        });

        it('chart below its archetype min (2×1) → clamped to 3×2', () => {
            const result = repairLayout([chart('c', 0, 0, 2, 1)]);
            expect(result[0].size).toEqual({ width: 3, height: 2 });
        });

        it('too wide → clamped to the grid width', () => {
            const result = repairLayout([stat('a', 0, 0, 20, 1)]);
            expect(result[0].size).toEqual({ width: 12, height: 1 });
        });
    });

    describe('overlap → the second in reading order is moved', () => {
        it('two overlapping widgets → the second one moved to the bottom', () => {
            const result = repairLayout([stat('a', 0, 0), stat('b', 1, 0)]);
            expect(positionOf(result, 'a')).toEqual({ x: 0, y: 0 });
            expect(positionOf(result, 'b')).toEqual({ x: 0, y: 1 });
        });

        it('reading order wins over array order', () => {
            const result = repairLayout([stat('b', 1, 0), stat('a', 0, 0)]);
            expect(positionOf(result, 'a')).toEqual({ x: 0, y: 0 });
            expect(positionOf(result, 'b')).toEqual({ x: 0, y: 1 });
        });

        it('moved below the lowest widget, not into a hole', () => {
            // Free space at x 3..12 on row 0, but the overlapping widget goes under the chart (y 3)
            const result = repairLayout([chart('c', 0, 0, 3, 3), stat('b', 0, 0)]);
            expect(positionOf(result, 'b')).toEqual({ x: 0, y: 3 });
        });
    });

    it('two invalid widgets → moved in their original order', () => {
        const result = repairLayout([stat('a', 0, 0), stat('x', 11, 0), stat('y', -1, 0)]);
        expect(result.map((w) => [w.id, w.position.y])).toEqual([['a', 0], ['x', 1], ['y', 2]]);
    });

    it('two invalid widgets do not overlap each other', () => {
        const result = repairLayout([stat('x', 11, 0), stat('y', 11, 0)]);
        expect(positionOf(result, 'x')).toEqual({ x: 0, y: 0 });
        expect(positionOf(result, 'y')).toEqual({ x: 0, y: 1 });
    });

    describe('fully valid layout → returned unchanged', () => {
        it('same content, same order', () => {
            const layout = [stat('a', 0, 0), stat('b', 2, 0), chart('c', 0, 1)];
            expect(repairLayout(layout)).toEqual(layout);
        });

        it('array order is kept even when not in reading order', () => {
            const layout = [chart('c', 0, 1), stat('b', 2, 0), stat('a', 0, 0)];
            expect(repairLayout(layout)).toEqual(layout);
        });

        it('no warning', () => {
            repairLayout([stat('a', 0, 0), chart('c', 0, 1)]);
            expect(console.warn).not.toHaveBeenCalled();
        });
    });

    describe('purity', () => {
        it('does not mutate the input', () => {
            const raw = [stat('a', 0, 0), stat('b', 11, 0)];
            const copy = structuredClone(raw);
            repairLayout(raw);
            expect(raw).toEqual(copy);
        });

        it('same input → same output', () => {
            const raw = [stat('b', 1, 0), stat('a', 0, 0), stat('x', 11, 0)];
            expect(repairLayout(raw)).toEqual(repairLayout(raw));
        });
    });
});
