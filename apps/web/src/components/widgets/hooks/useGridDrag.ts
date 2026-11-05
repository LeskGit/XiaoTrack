import type { RefObject } from "react"
import type { WidgetInstance } from "../widgets.types";

export type  UseGridDragOptions = {
    readonly gridRect: RefObject<HTMLDivElement | null>;
    readonly widgets: WidgetInstance[];
    readonly onDrop: (layout: WidgetInstance[]) => void;
}

export type UseGridDragResult = {
    readonly draggingId: string | null;
    readonly startDrag: (id: string, event: React.PointerEvent) => void;
}

export const useGridDrag({gridRect, widgets, onDrop}: UseGridDragOptions) {
    
}