import type { ChartWidgetDefinition } from "../widgets.types";
import { Icon } from "@/components/icons";

type ChartBodyProps = {readonly data: ChartWidgetDefinition}

export default function ChartBody({data}: ChartBodyProps) {
    
    return (
        <div className="flex w-full h-full m-3">
            <Icon icon={data.icon} size="lg" />
            <h1>{data.title}</h1>
            <p>CHARTTTTTTTT</p>
        </div>
    )
}