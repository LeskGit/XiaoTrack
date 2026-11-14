type AutoScrollOptions = {
    // Height of the sensitive band along the top and bottom edges, in px
    readonly edge?: number;
    // Speed at the very edge, in px per frame (from 0 at the band's inner limit up to this)
    readonly maxSpeed?: number;
};

export type AutoScroll = {
    // Call on every pointer move: stores the position, starts the loop if it is not running
    readonly update: (clientY: number) => void;
    // Call at every exit of the gesture
    readonly stop: () => void;
};

/**
 * Nearest ancestor that scrolls vertically, or null if none (the window scrolls).
 * Lets a component find what scrolls around it without knowing the app layout.
 */
export const findScrollParent = (element: HTMLElement): HTMLElement | null => {
    let current = element.parentElement;
    while (current) {
        const { overflowY } = getComputedStyle(current);
        if (overflowY === "auto" || overflowY === "scroll") return current;
        current = current.parentElement;
    }
    return null;
};

/**
 * Scrolls `container` while the pointer stays near its top or bottom edge, one step per frame
 * (requestAnimationFrame). The closer to the edge, the faster.
 */
export const startAutoScroll = (
    container: HTMLElement,
    { edge = 60, maxSpeed = 16 }: AutoScrollOptions = {},
): AutoScroll => {
    let frameId: number | null = null;
    let lastY = 0;

    // Signed speed for a pointer position: < 0 near the top, > 0 near the bottom, 0 elsewhere
    const speedAt = (clientY: number): number => {
        const rect = container.getBoundingClientRect();
        // How deep the pointer is in each band, in px (> 0 = inside, or past the edge)
        const intoTop = rect.top + edge - clientY;
        const intoBottom = clientY - (rect.bottom - edge);
        // Capped at the band height: past the edge (over the header), full speed, not more
        if (intoTop > 0) return -Math.ceil((maxSpeed * Math.min(intoTop, edge)) / edge);
        if (intoBottom > 0) return Math.ceil((maxSpeed * Math.min(intoBottom, edge)) / edge);
        return 0;
    };

    const tick = () => {
        const speed = speedAt(lastY);
        const before = container.scrollTop;
        if (speed !== 0) container.scrollTop += speed;

        // Out of the bands, or already at the top/bottom: the loop ends. The next update restarts it.
        if (speed === 0 || container.scrollTop === before) {
            frameId = null;
            return;
        }
        frameId = requestAnimationFrame(tick);
    };

    return {
        update: (clientY) => {
            lastY = clientY;
            frameId ??= requestAnimationFrame(tick);
        },
        stop: () => {
            if (frameId !== null) cancelAnimationFrame(frameId);
            frameId = null;
        },
    };
};