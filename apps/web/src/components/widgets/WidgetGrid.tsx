import type { CSSProperties } from "react";
import Widget from "./Widget";
import type { WidgetInstance } from "./widgets.types";
import "./widget-grid.css";
import { MIN_COLS } from "./widget-grid.constants";

type WidgetGridProps = { widgets: WidgetInstance[] };

export default function WidgetGrid({widgets}: WidgetGridProps) {

    const sortedWidgets: WidgetInstance[] = widgets.toSorted((w1, w2) => w1.position.y - w2.position.y || w1.position.x - w2.position.x);

    return (
        <div className="p-4">
            <div className="widget-grid-frame">
                <div className="widget-grid">
                    {sortedWidgets.map((w) => (
                    <div className="widget-cell" style={{"--cols": MIN_COLS, "--col": w.position.x + 1, "--row": w.position.y + 1, "--w": w.size.width, "--h": w.size.height} as CSSProperties} key={w.id}>
                        <Widget instance={w} />
                    </div>
                    ))}
                </div>
            </div>
        </div>
    );
}