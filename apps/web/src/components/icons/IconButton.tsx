import type { IconButtonProps } from "@/components/icons/icons.types";
import Icon from "./Icon";

export default function IconButton({onClick, classNameBtn, ...iconProps}: IconButtonProps) {

    return (
        <button onClick={onClick} className={`inline-flex items-center justify-center ${classNameBtn}`}>
            <Icon {...iconProps} />
        </button>
    )
}