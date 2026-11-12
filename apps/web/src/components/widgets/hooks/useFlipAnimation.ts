import { useLayoutEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion } from "@/shared/utils";

type Point = { readonly x: number; readonly y: number };

type UseFlipAnimationOptions = {
    readonly gridRef: RefObject<HTMLDivElement | null>;
    // The held widget follows the pointer by itself: never animated while held
    readonly draggingId: string | null;
    readonly dragDelta: Point | null;
};

// Tag of our animations, to tell them apart from the CSS ones (entrance, exit) on the same cell
const FLIP_ANIMATION_ID = "widget-flip";
// Neighbours making room, compaction after add / remove
const MOVE_MS = 280;
const MOVE_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
// The released widget, from where the pointer left it to its cell: a small overshoot, it "lands"
const SETTLE_MS = 420;
const SETTLE_EASING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

/**
 * FLIP animation of the grid cells (cadrage V2 §7).
 * CSS cannot animate a change of grid-column / grid-row: the cell jumps. So after each render:
 *   First  — the position the cell had at the previous render (stored below);
 *   Last   — its new position, read now, before the browser paints;
 *   Invert — a transform that puts it back, visually, at the First position;
 *   Play   — animate that transform back to none.
 * Positions are read with offsetLeft / offsetTop: relative to the grid (position: relative),
 * so they ignore the page scroll and the transforms (drag translate, running animations).
 */
export const useFlipAnimation = ({ gridRef, draggingId, dragDelta }: UseFlipAnimationOptions): void => {
    // Cell positions at the previous render, by widget id
    const positionsRef = useRef<Map<string, Point>>(new Map());
    // Grid width at the previous render: if it changed (window resized), everything moved, nothing to animate
    const gridWidthRef = useRef<number>(0);
    // The widget being held and its last offset: at release, it starts from there instead of from its cell
    const heldRef = useRef<{ id: string; delta: Point } | null>(null);

    // No dependency array: runs after every render, the moves can come from anywhere
    useLayoutEffect(() => {
        const grid = gridRef.current;
        if (!grid) return;

        const previous = positionsRef.current;
        const next = new Map<string, Point>();
        const sameWidth: boolean = grid.offsetWidth === gridWidthRef.current;
        const animate: boolean = sameWidth && !prefersReducedMotion();
        // Released during this render: the gesture was running, and is not anymore
        const released = draggingId === null ? heldRef.current : null;

        for (const cell of grid.querySelectorAll<HTMLElement>(":scope > .widget-cell[data-id]")) {
            const id = cell.dataset.id;
            if (!id) continue;

            const last: Point = { x: cell.offsetLeft, y: cell.offsetTop };
            next.set(id, last);

            const first = previous.get(id);
            // New cell (its CSS entrance plays), or held one: nothing to do
            if (!animate || !first || id === draggingId) continue;

            let dx: number = first.x - last.x;
            let dy: number = first.y - last.y;
            const isReleased: boolean = released?.id === id;
            if (released && isReleased) {
                dx += released.delta.x;
                dy += released.delta.y;
            }
            if (dx === 0 && dy === 0) continue;

            // Moved again while still animating: start from where it is on screen right now,
            // otherwise it would jump back to its old cell first
            const running = cell.getAnimations().filter((a) => a.id === FLIP_ANIMATION_ID);
            if (running.length > 0) {
                const current = new DOMMatrixReadOnly(getComputedStyle(cell).transform);
                dx += current.m41;
                dy += current.m42;
                running.forEach((a) => a.cancel());
            }

            const flip = cell.animate(
                [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
                isReleased
                    ? { duration: SETTLE_MS, easing: SETTLE_EASING }
                    : { duration: MOVE_MS, easing: MOVE_EASING },
            );
            flip.id = FLIP_ANIMATION_ID;
        }

        positionsRef.current = next;
        gridWidthRef.current = grid.offsetWidth;
        if (draggingId === null) {
            heldRef.current = null;
        } else if (dragDelta) {
            heldRef.current = { id: draggingId, delta: dragDelta };
        }
    });
};
