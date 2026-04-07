import type { IconProps } from "@/components/icons/icons.types";
import IconBase from "@/components/icons/IconBase";
import { sizeMapTW } from "@/shared/styles";

export default function Icon(props: IconProps) {

    const {className, size, ...baseIconProps} = props;

    return (
        <div className={`${className ?? ""} ${sizeMapTW[size ?? "custom"]}`}>
            <IconBase {...baseIconProps} />
        </div>
    )
}