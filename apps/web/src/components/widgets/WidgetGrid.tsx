import WidgetCard from "./WidgetCard";
import Widget from "./Widget";
import type { WidgetInstance } from "./catalog";

type WidgetGridProps = { widgets: WidgetInstance[] };

export default function WidgetGrid({widgets}: WidgetGridProps) {
    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))]  auto-rows-[250px] p-4 gap-4">
            {widgets.map((w) => <Widget instance={w} />)} 
        </div>
    );
}