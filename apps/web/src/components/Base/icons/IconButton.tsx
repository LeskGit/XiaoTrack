import type { IconButtonPropsSvg } from "../../../types/typesIcons";
import IconBase from "./IconBase";

export default function IconButton(props: IconButtonPropsSvg) {

    const defaultClassName = "";
    const {onClick, classNameButton , ...baseIconProps} = props;

    return (
        <button onClick={onClick} className={classNameButton ?? defaultClassName}>
            <IconBase {...baseIconProps} />
        </button>
    )
}