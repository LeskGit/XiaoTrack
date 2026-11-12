import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { prefersReducedMotion } from "@/shared/utils";

type WidgetGridCellProps = {
    readonly id: string;
    readonly className: string;
    readonly style: CSSProperties;
    // True when the cell appears after the first display, in edit mode: a widget was just added
    readonly isAddedNow: boolean;
    readonly children: ReactNode;
};

/**
 * One cell of the grid. Its only behaviour: a widget that was just added
 * scrolls into view and gets a short highlight ring.
 */
export default function WidgetGridCell({ id, className, style, isAddedNow, children }: WidgetGridCellProps) {
    const ref = useRef<HTMLDivElement>(null);
    // Frozen at mount: later renders must not turn the highlight on or off
    const [isNew] = useState(isAddedNow);

    useEffect(() => {
        if (!isNew) return;
        ref.current?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest" });
    }, [isNew]);

    return (
        <div ref={ref} data-id={id} className={`${className} ${isNew ? "is-new" : ""}`} style={style}>
            {children}
        </div>
    );
}
