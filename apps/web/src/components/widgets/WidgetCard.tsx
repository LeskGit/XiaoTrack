import type { BaseCompoundProps } from "@/shared/types/compound.types";


export default function WidgetCard({children}: BaseCompoundProps) {
    
    return (
        <div className={`bg-white border border-gray-200 rounded-xl h-full shadow-sm flex flex-col gap-2.5`}>
            { children }
        </div>
    );
}