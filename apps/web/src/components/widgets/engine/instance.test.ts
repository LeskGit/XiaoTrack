import { describe, it, expect, vi } from 'vitest';
import { createInstance, resolveWidgetDefaultSize } from './instance';
import { overlaps } from './geometry';
import { widgetArchetypes } from '../archetypes';
import { GRID_COLS } from '../widget-grid.constants';
import type { WidgetType } from '../catalog';
import type { GridRect } from '../widgets.types';

// Faux catalogue : remplace '../catalog' pour TOUT ce fichier (hoisté en haut).
// La factory ne doit dépendre d'aucun import du fichier.
vi.mock('../catalog', () => ({
    widgetCatalog: {
        'test.stat':          { title: 'Stat',        icon: () => null, endpoint: '/', archetype: 'stat', unit: 'u' },
        'test.chart':         { title: 'Chart',       icon: () => null, endpoint: '/', archetype: 'chart' },
        'test.chartCustom':   { title: 'Custom',      icon: () => null, endpoint: '/', archetype: 'chart', defaultSize: { width: 6, height: 3 } },
        'test.chartTooSmall': { title: 'Too small',   icon: () => null, endpoint: '/', archetype: 'chart', defaultSize: { width: 1, height: 1 } },
        'test.chartTooWide':  { title: 'Too wide',    icon: () => null, endpoint: '/', archetype: 'chart', defaultSize: { width: 20, height: 2 } },
    },
}));

// Helpers
const type = (key: string) => key as WidgetType;
const rect = (x: number, y: number, width: number, height: number): GridRect => ({
    position: { x, y },
    size: { width, height },
});

const stat = widgetArchetypes.stat;
const chart = widgetArchetypes.chart;

describe('resolveWidgetDefaultSize', () => {
    it.each([
        ["pas de défaut catalogue → défaut de l'archétype (stat)",  'test.stat',        stat.defaultSize],
        ["pas de défaut catalogue → défaut de l'archétype (chart)", 'test.chart',       chart.defaultSize],
        ['défaut catalogue valide → prioritaire',                    'test.chartCustom', { width: 6, height: 3 }],
        ["défaut catalogue trop petit → borné au min de l'archétype", 'test.chartTooSmall', chart.minSize],
        ['défaut catalogue trop large → borné à GRID_COLS',          'test.chartTooWide', { width: GRID_COLS, height: 2 }],
    ])('%s', (_, key, expected) => {
        expect(resolveWidgetDefaultSize(type(key))).toEqual(expected);
    });

    it('ne renvoie jamais une taille hors bornes, pour aucune entrée', () => {
        const keys = ['test.stat', 'test.chart', 'test.chartCustom', 'test.chartTooSmall', 'test.chartTooWide'];
        for (const key of keys) {
            const size = resolveWidgetDefaultSize(type(key));
            expect(size.width).toBeLessThanOrEqual(GRID_COLS);
            expect(size.width).toBeGreaterThanOrEqual(stat.minSize.width);
            expect(size.height).toBeGreaterThanOrEqual(stat.minSize.height);
        }
    });
});

describe('createInstance', () => {
    it('grille vide → (0, 0) avec la taille résolue et le bon type', () => {
        expect(createInstance(type('test.stat'), [])).toEqual({
            id: expect.any(String),
            type: 'test.stat',
            size: stat.defaultSize,
            position: { x: 0, y: 0 },
        });
    });

    it('deux créations → deux ids différents', () => {
        const a = createInstance(type('test.stat'), []);
        const b = createInstance(type('test.stat'), []);
        expect(a.id).not.toBe(b.id);
    });

    it('se place juste à droite du widget existant', () => {
        const instance = createInstance(type('test.stat'), [rect(0, 0, 2, 1)]);
        expect(instance.position).toEqual({ x: 2, y: 0 });
    });

    it('remplit un trou assez grand', () => {
        // Rangée 0 pleine sauf un trou 2×1 en x = 4
        const existing = [rect(0, 0, 4, 1), rect(6, 0, 6, 1)];
        expect(createInstance(type('test.stat'), existing).position).toEqual({ x: 4, y: 0 });
    });

    it('saute un trou trop petit et va en dessous', () => {
        // Trou 2×1 en x = 4, mais un chart fait au moins 4×2
        const existing = [rect(0, 0, 4, 1), rect(6, 0, 6, 1)];
        const instance = createInstance(type('test.chart'), existing);
        expect(instance.position.y).toBeGreaterThanOrEqual(1);
    });

    it('un widget trop large est borné à GRID_COLS et placé en x = 0', () => {
        const instance = createInstance(type('test.chartTooWide'), [rect(0, 0, 2, 1)]);
        expect(instance.size.width).toBe(GRID_COLS);
        expect(instance.position).toEqual({ x: 0, y: 1 });
    });

    it("ne chevauche jamais un widget existant", () => {
        const existing = [rect(0, 0, 3, 2), rect(5, 0, 7, 1), rect(3, 1, 4, 2)];
        const instance = createInstance(type('test.chart'), existing);
        expect(existing.every((r) => !overlaps(instance, r))).toBe(true);
    });

    it('ne modifie pas le tableau existant', () => {
        const existing = Object.freeze([rect(0, 0, 2, 1)]);
        createInstance(type('test.stat'), existing);
        expect(existing).toHaveLength(1);
    });
});