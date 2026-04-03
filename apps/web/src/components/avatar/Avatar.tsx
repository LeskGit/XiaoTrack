import { sizeMapTW, type AvatarProps } from '.'

export default function Avatar({src, className, alt, size}: AvatarProps) {

    return (
        <div className={`flex rounded ${sizeMapTW[size ?? "custom"]} ${className ?? ""}`}>
            <img src={src ?? "@/assets/img/avatar/dog.png"} alt={alt ?? ""} />
        </div>
    )
}