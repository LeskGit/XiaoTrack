import WidgetCard from "./WidgetCard";
import Widget from "./Widget";
import type { WidgetInstance } from "./catalog";

type WidgetGridProps = { widgets: WidgetInstance[] };

export default function WidgetGrid({widgets}: WidgetGridProps) {
    return (
        <div className="grid grid-cols-12  grid-rows-[250px] gap-4">
            {widgets.map((w) => <Widget instance={w} />)} 
        </div>
    );
}