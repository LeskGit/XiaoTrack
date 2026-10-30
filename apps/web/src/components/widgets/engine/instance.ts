import { widgetArchetypes } from "../archetypes";
import { widgetCatalog, type WidgetType } from "../catalog";
import type { ArchetypeSizes, GridPosition, GridRect, GridSize, WidgetDefinition, WidgetInstance } from "../widgets.types";
import { clampSize, findFirstFreeSpot } from "./geometry";


/**
 * Size or catalogDefaultSize or archetypeDefaultSize or MIN_SIZE 
 * @param size 
 * @param catalogKey 
 * @returns GridSize 
 */
export function resolveWidgetDefaultSize(catalogKey: WidgetType): GridSize {
    const catalogValue: WidgetDefinition = widgetCatalog[catalogKey];
    const archetypeDef: ArchetypeSizes = widgetArchetypes[catalogValue.archetype];
    const defaultSize: GridSize = catalogValue.defaultSize ?? archetypeDef.defaultSize;
    return clampSize(defaultSize, archetypeDef.minSize);
}

/**
 * Minimum size of a widget type, read from its archetype
 * @param type
 * @returns GridSize
 */
export function minSizeOf(type: WidgetType): GridSize {
    return widgetArchetypes[widgetCatalog[type].archetype].minSize;
}

/**
 * Check that a widget is at least as large as its archetype's minimum size
 * @param widget
 * @returns boolean
 */
export function hasValidSize(widget: WidgetInstance): boolean {
    const min = minSizeOf(widget.type);
    return widget.size.width >= min.width && widget.size.height >= min.height;
}

/**
 * Create a brand new WidgetInstance from the catalog, this function must not be called for persisted widgets being re-displayed
 * @param type 
 * @param existing 
 * @returns WidgetInstance 
 */
export function createInstance(type: WidgetType, existing: readonly GridRect[]): WidgetInstance {
    const widgetSize: GridSize = resolveWidgetDefaultSize(type);
    const widgetPosition: GridPosition = findFirstFreeSpot(existing, widgetSize);
    const instance: WidgetInstance = {id: crypto.randomUUID(), type, size: widgetSize, position: widgetPosition};
    return instance;
}