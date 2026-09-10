import type { WidgetDefinition } from "../widgets.types";
import { Icon } from "@/components/icons";

type StatBodyProps = {data: WidgetDefinition}

export default function StatBody({data}: StatBodyProps) {
    return (
        <div className="flex w-full h-full m-3">
            <Icon icon={data.icon} size="lg" />
            {data.title}
        </div>
    )
}