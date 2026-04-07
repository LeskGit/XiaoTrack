import type { IconButtonPropsSvg } from "@/components/icons/icons.types";
import { sizeMapTW } from "@/shared/styles";
import Icon from "./Icon";

export default function IconButton(props: IconButtonPropsSvg) {

    const {onClick, className, size, ...baseIconProps} = props;

    return (
        <button onClick={onClick}>
            <Icon className={`${className ?? ""} ${sizeMapTW[size ?? "custom"]}`} {...baseIconProps} />
        </button>
    )
}