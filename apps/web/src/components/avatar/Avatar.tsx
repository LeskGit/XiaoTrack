import type { AvatarProps } from '.'

export default function Avatar({src, className, classNameContainer, size}: AvatarProps) {

    const defaultClassName = "flex rounded";
    const defaultSize = "md";

    return (
        <div className={classNameContainer != "" ? classNameContainer : defaultClassName}>
            <img src={src} className={className ?? ""} alt="" />
        </div>
    )
}