import type { IconButtonProps } from "@/components/icons/icons.types";
import Icon from "./Icon";

export default function IconButton({onClick, classNameBtn, ...iconProps}: IconButtonProps) {

    return (
        <button onClick={onClick} className={classNameBtn}>
            <Icon {...iconProps} />
        </button>
    )
}