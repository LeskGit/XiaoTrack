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
    // CSS colour of the icon tile (catalog entry's tone); undefined = the accent
    readonly tone?: string;
    readonly isPlaced: boolean;
    readonly onAdd: () => void;
}

export default function WidgetPaletteItem({title, size, icon, tone, isPlaced, onAdd}: WidgetPaletteItemProps) {

    return (
        <li className={`palette-item ${isPlaced ? "is-placed" : ""}`}>
            {/* Placed: no tone-tile, the grey "already added" look of palette.css applies
                (a utility would win over it, whatever the selector) */}
            <span
                className={`palette-item-icon ${isPlaced ? "" : "tone-tile"}`}
                style={tone ? { "--tone": tone } as CSSProperties : undefined}
            >
                <Icon icon={icon} size="custom" className="h-5 w-5" />
            </span>

            <div className="min-w-0 flex-1">
                <h4 className="truncate text-label font-medium text-ink">{title}</h4>
                <p className="mt-1 flex items-center gap-2 text-caption text-ink-muted">
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
                    classNameBtn="btn btn-soft btn-icon palette-item-add" />
            )}
        </li>
    )
}
