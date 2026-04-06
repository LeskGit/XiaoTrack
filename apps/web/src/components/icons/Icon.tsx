import type { IconProps } from "@/components/icons/icons.types";
import IconBase from "@/components/icons/IconBase";
import { sizeMapTW } from "@/shared/styles";

export default function Icon(props: IconProps) {

    const defaultClassName = "";
    const {className, size, ...baseIconProps} = props;

    return (
        <div className={`${className ?? defaultClassName} ${sizeMapTW[size ?? "custom"]}`}>
            <IconBase {...baseIconProps} />
        </div>
    )
}