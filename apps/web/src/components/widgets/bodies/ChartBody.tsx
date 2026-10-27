// bodies/ChartBody.tsx
import type { BodyProps, WidgetArchetype } from "../widgets.types";

type ChartBodyProps = BodyProps<typeof WidgetArchetype.ArchetypeChart>;

export default function ChartBody({ data }: ChartBodyProps) {
    return <p>Chart — not implemented ({data.points.length} points)</p>;
}