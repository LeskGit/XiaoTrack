import type { IconButtonProps } from "@/components/icons/icons.types";
import Icon from "./Icon";

export default function IconButton({onClick, classNameBtn, ariaLabel, ...iconProps}: IconButtonProps) {

    return (
        <button onClick={onClick} aria-label={ariaLabel} className={`inline-flex cursor-pointer items-center justify-center ${classNameBtn}`}>
            <Icon {...iconProps} />
        </button>
    )
}