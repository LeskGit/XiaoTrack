import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/shared/utils";

const COUNT_UP_MS = 700;

/**
 * Animates a number from its previous value (0 on mount) to `target`, one step per frame.
 * Returns the value to display. With reduced motion, jumps straight to the target.
 */
export const useCountUp = (target: number, durationMs: number = COUNT_UP_MS): number => {
    const [display, setDisplay] = useState(0);
    // Where the next animation starts: the value currently shown (an interrupted count keeps going from there)
    const fromRef = useRef(0);

    useEffect(() => {
        const from: number = fromRef.current;
        const instant: boolean = prefersReducedMotion();
        const start: number = performance.now();
        let frame: number;

        const tick = (now: number) => {
            const progress: number = instant ? 1 : Math.min((now - start) / durationMs, 1);
            // easeOutCubic: fast at first, slows down near the target
            const eased: number = 1 - (1 - progress) ** 3;
            const value: number = from + (target - from) * eased;
            fromRef.current = value;
            setDisplay(value);
            if (progress < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [target, durationMs]);

    return display;
};
