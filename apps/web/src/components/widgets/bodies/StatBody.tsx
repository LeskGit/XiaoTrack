import type { BodyProps, WidgetArchetype } from "../widgets.types";


type StatBodyProps = BodyProps<typeof WidgetArchetype.ArchetypeStat>;

export default function StatBody({ data }: StatBodyProps) {
    
    return (
        <div className="flex border border-gray-300 rounded-sm">
            <p> {data.value} {data.unit}</p>
        </div>
    )
}