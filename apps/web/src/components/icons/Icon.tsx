import type { IconProps } from "@/components/icons/icons.types";
import { sizeMapTW } from "@/shared/styles";

export default function Icon({icon, className, size} : IconProps) {

    return (
        <span className={`${className ?? ""} ${sizeMapTW[size ?? "custom"]} inline-flex [&>svg]:w-full [&>svg]:h-full`}>
            {icon}
        </span>
    )
}