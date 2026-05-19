import type { IconProps } from "@/components/icons/icons.types";
import { iconWeightMap, sizeMapTW } from "@/shared/styles";

export default function Icon({icon : IconComponent, className, size, iconWeight} : IconProps) {

    return (
        <span className={`${className ?? ""} ${sizeMapTW[size ?? "custom"]} ${iconWeightMap[iconWeight ?? "custom"]} inline-flex [&>svg]:w-full [&>svg]:h-full`}>
            {<IconComponent />}
        </span>
    )
}