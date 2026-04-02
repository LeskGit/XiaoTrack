import type { AvatarProps } from '.'

export default function Avatar({src, className, classNameContainer, alt}: AvatarProps) {

    const defaultClassName = "flex rounded";
    const defaultSize = "w-8 h-8";

    return (
        <div className={`${defaultClassName} ${classNameContainer ?? ""}`}>
            <img src={src} className="" alt={alt ?? ""} />
        </div>
    )
}