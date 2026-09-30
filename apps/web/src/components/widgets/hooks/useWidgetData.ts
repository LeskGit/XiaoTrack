import type { DataState } from "@/shared/types/state.types";
import type { WidgetInstance } from "../widgets.types";
import type { StatData } from "../widget-states.types";



export const useWidgetData = (instance: WidgetInstance): DataState<StatData> => {
    const data:DataState<StatData> = { status: "success", data: { value: 1840, unit: "kcal" } };
    return data
}