

export type shapeData = {
    x: number;
    y: number;
    w: number;
    h: number;
}

export type WidgetData = {
    // TODO
}

export type WidgetConfig = 
    | {type: "chart", data: WidgetData}
    | {type: "card", data: WidgetData}
    | {type: "inline", data: WidgetData}

export interface WidgetBase {
    layout: shapeData;
}

export type WidgetInstance = WidgetBase & WidgetConfig;