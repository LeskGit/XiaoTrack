import type { StatData } from "../widget-states.types";


type StatBodyProps = { readonly data: StatData };

export default function StatBody({ data }: StatBodyProps) {
    
    return (
        <div className="flex border border-gray-300 rounded-sm">
            <p> {data.value} {data.unit}</p>
        </div>
    )
}