import { widgetArchetypes } from "../archetypes";
import { widgetCatalog, type WidgetType } from "../catalog";
import type { ArchetypeDefinition, GridPosition, GridRect, GridSize, WidgetDefinition, WidgetInstance } from "../widgets.types";
import { clampSize, findFirstFreeSpot } from "./geometry";


/**
 * Size or catalogDefaultSize or archetypeDefaultSize or MIN_SIZE 
 * @param size 
 * @param catalogKey 
 * @returns GridSize 
 */
export function resolveWidgetDefaultSize(catalogKey: WidgetType): GridSize {
    const catalogValue: WidgetDefinition = widgetCatalog[catalogKey];
    const archetypeDef: ArchetypeDefinition = widgetArchetypes[catalogValue.archetype];
    const defaultSize: GridSize = catalogValue.defaultSize ?? archetypeDef.defaultSize;
    return clampSize(defaultSize, archetypeDef.minSize);
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