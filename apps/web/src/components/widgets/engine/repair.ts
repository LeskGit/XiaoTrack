import { widgetCatalog } from "../catalog";
import type { WidgetInstance } from "../widgets.types";
import { bottomY, clampSize, isInsideGrid, overlaps, sortReadingOrder } from "./geometry";
import { hasValidSize, minSizeOf } from "./instance";

/**
 * Check that a value is a non-null object, so its fields can be read
 * @param value
 * @returns boolean : if True, value is a Record<string, unknown>
 */
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

/**
 * Check that a value has the full shape of a WidgetInstance and a type known by the catalog
 * @param value
 * @returns boolean : if True, value is a WidgetInstance
 */
function isWidgetInstance(value: unknown): value is WidgetInstance {
    if (!isRecord(value)) {return false;}
    const {id, type, size, position} = value;
    return (
        typeof id === "string" && id !== "" &&
        typeof type === "string" && 
        Object.hasOwn(widgetCatalog, type) &&
        isRecord(size) &&
        isRecord(position) &&
        Number.isInteger(size.width) && Number.isInteger(size.height) &&
        Number.isInteger(position.x) && Number.isInteger(position.y)
    )
}

/**
 * Turn untrusted persisted data into a layout the grid can display
 * @param raw already parsed data, shape unknown
 * @returns WidgetInstance[] : valid, inside the grid, no overlap
 */
export function repairLayout(raw: unknown): WidgetInstance[] {
    if (!Array.isArray(raw)) {return [];}

    // 1. Keep readable widgets, as clean copies
    const candidates: WidgetInstance[] = [];
    const seenIds: Set<string> = new Set<string>()

    for (const  item of raw) {
        
        if (!isWidgetInstance(item)) {
            console.warn("[layout] unreadable widget dropped", item);
            continue;
        }

        if (seenIds.has(item.id)) {
            console.warn(`[layout] duplicate id "${item.id}" dropped`);
            continue;
        }

        seenIds.add(item.id);
        candidates.push({
            id: item.id,
            type: item.type,
            size: { width: item.size.width, height: item.size.height },
            position: { x: item.position.x, y: item.position.y },
        });
    }

    // 2. Place valid widgets in reading order: on overlap, the second one is repaired
    const placedWidgets: WidgetInstance[] = [];
    for (const widget of sortReadingOrder(candidates)) {
        const isValid: boolean = (isInsideGrid(widget) && hasValidSize(widget) && placedWidgets.every((other) => !overlaps(widget, other)));
        if (isValid) {placedWidgets.push(widget);}
    }

    // 3. Move the others to the bottom, in their original order
    const repaired = new Map<string, WidgetInstance>();
    for (const widget of candidates) {
        if (placedWidgets.includes(widget)) continue;
        const fixed: WidgetInstance = {
            ...widget,
            size: clampSize(widget.size, minSizeOf(widget.type)),
            position: { x: 0, y: bottomY(placedWidgets) },
        };
        placedWidgets.push(fixed);
        repaired.set(widget.id, fixed);
    }

    // 4. Keep the original order, so a valid layout comes back identical
    return candidates.map((widget) => repaired.get(widget.id) ?? widget);
}