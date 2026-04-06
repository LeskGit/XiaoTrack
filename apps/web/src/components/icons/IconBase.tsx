
import type { BaseIconPropsSvg } from "@/components/icons/icons.types"

export default function IconBase({
        xmlns = "http://www.w3.org/2000/svg",
        fill = "none",
        viewBox = "0 0 24 24",
        strokeWidth = 1,
        classNameSvg = "",
        strokeLinecap = "round",
        strokeLinejoin = "round",
        stroke = "black",
        preserveAspectRatio = "xMidYMid meet",
        d }: BaseIconPropsSvg) {

    return (
        <svg xmlns={xmlns} fill={fill} viewBox={viewBox} strokeWidth={strokeWidth} stroke={stroke} className={`w-full h-full ${classNameSvg ?? ""}`} preserveAspectRatio={preserveAspectRatio}>
            <path strokeLinecap= {strokeLinecap} strokeLinejoin={strokeLinejoin} d={d} />
        </svg>
    )
}