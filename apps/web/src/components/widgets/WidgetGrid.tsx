import type { WidgetCardProps } from "@/shared/types/compound.types";
import WidgetCard from "./WidgetCard";
import Widget from "./Widget";

export default function WidgetGrid(widgets: WidgetCardProps[]) {
    return (
        <div className="grid grid-cols-[60px] grid-rows-[1fr] gap-1">
            {widgets.map((w) => <WidgetCard width={2} height={1} children={<Widget />} />)};
        </div>
    );
}