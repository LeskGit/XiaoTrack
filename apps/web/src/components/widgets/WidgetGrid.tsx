import type { CSSProperties, ReactNode } from "react";
import Widget from "./Widget";
import type { WidgetInstance } from "./widgets.types";
import "./widget-grid.css";
import { GRID_COLS } from "./widget-grid.constants";
import { sortReadingOrder } from "./engine/geometry";

type WidgetGridProps = {
    readonly widgets: WidgetInstance[];
    readonly toolbar?: ReactNode;
};

export default function  WidgetGrid({widgets, toolbar}: WidgetGridProps) {

    const sortedWidgets: WidgetInstance[] = sortReadingOrder(widgets);

    return (
        <div className="p-4">
            <div className="widget-grid-frame">
                {toolbar}
                <div className="widget-grid" style={{"--cols": GRID_COLS} as CSSProperties}>
                    {sortedWidgets.map((w) => (
                    <div className="widget-cell" style={{"--col": w.position.x + 1, "--row": w.position.y + 1, "--w": w.size.width, "--h": w.size.height} as CSSProperties} key={w.id}>
                        <Widget instance={w} />
                    </div>
                    ))}
                </div>
            </div>
        </div>
    );
}