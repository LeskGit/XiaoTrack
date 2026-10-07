import { describe, it } from 'vitest';

describe('parseLayout', () => {
    it.todo('not an array → []');
    it.todo('item without id → dropped');
    it.todo('unknown type → dropped');
    it.todo('x 11 w 2 → moved to the bottom');
    it.todo('1×1 → clamped to 2×1 and moved if needed');
    it.todo('two overlapping widgets → the second one moved to the bottom');
    it.todo('two invalid widgets → moved in their original order');
    it.todo('fully valid layout → returned unchanged');
});