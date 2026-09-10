import type { WidgetSize } from "@/components/widgets/widgets.types";
import type { ReactElement } from "react"


export type BaseCompoundProps = {
    children: ReactElement;
    className?: string;
};

export type WidgetCardProps = BaseCompoundProps & (
    {size: WidgetSize}
);