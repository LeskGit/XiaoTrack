import type { IconButtonPropsSvg } from "@/components/icons/icons.types";
import IconBase from "@/components/icons/IconBase";
import { sizeMapTW } from "@/shared/styles";

export default function IconButton(props: IconButtonPropsSvg) {

    const defaultClassName = "";
    const {onClick, classNameButton , ...baseIconProps} = props;

    return (
        <button onClick={onClick} className={`${classNameButton ?? defaultClassName} ${sizeMapTW[props.size ?? "custom"]}`}>
            <IconBase {...baseIconProps} />
        </button>
    )
}