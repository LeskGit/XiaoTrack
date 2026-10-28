import type { WidgetInstance } from "../widgets.types"


export type LayoutStorage = {
    readonly load: () => Promise<WidgetInstance[]>;
    readonly save: (instances: readonly WidgetInstance[]) => Promise<void>;
}