import type { WidgetCardProps } from "@/shared/types/compound.types";


export default function WidgetCard({width, height, children}: WidgetCardProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3.5 flex flex-col gap-2.5">
            { children }
        </div>
    );
}