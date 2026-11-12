import type { BodyProps, WidgetArchetype } from "../widgets.types";
import { useCountUp } from "../hooks/useCountUp";

type StatBodyProps = BodyProps<typeof WidgetArchetype.ArchetypeStat>;

// Number of decimals written in the raw value (1840 → 0, 72.5 → 1): the count-up keeps the same precision
const decimalsOf = (value: number): number => (String(value).split(".")[1] ?? "").length;

export default function StatBody({ data }: StatBodyProps) {
    const shown: number = useCountUp(data.value);
    const decimals: number = decimalsOf(data.value);
    const formatted: string = new Intl.NumberFormat("en", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(shown);

    return (
        <div className="stat-body">
            <p className="stat-body-value">
                {formatted}
                {data.unit && <span className="stat-body-unit">{data.unit}</span>}
            </p>
            {data.caption && <p className="stat-body-caption">{data.caption}</p>}
        </div>
    );
}
