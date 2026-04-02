import type { AvatarProps } from '.'

export default function Avatar({src, className, classNameContainer, alt, size}: AvatarProps) {

    const defaultClassName = "flex rounded";
    const defaultSize = "w-8 h-8";

    return (
        <div className={`${defaultClassName} ${size ?? defaultSize} ${classNameContainer ?? ""}`}>
            <img src={src ?? "../../assets/img/avatar/dog.png"} className={className} alt={alt ?? ""} />
        </div>
    )
}