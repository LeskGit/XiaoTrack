import { describe, it } from 'vitest';

describe('pointToCell', () => {
    it.todo('corner exactly on a cell → that cell');
    it.todo('just before half a cell → same cell');
    it.todo('just after half a cell → next cell');
    it.todo('pointer left of the grid → x 0');
    it.todo('wide widget near the right edge → x = 12 − w');
    it.todo('pointer above the grid → y 0');
    it.todo('grid shifted in the page (scroll) → same cell');
});
