import type { CSSProperties } from "react";
import Widget from "./Widget";
import type { WidgetInstance } from "./catalog";
import "./widget-grid.css";

type WidgetGridProps = { widgets: WidgetInstance[] };

export default function WidgetGrid({widgets}: WidgetGridProps) {
    return (
        <div className="p-4">
            <div className="widget-grid-frame">
                <div className="widget-grid">
                    {widgets.map((w) => (
                    <div className="widget-cell" style={{"--col": w.position.x + 1, "--row": w.position.y + 1, "--w": w.size.width, "--h": w.size.height} as CSSProperties} key={w.id}>
                        <Widget key={w.id} instance={w} />
                    </div>
                    ))}
                </div>
            </div>
        </div>
    );
}