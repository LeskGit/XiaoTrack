import { describe, it, expect } from 'vitest';
import { overlaps } from './geometry'; 
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
        expect(overlaps(b, a)).toBe(true); // symétrie
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
    it.each
})