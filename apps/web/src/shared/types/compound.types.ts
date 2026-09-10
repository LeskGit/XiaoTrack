import type { ReactElement } from "react"


export type BaseCompoundProps = {
    children: ReactElement;
    className?: string;
};

export type WidgetCardProps = BaseCompoundProps & (
    {width: number, height: number}
);