import type { IconButtonPropsSvg } from "@/components/icons/icons.types";
import IconBase from "@/components/icons/IconBase";
import { sizeMapTW } from "@/shared/styles";

export default function IconButton(props: IconButtonPropsSvg) {

    const defaultClassName = "";
    const {onClick, className, size, ...baseIconProps} = props;

    return (
        <button onClick={onClick} className={`${className ?? defaultClassName} ${sizeMapTW[size ?? "custom"]}`}>
            <IconBase {...baseIconProps} />
        </button>
    )
}