import type { IconButtonPropsSvg } from "@/components/icons/icons.types";
import IconBase from "@/components/icons/IconBase";

export default function IconButton(props: IconButtonPropsSvg) {

    const defaultClassName = "";
    const {onClick, classNameButton , ...baseIconProps} = props;

    return (
        <button onClick={onClick} className={classNameButton ?? defaultClassName}>
            <IconBase {...baseIconProps} />
        </button>
    )
}