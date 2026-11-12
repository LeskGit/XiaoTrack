import { Icon, IconButton } from "@/components/icons";
import { CheckIcon, PlusIcon } from "@/components/icons/library";
import type React from "react";
import type { CSSProperties } from "react";
import type { GridSize } from "../widgets.types";
import { GRID_COLS } from "../widget-grid.constants";

type WidgetPaletteItemProps = {
    readonly title: string;
    readonly size: GridSize;
    readonly icon: React.ComponentType;
    readonly isPlaced: boolean;
    readonly onAdd: () => void;
}

export default function WidgetPaletteItem({title, size, icon, isPlaced, onAdd}: WidgetPaletteItemProps) {

    return (
        <li className={`palette-item ${isPlaced ? "is-placed" : ""}`}>
            <span className="palette-item-icon">
                <Icon icon={icon} size="custom" className="h-5 w-5" />
            </span>

            <div className="min-w-0 flex-1">
                <h4 className="truncate text-sm font-medium text-gray-900">{title}</h4>
                <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    {/* Mini map of the default size: w × h cells of a 12-column row */}
                    <span
                        className="palette-size"
                        aria-hidden="true"
                        style={{ "--cols": GRID_COLS, "--w": size.width, "--h": size.height } as CSSProperties}
                    >
                        <span className="palette-size-fill" />
                    </span>
                    {size.width} × {size.height}
                </p>
            </div>

            {isPlaced ? (
                <span className="palette-item-added">
                    <Icon icon={CheckIcon} size="custom" className="h-3.5 w-3.5" iconWeight="bold" />
                    Added
                </span>
            ) : (
                <IconButton
                    icon={PlusIcon}
                    size="custom"
                    className="h-4 w-4"
                    iconWeight="bold"
                    onClick={onAdd}
                    ariaLabel={`Add ${title}`}
                    classNameBtn="palette-item-add" />
            )}
        </li>
    )
}
