/**
 * The system asks for less motion (accessibility setting).
 * CSS is already handled globally in index.css; JS animations (WAAPI, requestAnimationFrame,
 * smooth scrolling, timers waiting for an animation) must check this themselves.
 */
export function prefersReducedMotion(): boolean {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
