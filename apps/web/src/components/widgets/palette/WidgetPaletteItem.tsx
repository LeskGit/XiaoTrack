import { Icon, IconButton } from "@/components/icons";
import { PlusIcon } from "@/components/icons/library";
import type React from "react";


type WidgetPaletteItemProps = {
    readonly title: string;
    readonly description: string;
    readonly icon: React.ComponentType;
    readonly isPlaced: boolean;
    readonly onAdd: () => void;
}

export default function WidgetPaletteItem({title, description, icon, isPlaced, onAdd}: WidgetPaletteItemProps) {

    return (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:border-gray-300">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                {<Icon icon={icon} />}
            </span>

            <div className="min-w-0 flex-1">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
            {isPlaced ? (
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                    Added
                </span>
            ) : (
                <IconButton 
                    className="background-blue-300" 
                    icon={PlusIcon} 
                    onClick={onAdd} 
                    ariaLabel={`Add ${title}`}
                    classNameBtn="h-8 w-8 shrink-0 rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700" />
            )}
        </div>
    )
}